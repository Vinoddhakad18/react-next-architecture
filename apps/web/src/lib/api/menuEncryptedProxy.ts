/**
 * Menu BFF proxy — encrypted backend communication and response normalization.
 */

import { NextRequest, NextResponse } from 'next/server';

import { BACKEND_API_URL, getBackendApiKey } from '@/lib/api/backendConfig';
import {
  appendEncryptedQueryToUrl,
  encryptCustomToken,
} from '@/lib/api/customEncrypt';
import {
  backendUnavailableJsonResponse,
  buildEncryptedClientResponse,
  encryptedBackendErrorResponse,
  encryptedSuccessResponse,
  proxyEncryptedBackendJson,
  resolveAuthTokenFromRequest,
  unauthorizedJsonResponse,
} from '@/lib/api/encryptedRouteProxy';
import { extractPagePermissions } from '@/lib/api/permissions';
import {
  readMenuListQueryFromRequest,
  readMenuTreeQueryFromRequest,
  readMenuExportQueryFromRequest,
} from '@/lib/api/menuEncryptedQuery';
import { normalizeMenu } from '@/lib/menus/normalizeMenu';
import { readErrorMessage } from '@/lib/api/parseResponse';

const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeMenuRecord(menu: Record<string, unknown>) {
  return {
    id: menu.id,
    name: menu.name,
    route: menu.route,
    slug: menu.slug || (typeof menu.route === 'string'
      ? menu.route.replace(/^\//, '').replace(/\//g, '-')
      : undefined),
    description: menu.description,
    sortOrder: menu.sort_order ?? menu.sortOrder ?? 0,
    isActive: menu.is_active ?? menu.isActive ?? true,
    parentId: menu.parent_id ?? menu.parentId ?? null,
    createdAt: menu.created_at || menu.createdAt || new Date().toISOString(),
    updatedAt: menu.updated_at || menu.updatedAt || new Date().toISOString(),
  };
}

function extractMenuListPayload(
  decryptedData: unknown,
  page: number,
  limit: number
): { data: ReturnType<typeof normalizeMenu>[]; meta: Record<string, number> } {
  let backendData: Record<string, unknown> | unknown[] = decryptedData as unknown;

  if (isRecord(decryptedData) && isRecord(decryptedData.data)) {
    backendData = decryptedData.data;
  }

  const menuItems = isRecord(backendData)
    ? (backendData.data ?? backendData.menus ?? [])
    : backendData;

  const normalizedMenus = (Array.isArray(menuItems) ? menuItems : []).map((menu) =>
    normalizeMenu(menu as Record<string, unknown>)
  );

  const paginationSource = isRecord(backendData) ? backendData.pagination ?? backendData.meta : null;
  const pagination = isRecord(paginationSource)
    ? paginationSource
    : {
        total: normalizedMenus.length,
        page,
        limit,
        totalPages: 1,
      };

  return {
    data: normalizedMenus,
    meta: {
      total: Number(
        pagination.total_records ?? pagination.total ?? normalizedMenus.length
      ),
      page: Number(pagination.page ?? page),
      limit: Number(pagination.per_page ?? pagination.limit ?? limit),
      totalPages: Number(pagination.total_pages ?? pagination.totalPages ?? 1),
    },
  };
}

export async function proxyMenuList(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const { searchParams } = new URL(request.url);
  const listQuery = readMenuListQueryFromRequest(searchParams, { sort_by: 'sort_order' });
  const queryPayload: Record<string, string> = {
    page: listQuery.page,
    per_page: listQuery.per_page,
    sort_by: listQuery.sort_by,
    sort_order: listQuery.sort_order,
    _t: String(Date.now()),
  };
  if (listQuery.search) {
    queryPayload.search = listQuery.search;
  }
  if (listQuery.is_active) {
    queryPayload.is_active = listQuery.is_active;
  }

  const backendUrl = `${BACKEND_API_URL}/api/v1/menus`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'GET',
      authToken,
      queryParams: queryPayload,
      noCache: true,
    });
  } catch (fetchError) {
    console.error('[Menu API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to fetch menus');
  }

  const page = parseInt(listQuery.page, 10) || 1;
  const limit = parseInt(listQuery.per_page, 10) || 10;
  const menuData = extractMenuListPayload(result.decrypted.data, page, limit);
  const permissions = extractPagePermissions({
    data: result.decrypted.data,
    permissions: result.decrypted.permissions,
  });

  return NextResponse.json(
    buildEncryptedClientResponse(result.raw, {
      success: true,
      message: result.decrypted.message ?? 'Menus fetched successfully',
      data: menuData,
      extra: permissions ? { permissions } : undefined,
    }),
    { status: 200 }
  );
}

