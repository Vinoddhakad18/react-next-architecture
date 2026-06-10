import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BACKEND_API_URL, getBackendApiKey } from '@/lib/api/backendConfig';
import { normalizeUser } from '@/lib/utils/normalizeUser';

function normalizePagination(pagination: any, page: number, limit: number, total: number) {
  return {
    total: pagination?.total ?? total,
    page: pagination?.page ?? page,
    limit: pagination?.limit ?? limit,
    totalPages: pagination?.totalPages ?? pagination?.total_pages ?? Math.ceil(total / limit),
  };
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'ASC';
    const search = searchParams.get('search') || '';

    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy,
      sortOrder,
    });

    if (search) {
      queryParams.append('search', search);
    }

    queryParams.append('_t', Date.now().toString());
    const backendUrl = `${BACKEND_API_URL}/api/v1/users?${queryParams.toString()}`;

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
      console.error('[Users API] Fetch error:', fetchError);
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
        errorData = { message: errorText || 'Failed to fetch users' };
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to fetch users',
          error: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    let userItems: any[] = [];
    let pagination: any = {};

    if (data?.success && data?.data) {
      const backendData = data.data;
      userItems = backendData.data || backendData.users || [];
      pagination = normalizePagination(backendData.pagination || backendData.meta, page, limit, userItems.length);
    } else if (data?.data && Array.isArray(data.data)) {
      userItems = data.data;
      pagination = normalizePagination(data.meta || {}, page, limit, userItems.length);
    } else if (Array.isArray(data)) {
      userItems = data;
      pagination = normalizePagination({}, page, limit, userItems.length);
    } else {
      const backendData = data?.data ?? data;
      if (Array.isArray(backendData)) {
        userItems = backendData;
      }
      pagination = normalizePagination(data?.meta || data?.pagination || {}, page, limit, userItems.length);
    }

    const normalizedUsers = userItems.map(normalizeUser);

    return NextResponse.json(
      {
        data: normalizedUsers,
        meta: pagination,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Users API] Error:', error);
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
