/**
 * Category BFF proxy — encrypted backend communication and response normalization.
 */

import { NextRequest, NextResponse } from 'next/server';

import { BACKEND_API_URL, getBackendApiKey } from '@/lib/api/backendConfig';
import { appendEncryptedQueryToUrl, encryptCustomToken } from '@/lib/api/customEncrypt';
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
  readCategoryExportQueryFromRequest,
  readCategoryListQueryFromRequest,
} from '@/lib/api/categoryEncryptedQuery';
import { readErrorMessage } from '@/lib/api/parseResponse';
import { normalizeCategory, normalizeCategoryRecord } from '@/lib/categories/normalizeCategory';

const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractCategoryListItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  const container = isRecord(payload.data) ? payload.data : payload;
  const direct = isRecord(container)
    ? (container.data ?? container.categories ?? container.items)
    : container;

  if (Array.isArray(direct)) {
    return direct;
  }

  if (isRecord(direct)) {
    const nested = direct.data ?? direct.categories ?? direct.items;
    if (Array.isArray(nested)) {
      return nested;
    }
  }

  return [];
}

function extractCategoryListPayload(
  decryptedData: unknown,
  page: number,
  limit: number
): { data: ReturnType<typeof normalizeCategory>[]; meta: Record<string, number> } {
  const categoryItems = extractCategoryListItems(decryptedData);

  const normalizedCategories = (Array.isArray(categoryItems) ? categoryItems : []).map((category) =>
    normalizeCategory(category as Record<string, unknown>)
  );

  const paginationSource = (() => {
    if (!isRecord(decryptedData)) {
      return null;
    }
    const container = isRecord(decryptedData.data) && !Array.isArray(decryptedData.data)
      ? decryptedData.data
      : decryptedData;
    return isRecord(container) ? container.pagination ?? container.meta : null;
  })();
  const pagination = isRecord(paginationSource)
    ? paginationSource
    : {
        total: normalizedCategories.length,
        page,
        limit,
        totalPages: 1,
      };

  const perPage = Number(pagination.per_page ?? pagination.limit ?? limit) || limit;

  return {
    data: normalizedCategories,
    meta: {
      total: Number(
        pagination.total_records ?? pagination.total ?? normalizedCategories.length
      ),
      page: Number(pagination.page ?? page),
      limit: perPage,
      totalPages: Number(
        pagination.total_pages ??
          pagination.totalPages ??
          Math.ceil(normalizedCategories.length / perPage)
      ),
    },
  };
}

function normalizeCategoryPayload(categoryPayload: unknown) {
  if (!isRecord(categoryPayload)) {
    return categoryPayload;
  }

  const category = isRecord(categoryPayload.data) ? categoryPayload.data : categoryPayload;
  return isRecord(category) ? normalizeCategoryRecord(category) : categoryPayload;
}

export async function proxyCategoryList(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const { searchParams } = new URL(request.url);
  const listQuery = readCategoryListQueryFromRequest(searchParams, { sort_by: 'name' });
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

  const backendUrl = `${BACKEND_API_URL}/api/v1/categories`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'GET',
      authToken,
      queryParams: queryPayload,
      noCache: true,
    });
  } catch (fetchError) {
    console.error('[Category API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to fetch categories');
  }

  const page = parseInt(listQuery.page, 10) || 1;
  const limit = parseInt(listQuery.per_page, 10) || 10;
  const categoryData = extractCategoryListPayload(result.decrypted.data, page, limit);
  const permissions = extractPagePermissions({
    data: result.decrypted.data,
    permissions: result.decrypted.permissions,
  });

  return NextResponse.json(
    buildEncryptedClientResponse(result.raw, {
      success: true,
      message: result.decrypted.message ?? 'Categories fetched successfully',
      data: categoryData,
      extra: permissions ? { permissions } : undefined,
    }),
    { status: 200 }
  );
}

