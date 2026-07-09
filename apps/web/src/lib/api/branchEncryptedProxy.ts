/**
 * Branch BFF proxy — encrypted backend communication and response normalization.
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
  readBranchExportQueryFromRequest,
  readBranchListQueryFromRequest,
  readBranchTreeQueryFromRequest,
} from '@/lib/api/branchEncryptedQuery';
import { readErrorMessage } from '@/lib/api/parseResponse';
import { extractBranchTreePayload } from '@/lib/utils/normalizeBranchTree';
import { normalizeBranch } from '@/lib/branches/normalizeBranch';

const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeBranchRecord(branch: Record<string, unknown>) {
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

function extractBranchListPayload(
  decryptedData: unknown,
  page: number,
  limit: number
): { data: ReturnType<typeof normalizeBranch>[]; meta: Record<string, number> } {
  let backendData: Record<string, unknown> | unknown[] = decryptedData as unknown;

  if (isRecord(decryptedData) && isRecord(decryptedData.data)) {
    backendData = decryptedData.data as Record<string, unknown>;
  }

  const branchItems = isRecord(backendData)
    ? (backendData.data ?? backendData.branches ?? [])
    : backendData;

  const normalizedBranches = (Array.isArray(branchItems) ? branchItems : []).map((branch) =>
    normalizeBranch(branch as Record<string, unknown>)
  );

  const paginationSource = isRecord(backendData) ? backendData.pagination ?? backendData.meta : null;
  const pagination = isRecord(paginationSource)
    ? paginationSource
    : {
        total: normalizedBranches.length,
        page,
        limit,
        totalPages: 1,
      };

  const perPage = Number(pagination.per_page ?? pagination.limit ?? limit) || limit;

  return {
    data: normalizedBranches,
    meta: {
      total: Number(
        pagination.total_records ?? pagination.total ?? normalizedBranches.length
      ),
      page: Number(pagination.page ?? page),
      limit: perPage,
      totalPages: Number(
        pagination.total_pages ??
          pagination.totalPages ??
          Math.ceil(normalizedBranches.length / perPage)
      ),
    },
  };
}

export async function proxyBranchList(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const { searchParams } = new URL(request.url);
  const listQuery = readBranchListQueryFromRequest(searchParams, { sort_by: 'branch_name' });
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

  const backendUrl = `${BACKEND_API_URL}/api/v1/branches`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'GET',
      authToken,
      queryParams: queryPayload,
      noCache: true,
    });
  } catch (fetchError) {
    console.error('[Branches API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to fetch branches');
  }

  const page = parseInt(listQuery.page, 10) || 1;
  const limit = parseInt(listQuery.per_page, 10) || 10;
  const branchData = extractBranchListPayload(result.decrypted.data, page, limit);
  const permissions = extractPagePermissions({
    data: result.decrypted.data,
    permissions: result.decrypted.permissions,
  });

  return NextResponse.json(
    buildEncryptedClientResponse(result.raw, {
      success: true,
      message: result.decrypted.message ?? 'Branches fetched successfully',
      data: branchData,
      extra: permissions ? { permissions } : undefined,
    }),
    { status: 200 }
  );
}

export async function proxyBranchCreate(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const body = await request.json().catch(() => ({}));
  const backendUrl = `${BACKEND_API_URL}/api/v1/branches`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'POST',
      authToken,
      body,
    });
  } catch (fetchError) {
    console.error('[Branches API] POST Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to create branch');
  }

  const branchPayload = result.decrypted.data;
  const normalizedData = isRecord(branchPayload)
    ? normalizeBranchRecord(branchPayload)
    : branchPayload;

  return encryptedSuccessResponse(result, normalizedData);
}

export async function proxyBranchUpdate(request: NextRequest, id: string) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const body = await request.json().catch(() => ({}));
  const backendUrl = `${BACKEND_API_URL}/api/v1/branches/${id}`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'PUT',
      authToken,
      body,
    });
  } catch (fetchError) {
    console.error('[Branch Item API PUT] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to update branch');
  }

  const branchPayload = result.decrypted.data;
  const normalizedData = isRecord(branchPayload)
    ? normalizeBranchRecord(branchPayload)
    : branchPayload;

  return encryptedSuccessResponse(result, normalizedData);
}

export async function proxyBranchSoftDelete(request: NextRequest, id: string) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const backendUrl = `${BACKEND_API_URL}/api/v1/branches/${id}`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'DELETE',
      authToken,
    });
  } catch (fetchError) {
    console.error('[Branch Soft Delete API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to delete branch');
  }

  return encryptedSuccessResponse(result, result.decrypted.data ?? { success: true }, {
    message: result.decrypted.message ?? 'Branch deleted successfully',
  });
}

export async function proxyBranchTree(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const { searchParams } = new URL(request.url);
  const { activeOnly } = readBranchTreeQueryFromRequest(searchParams);
  const queryPayload: Record<string, string> = {
    _t: String(Date.now()),
  };
  if (activeOnly) {
    queryPayload.active_only = 'true';
  }

  const backendUrl = `${BACKEND_API_URL}/api/v1/branches/tree`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'GET',
      authToken,
      queryParams: queryPayload,
      noCache: true,
    });
  } catch (fetchError) {
    console.error('[Branch Tree API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to fetch branch tree');
  }

  const branchTree = extractBranchTreePayload(result.decrypted.data);

  return encryptedSuccessResponse(result, branchTree, {
    message: result.decrypted.message ?? 'Branch tree retrieved successfully',
  });
}

export async function proxyBranchStatus(request: NextRequest, id: string) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const body = await request.json().catch(() => ({}));
  const backendUrl = `${BACKEND_API_URL}/api/v1/branches/${id}/status`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'PATCH',
      authToken,
      body,
    });
  } catch (fetchError) {
    console.error('[Branch Status API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to update branch status');
  }

  return encryptedSuccessResponse(result, result.decrypted.data ?? { success: true }, {
    message: result.decrypted.message ?? 'Status updated successfully',
  });
}

export async function proxyBranchApprovalAction(
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

  const backendUrl = `${BACKEND_API_URL}/api/v1/branches/approvals/${requestId}/${action}`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'POST',
      authToken,
      body: payload,
    });
  } catch (fetchError) {
    console.error(`[Branch Approval API ${action}] Fetch error:`, fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, `Failed to ${action} request`);
  }

  return encryptedSuccessResponse(result, result.decrypted.data ?? { success: true });
}

export async function proxyBranchExcelExport(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const { searchParams } = new URL(request.url);
  const queryPayload = readBranchExportQueryFromRequest(searchParams);
  const backendUrl = appendEncryptedQueryToUrl(
    `${BACKEND_API_URL}/api/v1/branches/export/excel`,
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
    console.error('[Branch Export API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!response.ok) {
    const errorText = await response.text();

    return NextResponse.json(
      {
        success: false,
        message: readErrorMessage(errorText, 'Failed to export branches'),
        error: errorText || 'Failed to export branches',
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
    contentDisposition || 'attachment; filename="branches-export.xlsx"'
  );

  return new NextResponse(buffer, { status: 200, headers });
}
