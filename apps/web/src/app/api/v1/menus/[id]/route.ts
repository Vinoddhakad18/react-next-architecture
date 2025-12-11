import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || 'czVtZWFyY2hfa2V5LHRlc3Rfa2V5XzEyMyxkZXZfdGVzdF9rZXk=';

/**
 * GET /api/v1/menus/[id]
 * Get a single menu by ID
 */
export async function GET(
  request: NextRequest,
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
    const backendUrl = `${BACKEND_API_URL}/api/v1/menus/${id}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': API_KEY,
        'Authorization': `Bearer ${authToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Failed to fetch menu' };
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to fetch menu',
          error: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Normalize backend response (snake_case to camelCase)
    let normalizedData;
    if (data.success && data.data) {
      const menu = data.data;
      normalizedData = {
        id: menu.id,
        name: menu.name,
        route: menu.route,
        slug: menu.slug || menu.route?.replace(/^\//, '').replace(/\//g, '-'),
        description: menu.description,
        sortOrder: menu.sort_order ?? menu.sortOrder ?? 0,
        isActive: menu.is_active ?? menu.isActive ?? true,
        parentId: menu.parent_id ?? menu.parentId ?? null,
        createdAt: menu.created_at || menu.createdAt || new Date().toISOString(),
        updatedAt: menu.updated_at || menu.updatedAt || new Date().toISOString(),
      };
    } else if (data.id) {
      // Direct menu object
      normalizedData = {
        id: data.id,
        name: data.name,
        route: data.route,
        slug: data.slug || data.route?.replace(/^\//, '').replace(/\//g, '-'),
        description: data.description,
        sortOrder: data.sort_order ?? data.sortOrder ?? 0,
        isActive: data.is_active ?? data.isActive ?? true,
        parentId: data.parent_id ?? data.parentId ?? null,
        createdAt: data.created_at || data.createdAt || new Date().toISOString(),
        updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
      };
    } else {
      normalizedData = data;
    }

    return NextResponse.json(normalizedData, { status: 200 });
  } catch (error) {
    console.error('[Menu API] GET error:', error);
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
 * PUT /api/v1/menus/[id]
 * Update an existing menu
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
    const backendUrl = `${BACKEND_API_URL}/api/v1/menus/${id}`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
        cache: 'no-store',
      });
    } catch (fetchError) {
      console.error('[Menu API] PUT Fetch error:', fetchError);
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
        errorData = { message: errorText || 'Failed to update menu' };
      }

      console.error('[Menu API] PUT Backend error:', response.status, errorData);

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to update menu',
          error: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Normalize backend response (snake_case to camelCase)
    let normalizedData;
    if (data.success && data.data) {
      const menu = data.data;
      normalizedData = {
        id: menu.id,
        name: menu.name,
        route: menu.route,
        slug: menu.slug || menu.route?.replace(/^\//, '').replace(/\//g, '-'),
        description: menu.description,
        sortOrder: menu.sort_order ?? menu.sortOrder ?? 0,
        isActive: menu.is_active ?? menu.isActive ?? true,
        parentId: menu.parent_id ?? menu.parentId ?? null,
        createdAt: menu.created_at || menu.createdAt || new Date().toISOString(),
        updatedAt: menu.updated_at || menu.updatedAt || new Date().toISOString(),
      };
    } else if (data.id) {
      // Direct menu object
      normalizedData = {
        id: data.id,
        name: data.name,
        route: data.route,
        slug: data.slug || data.route?.replace(/^\//, '').replace(/\//g, '-'),
        description: data.description,
        sortOrder: data.sort_order ?? data.sortOrder ?? 0,
        isActive: data.is_active ?? data.isActive ?? true,
        parentId: data.parent_id ?? data.parentId ?? null,
        createdAt: data.created_at || data.createdAt || new Date().toISOString(),
        updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
      };
    } else {
      normalizedData = data;
    }

    return NextResponse.json(normalizedData, { status: 200 });
  } catch (error) {
    console.error('[Menu API] PUT error:', error);
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
 * DELETE /api/v1/menus/[id]
 * Delete a menu
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
    const backendUrl = `${BACKEND_API_URL}/api/v1/menus/${id}`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': API_KEY,
          'Authorization': `Bearer ${authToken}`,
        },
        cache: 'no-store',
      });
    } catch (fetchError) {
      console.error('[Menu API] DELETE Fetch error:', fetchError);
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
        errorData = { message: errorText || 'Failed to delete menu' };
      }

      console.error('[Menu API] DELETE Backend error:', response.status, errorData);

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to delete menu',
          error: errorData,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Menu deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[Menu API] DELETE error:', error);
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

