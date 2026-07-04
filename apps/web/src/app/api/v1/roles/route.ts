/**
 * Roles API Route
 * Handles role management operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';

import { BACKEND_API_URL } from '@/lib/api/backendConfig';
import { backendFetch } from '@/lib/api/backendProxy';
import { readListQueryParams, toBackendListQueryString } from '@/lib/api/listQueryParams';
import { extractPagePermissions } from '@/lib/api/permissions';

/**
 * GET /api/v1/roles
 * Fetch list of roles with pagination and sorting
 */
export async function GET(request: NextRequest) {
  try {
    // Get authentication token from cookies
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
    const listQuery = readListQueryParams(searchParams, { sort_by: 'id' });
    const queryParams = toBackendListQueryString(listQuery, { includeCacheBuster: true });
    const backendUrl = `${BACKEND_API_URL}/api/v1/roles?${queryParams}`;

    let response: Response;
    try {
      response = await backendFetch(backendUrl, {
        method: 'GET',
        authToken,
        noCache: true,
      });
    } catch (fetchError) {
      console.error('[Role API] Fetch error:', fetchError);
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
        errorData = { message: errorText || 'Failed to fetch roles' };
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to fetch roles',
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
    console.error('Role API error:', error);
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

/**
 * POST /api/v1/roles
 * Create a new role
 */
export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token for state-changing operations
    const csrfValidation = await validateCsrfFromRequest(request);

    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    // Get authentication token from cookies
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

    // Parse request body
    const body = await request.json();

    // Forward request to backend API
    const backendUrl = `${BACKEND_API_URL}/api/v1/roles`;

    let response: Response;
    try {
      response = await backendFetch(backendUrl, {
        method: 'POST',
        authToken,
        body,
      });
    } catch (fetchError) {
      console.error('[Role API] POST Fetch error:', fetchError);
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
        errorData = { message: errorText || 'Failed to create role' };
      }

      console.error('[Role API] POST Backend error:', response.status, errorData);

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to create role',
          error: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Role API POST error:', error);
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