export async function proxyMenuCreate(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const body = await request.json().catch(() => ({}));
  const backendUrl = `${BACKEND_API_URL}/api/v1/menus`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'POST',
      authToken,
      body,
    });
  } catch (fetchError) {
    console.error('[Menu API] POST Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to create menu');
  }

  const menuPayload = result.decrypted.data;
  const normalizedData = isRecord(menuPayload)
    ? normalizeMenuRecord(menuPayload)
    : menuPayload;

  return encryptedSuccessResponse(result, normalizedData);
}

export async function proxyMenuGet(request: NextRequest, id: string) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const backendUrl = `${BACKEND_API_URL}/api/v1/menus/${id}`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'GET',
      authToken,
      queryParams: { _t: String(Date.now()) },
      noCache: true,
    });
  } catch (fetchError) {
    console.error('[Menu API] GET error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to fetch menu');
  }

  const menuPayload = result.decrypted.data;
  const normalizedData =
    isRecord(menuPayload) ? normalizeMenuRecord(menuPayload) : menuPayload;

  return encryptedSuccessResponse(result, normalizedData);
}

export async function proxyMenuUpdate(request: NextRequest, id: string) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const body = await request.json().catch(() => ({}));
  const backendUrl = `${BACKEND_API_URL}/api/v1/menus/${id}`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'PUT',
      authToken,
      body,
    });
  } catch (fetchError) {
    console.error('[Menu API] PUT Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to update menu');
  }

  const menuPayload = result.decrypted.data;
  const normalizedData =
    isRecord(menuPayload) ? normalizeMenuRecord(menuPayload) : menuPayload;

  return encryptedSuccessResponse(result, normalizedData);
}

export async function proxyMenuDelete(request: NextRequest, id: string) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const backendUrl = `${BACKEND_API_URL}/api/v1/menus/${id}`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'DELETE',
      authToken,
    });
  } catch (fetchError) {
    console.error('[Menu API] DELETE Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to delete menu');
  }

  return encryptedSuccessResponse(result, { success: true }, {
    message: result.decrypted.message ?? 'Menu deleted successfully',
  });
}

function normalizeMenuItem(menu: Record<string, unknown>): Record<string, unknown> {
  return {
    ...normalizeMenuRecord(menu),
    children: Array.isArray(menu.children)
      ? menu.children.map((child) => normalizeMenuItem(child as Record<string, unknown>))
      : undefined,
  };
}

function extractTreePayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isRecord(payload)) {
    if (Array.isArray(payload.data)) {
      return payload.data;
    }

    if (isRecord(payload.data) && Array.isArray(payload.data.data)) {
      return payload.data.data;
    }
  }

  return [];
}

export async function proxyMenuTree(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const { searchParams } = new URL(request.url);
  const { activeOnly } = readMenuTreeQueryFromRequest(searchParams);
  const queryPayload: Record<string, string> = {
    _t: String(Date.now()),
  };
  if (activeOnly) {
    queryPayload.active_only = 'true';
  }

  const backendUrl = `${BACKEND_API_URL}/api/v1/menus/tree`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'GET',
      authToken,
      queryParams: queryPayload,
      noCache: true,
    });
  } catch (fetchError) {
    console.error('[Menu Tree API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to fetch menu tree');
  }

  const rawTree = extractTreePayload(result.decrypted.data);
  const menuTree = rawTree.map((item) => normalizeMenuItem(item as Record<string, unknown>));

  return encryptedSuccessResponse(result, menuTree, {
    message: result.decrypted.message ?? 'Menu tree retrieved successfully',
  });
}

