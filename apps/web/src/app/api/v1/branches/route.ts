/**
 * Branches API Route
 * Proxy for branch list and creation operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';

import { BACKEND_API_URL, getBackendApiKey } from '@/lib/api/backendConfig';
import { toSnakeCaseKeys } from '@/lib/api/snakeCase';
import { readEncryptedListQueryFromRequest } from '@/lib/api/encryptedListQuery';
import { toBackendListQueryString } from '@/lib/api/listQueryParams';
import { extractPagePermissions } from '@/lib/api/permissions';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;

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

    const { searchParams } = new URL(request.url);
    const listQuery = readEncryptedListQueryFromRequest(searchParams, { sort_by: 'branch_name' });
    const queryParams = toBackendListQueryString(listQuery, { includeCacheBuster: true });
    const backendUrl = `${BACKEND_API_URL}/api/v1/branches?${queryParams}`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-API-Key': getBackendApiKey(),
          Authorization: `Bearer ${authToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
        cache: 'no-store',
      });
    } catch (fetchError) {
      console.error('[Branches API] Fetch error:', fetchError);
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
        errorData = { message: errorText || 'Failed to fetch branches' };
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to fetch branches',
          error: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(
      {
        ...data,
        permissions: extractPagePermissions(data),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Branches API] Error:', error);
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

export async function POST(request: NextRequest) {
  try {
    const csrfValidation = await validateCsrfFromRequest(request);
    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;

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
    const backendUrl = `${BACKEND_API_URL}/api/v1/branches`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-API-Key': getBackendApiKey(),
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(toSnakeCaseKeys(body)),
        cache: 'no-store',
      });
    } catch (fetchError) {
      console.error('[Branches API] POST Fetch error:', fetchError);
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
        errorData = { message: errorText || 'Failed to create branch' };
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to create branch',
          error: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawBranch = data?.data ?? data;
    const normalizedBranch = normalizeBranch(rawBranch as Record<string, unknown>);

    return NextResponse.json(normalizedBranch, { status: 200 });
  } catch (error) {
    console.error('[Branches API POST] Error:', error);
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
