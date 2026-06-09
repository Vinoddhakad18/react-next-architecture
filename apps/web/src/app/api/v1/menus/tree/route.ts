/**
 * Menu Tree API Route
 * Fetches the active menu tree from the backend and normalizes field names.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || 'czVtZWFyY2hfa2V5LHRlc3Rfa2V5XzEyMyxkZXZfdGVzdF9rZXk=';

function normalizeMenuItem(menu: any): any {
  return {
    id: menu.id,
    name: menu.name,
    slug: menu.slug || menu.route?.replace(/^\//, '').replace(/\//g, '-') || '',
    route: menu.route || `/${menu.slug || ''}`,
    description: menu.description,
    sortOrder: menu.sortOrder ?? menu.sort_order ?? 0,
    isActive: menu.isActive ?? menu.is_active ?? true,
    parentId: menu.parentId ?? menu.parent_id ?? null,
    createdAt: menu.createdAt || menu.created_at || new Date().toISOString(),
    updatedAt: menu.updatedAt || menu.updated_at || new Date().toISOString(),
    children: Array.isArray(menu.children) ? normalizeMenuTree(menu.children) : undefined,
  };
}

function normalizeMenuTree(tree: any): any[] {
  if (!Array.isArray(tree)) {
    return [];
  }
  return tree.map(normalizeMenuItem);
}

function extractTreePayload(payload: any): any[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) {
      return payload.data;
    }

    if (payload.data && Array.isArray(payload.data.data)) {
      return payload.data.data;
    }

    if (payload.success && payload.data) {
      return extractTreePayload(payload.data);
    }
  }

  return [];
}

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
    const queryParams = new URLSearchParams();

    if (searchParams.has('active_only')) {
      queryParams.append('active_only', searchParams.get('active_only') || 'true');
    }

    queryParams.append('_t', Date.now().toString());
    const backendUrl = `${BACKEND_API_URL}/api/v1/menus/tree?${queryParams.toString()}`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-API-Key': API_KEY,
          Authorization: `Bearer ${authToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
        cache: 'no-store',
      });
    } catch (fetchError) {
      console.error('[Menu Tree API] Fetch error:', fetchError);
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
        errorData = { message: errorText || 'Failed to fetch menu tree' };
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to fetch menu tree',
          error: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawTree = extractTreePayload(data);
    const menuTree = normalizeMenuTree(rawTree);

    return NextResponse.json(
      {
        success: true,
        message: 'Menu tree retrieved successfully',
        data: menuTree,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Menu Tree API] Error:', error);
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
