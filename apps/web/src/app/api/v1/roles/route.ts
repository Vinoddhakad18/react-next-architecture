/**
 * Roles API Route
 * Handles role management operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';

// Backend API URL - can be configured via environment variable
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || 'czVtZWFyY2hfa2V5LHRlc3Rfa2V5XzEyMyxkZXZfdGVzdF9rZXk=';

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const sortBy = searchParams.get('sortBy') || 'id';
    const sortOrder = searchParams.get('sortOrder') || 'ASC';
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    // Build query string
    const queryParams = new URLSearchParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    if (search) {
      queryParams.append('search', search);
    }

    if (isActive !== null && isActive !== undefined) {
      queryParams.append('isActive', isActive);
    }

    // Forward request to backend API
    queryParams.append('_t', Date.now().toString());
    const backendUrl = `${BACKEND_API_URL}/api/v1/roles?${queryParams.toString()}`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': API_KEY,
          'Authorization': `Bearer ${authToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
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

    // Normalize backend response
    let roleData: { data: any[]; meta: any };

    if (data.success && data.data) {
      const backendData = data.data;
      const roleItems = backendData.data || backendData.roles || [];
      
      const normalizedRoles = (Array.isArray(roleItems) ? roleItems : []).map((role: any) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions || role.permission || [],
        isActive: role.isActive ?? role.is_active ?? true,
        createdAt: role.createdAt || role.created_at || new Date().toISOString(),
        updatedAt: role.updatedAt || role.updated_at || new Date().toISOString(),
      }));

      const pagination = backendData.pagination || backendData.meta || {
        total: normalizedRoles.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: 1,
      };

      roleData = {
        data: normalizedRoles,
        meta: {
          total: pagination.total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: pagination.totalPages || pagination.total_pages || 1,
        },
      };
    } else if (data.data && Array.isArray(data.data) && data.meta) {
      roleData = data;
    } else if (Array.isArray(data)) {
      roleData = {
        data: data,
        meta: {
          total: data.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(data.length / parseInt(limit)),
        },
      };
    } else {
      let foundArray: any[] = [];
      if (data.data && Array.isArray(data.data)) {
        foundArray = data.data;
      } else if (Array.isArray(data)) {
        foundArray = data;
      }

      roleData = {
        data: foundArray,
        meta: {
          total: foundArray.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(foundArray.length / parseInt(limit)),
        },
      };
    }

    if (!Array.isArray(roleData.data)) {
      roleData.data = [];
    }

    return NextResponse.json(roleData, { status: 200 });
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
      response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
        cache: 'no-store',
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

    // Normalize the response
    let roleData = data;
    
    if (data && typeof data === 'object') {
      roleData = {
        id: data.id,
        name: data.name,
        description: data.description,
        permissions: data.permissions || data.permission || [],
        isActive: data.isActive ?? data.is_active ?? true,
        createdAt: data.createdAt || data.created_at || new Date().toISOString(),
        updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
      };
    }

    return NextResponse.json(roleData, { status: 200 });
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