export async function proxyMenuActiveList(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const backendUrl = `${BACKEND_API_URL}/api/v1/menus/active/list`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'GET',
      authToken,
      queryParams: { _t: String(Date.now()) },
      noCache: true,
    });
  } catch (fetchError) {
    console.error('[Menu Active List API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to fetch active menus');
  }

  const data = result.decrypted.data ?? result.decrypted;

  return encryptedSuccessResponse(result, data, {
    message: result.decrypted.message ?? 'Active menus fetched successfully',
  });
}

export async function proxyMenuApprovalAction(
  request: NextRequest,
  requestId: string,
  action: 'approve' | 'reject'
) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const body = await request.json().catch(() => ({}));
  const payload =
    action === 'approve'
      ? {
          comment:
            typeof body?.comment === 'string' && body.comment.trim()
              ? body.comment.trim()
              : '',
        }
      : {
          reason:
            typeof body?.reason === 'string' && body.reason.trim()
              ? body.reason.trim()
              : '',
        };

  if (action === 'approve' && !('comment' in payload && payload.comment)) {
    return NextResponse.json(
      { success: false, message: 'Comment is required', error: 'Comment is required' },
      { status: 400 }
    );
  }

  if (action === 'reject' && !('reason' in payload && payload.reason)) {
    return NextResponse.json(
      { success: false, message: 'Reason is required', error: 'Reason is required' },
      { status: 400 }
    );
  }

  const backendUrl = `${BACKEND_API_URL}/api/v1/menus/approvals/${requestId}/${action}`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'POST',
      authToken,
      body: payload,
    });
  } catch (fetchError) {
    console.error(`[Menu Approval API ${action}] Fetch error:`, fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, `Failed to ${action} request`);
  }

  return encryptedSuccessResponse(result, result.decrypted.data ?? { success: true });
}

export async function proxyMenuStatus(request: NextRequest, id: string) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const body = await request.json().catch(() => ({}));
  const backendUrl = `${BACKEND_API_URL}/api/v1/menus/${id}/status`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'PATCH',
      authToken,
      body,
    });
  } catch (fetchError) {
    console.error('[Menu Status API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to update menu status');
  }

  return encryptedSuccessResponse(result, result.decrypted.data ?? { success: true }, {
    message: result.decrypted.message ?? 'Status updated successfully',
  });
}

export async function proxyMenuExcelExport(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const { searchParams } = new URL(request.url);
  const queryPayload = readMenuExportQueryFromRequest(searchParams);
  const backendUrl = appendEncryptedQueryToUrl(
    `${BACKEND_API_URL}/api/v1/menus/export/excel`,
    queryPayload
  );

  let response: Response;
  try {
    response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        Accept: EXCEL_MIME,
        'X-API-Key': getBackendApiKey(),
        'x-api-token': encryptCustomToken(getBackendApiKey()),
        Authorization: `Bearer ${authToken}`,
      },
      cache: 'no-store',
    });
  } catch (fetchError) {
    console.error('[Menu Export API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!response.ok) {
    const errorText = await response.text();

    return NextResponse.json(
      {
        success: false,
        message: readErrorMessage(errorText, 'Failed to export menus'),
        error: errorText || 'Failed to export menus',
      },
      { status: response.status }
    );
  }

  const buffer = await response.arrayBuffer();
  const headers = new Headers();
  headers.set('Content-Type', response.headers.get('Content-Type') || EXCEL_MIME);

  const contentDisposition = response.headers.get('Content-Disposition');
  headers.set(
    'Content-Disposition',
    contentDisposition || 'attachment; filename="menus-export.xlsx"'
  );

  return new NextResponse(buffer, { status: 200, headers });
}
