import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';

import { BACKEND_API_URL } from '@/lib/api/backendConfig';
import { backendFetch } from '@/lib/api/backendProxy';

/**
 * GET /api/v1/roles/[id]
 * Get a single role by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    // Forward request to backend API
    const backendUrl = `${BACKEND_API_URL}/api/v1/roles/${id}?_t=${Date.now()}`;

    const response = await backendFetch(backendUrl, {
      method: 'GET',
      authToken,
      noCache: true,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Failed to fetch role' };
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to fetch role',
          error: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Normalize backend response (snake_case to camelCase)
    let normalizedData;
    if (data.success && data.data) {
      const role = data.data;
      normalizedData = {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions || role.permission || [],
        isActive: role.is_active ?? role.isActive ?? true,
        createdAt: role.created_at || role.createdAt || new Date().toISOString(),
        updatedAt: role.updated_at || role.updatedAt || new Date().toISOString(),
      };
    } else if (data.id) {
      // Direct role object
      normalizedData = {
        id: data.id,
        name: data.name,
        description: data.description,
        permissions: data.permissions || data.permission || [],
        isActive: data.is_active ?? data.isActive ?? true,
        createdAt: data.created_at || data.createdAt || new Date().toISOString(),
        updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
      };
    } else {
      normalizedData = data;
    }

    return NextResponse.json(normalizedData, { status: 200 });
  } catch (error) {
    console.error('[Role API] GET error:', error);
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
 * PUT /api/v1/roles/[id]
 * Update an existing role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate CSRF token for state-changing operations
    const csrfValidation = await validateCsrfFromRequest(request);

    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    const { id } = params;

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
    const requestBody = await request.json();

    // Forward request to backend API
    const backendUrl = `${BACKEND_API_URL}/api/v1/roles/${id}`;

    let response: Response;
    try {
      response = await backendFetch(backendUrl, {
        method: 'PUT',
        authToken,
        body: requestBody,
      });
    } catch (fetchError) {
      console.error('[Role API] PUT Fetch error:', fetchError);
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
        errorData = { message: errorText || 'Failed to update role' };
      }

      console.error('[Role API] PUT Backend error:', response.status, errorData);

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to update role',
          error: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Normalize backend response (snake_case to camelCase)
    let normalizedData;
    if (data.success && data.data) {
      const role = data.data;
      normalizedData = {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions || role.permission || [],
        isActive: role.is_active ?? role.isActive ?? true,
        createdAt: role.created_at || role.createdAt || new Date().toISOString(),
        updatedAt: role.updated_at || role.updatedAt || new Date().toISOString(),
      };
    } else if (data.id) {
      // Direct role object
      normalizedData = {
        id: data.id,
        name: data.name,
        description: data.description,
        permissions: data.permissions || data.permission || [],
        isActive: data.is_active ?? data.isActive ?? true,
        createdAt: data.created_at || data.createdAt || new Date().toISOString(),
        updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
      };
    } else {
      normalizedData = data;
    }

    return NextResponse.json(normalizedData, { status: 200 });
  } catch (error) {
    console.error('[Role API] PUT error:', error);
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
 * DELETE /api/v1/roles/[id]
 * Delete a role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate CSRF token for state-changing operations
    const csrfValidation = await validateCsrfFromRequest(request);

    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    const { id } = params;

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

    // Forward request to backend API
    const backendUrl = `${BACKEND_API_URL}/api/v1/roles/${id}`;

    let response: Response;
    try {
      response = await backendFetch(backendUrl, {
        method: 'DELETE',
        authToken,
      });
    } catch (fetchError) {
      console.error('[Role API] DELETE Fetch error:', fetchError);
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
        errorData = { message: errorText || 'Failed to delete role' };
      }

      console.error('[Role API] DELETE Backend error:', response.status, errorData);

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to delete role',
          error: errorData,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Role deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[Role API] DELETE error:', error);
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