export async function proxyCategoryCreate(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const body = await request.json().catch(() => ({}));
  const backendUrl = `${BACKEND_API_URL}/api/v1/categories`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'POST',
      authToken,
      body,
    });
  } catch (fetchError) {
    console.error('[Category API] POST Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to create category');
  }

  return encryptedSuccessResponse(result, normalizeCategoryPayload(result.decrypted.data));
}

export async function proxyCategoryGet(request: NextRequest, id: string) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const backendUrl = `${BACKEND_API_URL}/api/v1/categories/${id}`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'GET',
      authToken,
      queryParams: { _t: String(Date.now()) },
      noCache: true,
    });
  } catch (fetchError) {
    console.error('[Category API] GET error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to fetch category');
  }

  return encryptedSuccessResponse(result, normalizeCategoryPayload(result.decrypted.data));
}

export async function proxyCategoryUpdate(request: NextRequest, id: string) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const body = await request.json().catch(() => ({}));
  const backendUrl = `${BACKEND_API_URL}/api/v1/categories/${id}`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'PUT',
      authToken,
      body,
    });
  } catch (fetchError) {
    console.error('[Category API] PUT Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to update category');
  }

  return encryptedSuccessResponse(result, normalizeCategoryPayload(result.decrypted.data));
}

export async function proxyCategoryDelete(request: NextRequest, id: string) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const backendUrl = `${BACKEND_API_URL}/api/v1/categories/${id}`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'DELETE',
      authToken,
    });
  } catch (fetchError) {
    console.error('[Category API] DELETE Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to delete category');
  }

  return encryptedSuccessResponse(result, result.decrypted.data ?? { success: true }, {
    message: result.decrypted.message ?? 'Category deleted successfully',
  });
}

export async function proxyCategoryActiveList(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const backendUrl = `${BACKEND_API_URL}/api/v1/categories/active/list`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'GET',
      authToken,
      queryParams: { _t: String(Date.now()) },
      noCache: true,
    });
  } catch (fetchError) {
    console.error('[Category Active List API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to fetch active categories');
  }

  const data = result.decrypted.data ?? result.decrypted;

  return encryptedSuccessResponse(result, data, {
    message: result.decrypted.message ?? 'Active categories fetched successfully',
  });
}

export async function proxyCategoryStatus(request: NextRequest, id: string) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const body = await request.json().catch(() => ({}));
  const backendUrl = `${BACKEND_API_URL}/api/v1/categories/${id}/status`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'PATCH',
      authToken,
      body,
    });
  } catch (fetchError) {
    console.error('[Category Status API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to update category status');
  }

  return encryptedSuccessResponse(result, result.decrypted.data ?? { success: true }, {
    message: result.decrypted.message ?? 'Status updated successfully',
  });
}

export async function proxyCategoryApprovalAction(
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

  const backendUrl = `${BACKEND_API_URL}/api/v1/categories/approvals/${requestId}/${action}`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'POST',
      authToken,
      body: payload,
    });
  } catch (fetchError) {
    console.error(`[Category Approval API ${action}] Fetch error:`, fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, `Failed to ${action} request`);
  }

  return encryptedSuccessResponse(result, result.decrypted.data ?? { success: true });
}

export async function proxyCategoryExcelExport(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const { searchParams } = new URL(request.url);
  const queryPayload = readCategoryExportQueryFromRequest(searchParams);
  const backendUrl = appendEncryptedQueryToUrl(
    `${BACKEND_API_URL}/api/v1/categories/export/excel`,
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
    console.error('[Category Export API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!response.ok) {
    const errorText = await response.text();

    return NextResponse.json(
      {
        success: false,
        message: readErrorMessage(errorText, 'Failed to export categories'),
        error: errorText || 'Failed to export categories',
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
    contentDisposition || 'attachment; filename="categories-export.xlsx"'
  );

  return new NextResponse(buffer, { status: 200, headers });
}
