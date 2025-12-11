/**
 * Menus API Route
 * Handles menu management operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';

// Backend API URL - can be configured via environment variable
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || 'czVtZWFyY2hfa2V5LHRlc3Rfa2V5XzEyMyxkZXZfdGVzdF9rZXk=';

/**
 * GET /api/v1/menus
 * Fetch list of menus with pagination and sorting
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
    const sortBy = searchParams.get('sortBy') || 'sort_order';
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
    const backendUrl = `${BACKEND_API_URL}/api/v1/menus?${queryParams.toString()}`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': API_KEY,
          'Authorization': `Bearer ${authToken}`,
        },
        cache: 'no-store',
      });
    } catch (fetchError) {
      console.error('[Menu API] Fetch error:', fetchError);
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
        errorData = { message: errorText || 'Failed to fetch menus' };
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to fetch menus',
          error: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log('[Menu API] Backend response:', JSON.stringify(data, null, 2));

    // Backend response format: { success: true, message: "...", data: { data: Menu[], pagination: {...} } }
    // Normalize to MenuListResponse format: { data: Menu[], meta: {...} }
    let menuData: { data: any[]; meta: any };

    if (data.success && data.data) {
      // Backend returns: { success: true, data: { data: [...], pagination: {...} } }
      const backendData = data.data;
      
      console.log('[Menu API] Backend response data:', JSON.stringify(data, null, 2));
      console.log('[Menu API] Backend data object:', JSON.stringify(backendData, null, 2));
      console.log('[Menu API] backendData.data:', backendData.data);
      console.log('[Menu API] Is backendData.data an array?', Array.isArray(backendData.data));
      console.log('[Menu API] backendData.data length:', Array.isArray(backendData.data) ? backendData.data.length : 'N/A');
      
      // Normalize menu items from snake_case to camelCase
      const menuItems = backendData.data || backendData.menus || [];
      console.log('[Menu API] Menu items to normalize:', Array.isArray(menuItems) ? menuItems.length : 'Not an array');
      
      if (!Array.isArray(menuItems)) {
        console.error('[Menu API] backendData.data is not an array:', typeof menuItems, menuItems);
      }
      
      const normalizedMenus = (Array.isArray(menuItems) ? menuItems : []).map((menu: any) => {
        const route = menu.route || menu.slug || '';
        const slug = menu.slug || route.replace(/^\//, '').replace(/\//g, '-') || '';
        
        return {
          id: menu.id,
          name: menu.name,
          slug,
          route,
          description: menu.description,
          sortOrder: menu.sortOrder ?? menu.sort_order ?? 0,
          isActive: menu.isActive ?? menu.is_active ?? true,
          parentId: menu.parentId ?? menu.parent_id ?? null,
          createdAt: menu.createdAt || menu.created_at || new Date().toISOString(),
          updatedAt: menu.updatedAt || menu.updated_at || new Date().toISOString(),
        };
      });

      // Normalize pagination (backend uses 'pagination', we use 'meta')
      const pagination = backendData.pagination || backendData.meta || {
        total: normalizedMenus.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: 1,
      };

      menuData = {
        data: normalizedMenus,
        meta: {
          total: pagination.total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: pagination.totalPages || pagination.total_pages || 1,
        },
      };
      
      console.log('[Menu API] Normalized menuData:', JSON.stringify(menuData, null, 2));
      console.log('[Menu API] normalizedMenus count:', normalizedMenus.length);
    } else if (data.data && Array.isArray(data.data) && data.meta) {
      // Already in MenuListResponse format
      menuData = data;
    } else if (Array.isArray(data)) {
      // Just an array
      menuData = {
        data: data,
        meta: {
          total: data.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(data.length / parseInt(limit)),
        },
      };
    } else {
      // Fallback - try to extract data from any structure
      console.warn('[Menu API] Falling back to default structure, data:', JSON.stringify(data, null, 2));
      
      // Try to find any array in the response
      let foundArray: any[] = [];
      if (data.data && Array.isArray(data.data)) {
        foundArray = data.data;
      } else if (Array.isArray(data)) {
        foundArray = data;
      } else if (data && typeof data === 'object') {
        const values = Object.values(data);
        const arrayValue = values.find(v => Array.isArray(v));
        if (arrayValue) {
          foundArray = arrayValue;
        }
      }
      
      menuData = {
        data: foundArray,
        meta: {
          total: foundArray.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(foundArray.length / parseInt(limit)),
        },
      };
      
      console.log('[Menu API] Fallback menuData:', JSON.stringify(menuData, null, 2));
    }

    // Ensure menuData.data is always an array
    if (!Array.isArray(menuData.data)) {
      console.error('[Menu API] menuData.data is not an array!', typeof menuData.data, menuData.data);
      menuData.data = [];
    }

    console.log('[Menu API] Final menuData to return:', JSON.stringify(menuData, null, 2));
    console.log('[Menu API] Final menuData.data length:', menuData.data.length);

    // Return the MenuListResponse directly (API client will wrap it in { data, error, success })
    return NextResponse.json(menuData, { status: 200 });
  } catch (error) {
    console.error('Menu API error:', error);
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
 * POST /api/v1/menus
 * Create a new menu
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
    const backendUrl = `${BACKEND_API_URL}/api/v1/menus`;

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
      console.error('[Menu API] POST Fetch error:', fetchError);
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
        errorData = { message: errorText || 'Failed to create menu' };
      }

      console.error('[Menu API] POST Backend error:', response.status, errorData);

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to create menu',
          error: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Normalize the response to ensure it matches Menu interface
    // Backend might return snake_case or camelCase
    let menuData = data;
    
    if (data && typeof data === 'object') {
      // Normalize field names if needed
      menuData = {
        id: data.id,
        name: data.name,
        slug: data.slug || data.route?.replace(/^\//, '').replace(/\//g, '-') || '',
        description: data.description,
        sortOrder: data.sortOrder ?? data.sort_order ?? 0,
        isActive: data.isActive ?? data.is_active ?? true,
        parentId: data.parentId ?? data.parent_id ?? null,
        createdAt: data.createdAt || data.created_at || new Date().toISOString(),
        updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
      };
    }

    // Return the menu data directly (API client will wrap it in { data, error, success })
    return NextResponse.json(menuData, { status: 200 });
  } catch (error) {
    console.error('Menu API POST error:', error);
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

