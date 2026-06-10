import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';

import { BACKEND_API_URL, getBackendApiKey } from '@/lib/api/backendConfig';
import { normalizeUser } from '@/lib/utils/normalizeUser';

async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get('authToken')?.value;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const csrfValidation = await validateCsrfFromRequest(request);
    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    const authToken = await getAuthToken();
    if (!authToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          error: 'Authentication token is required',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const backendUrl = `${BACKEND_API_URL}/api/v1/users/${params.id}`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-API-Key': getBackendApiKey(),
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
    } catch (fetchError) {
      console.error('[User Item API PUT] Fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to connect to backend API',
          error: fetchError instanceof Error ? fetchError.message : 'Network error',
        },
        { status: 503 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Failed to update user' };
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to update user',
          error: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawUser = data?.data ?? data;
    const normalizedUser = normalizeUser(rawUser);

    return NextResponse.json(normalizedUser, { status: 200 });
  } catch (error) {
    console.error('[User Item API PUT] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const csrfValidation = await validateCsrfFromRequest(request);
    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    const authToken = await getAuthToken();
    if (!authToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          error: 'Authentication token is required',
        },
        { status: 401 }
      );
    }

    const backendUrl = `${BACKEND_API_URL}/api/v1/users/${params.id}`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'X-API-Key': getBackendApiKey(),
          Authorization: `Bearer ${authToken}`,
        },
        cache: 'no-store',
      });
    } catch (fetchError) {
      console.error('[User Item API DELETE] Fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to connect to backend API',
          error: fetchError instanceof Error ? fetchError.message : 'Network error',
        },
        { status: 503 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Failed to delete user' };
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to delete user',
          error: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => null);
    return NextResponse.json(
      data ?? { success: true, message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[User Item API DELETE] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
