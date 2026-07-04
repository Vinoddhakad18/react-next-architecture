import { NextRequest, NextResponse } from 'next/server';
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { BACKEND_API_URL } from '@/lib/api/backendConfig';
import { backendFetch, resolveRouteAuthToken } from '@/lib/api/backendProxy';
import { readErrorMessage, readJsonResponse } from '@/lib/api/parseResponse';
import { proxyEntitySoftDelete } from '@/lib/api/softDeleteProxy';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const csrfValidation = await validateCsrfFromRequest(request);
    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    const authToken = await resolveRouteAuthToken(request);
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
      response = await backendFetch(backendUrl, {
        method: 'PUT',
        authToken,
        body,
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
      return NextResponse.json(
        {
          success: false,
          message: readErrorMessage(errorText, 'Failed to update user'),
          error: errorText || 'Failed to update user',
        },
        { status: response.status }
      );
    }

    const data = await readJsonResponse(response);
    return NextResponse.json(data, { status: 200 });
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
  return proxyEntitySoftDelete(request, 'users', params.id, 'User');
}
