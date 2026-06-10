/**
 * Branches API Route
 * Proxy for branch list and creation operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';

import { BACKEND_API_URL, getBackendApiKey } from '@/lib/api/backendConfig';

function normalizeBranch(branch: any) {
  return {
    id: branch.id,
    branchName: branch.branch_name ?? branch.branchName ?? '',
    branchCode: branch.branch_code ?? branch.branchCode ?? '',
    address: branch.address ?? '',
    status: branch.status ?? '',
    createdAt: branch.createdAt || branch.created_at || new Date().toISOString(),
    updatedAt: branch.updatedAt || branch.updated_at || new Date().toISOString(),
  };
}

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
    const sortBy = searchParams.get('sortBy') || 'branch_name';
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
    const backendUrl = `${BACKEND_API_URL}/api/v1/branches?${queryParams.toString()}`;

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

    let branchData: { data: any[]; meta: any };

    if (data.success && data.data) {
      const backendData = data.data;
      const branchItems = backendData.data || backendData.branches || [];
      const normalizedBranches = (Array.isArray(branchItems) ? branchItems : []).map(normalizeBranch);
      const pagination = normalizePagination(backendData.pagination || backendData.meta, page, limit, normalizedBranches.length);

      branchData = {
        data: normalizedBranches,
        meta: pagination,
      };
    } else if (data.data && Array.isArray(data.data) && data.meta) {
      branchData = {
        data: data.data.map(normalizeBranch),
        meta: normalizePagination(data.meta, page, limit, data.data.length),
      };
    } else if (Array.isArray(data)) {
      branchData = {
        data: data.map(normalizeBranch),
        meta: normalizePagination({}, page, limit, data.length),
      };
    } else {
      let foundArray: any[] = [];
      if (data.data && Array.isArray(data.data)) {
        foundArray = data.data;
      } else if (Array.isArray(data)) {
        foundArray = data;
      }

      branchData = {
        data: foundArray.map(normalizeBranch),
        meta: normalizePagination({}, page, limit, foundArray.length),
      };
    }

    return NextResponse.json(branchData, { status: 200 });
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
        body: JSON.stringify(body),
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
    const normalizedBranch = normalizeBranch(rawBranch);

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
