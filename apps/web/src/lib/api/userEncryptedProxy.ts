/**
 * User BFF proxy — encrypted backend communication and response normalization.
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
import {
  readUserExportQueryFromRequest,
  readUserListQueryFromRequest,
} from '@/lib/api/userEncryptedQuery';
import { readErrorMessage } from '@/lib/api/parseResponse';
import { parseUserListResponse } from '@/lib/users/parseUserListResponse';
import { normalizeUser } from '@/lib/utils/normalizeUser';

const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function proxyUserList(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const { searchParams } = new URL(request.url);
  const listQuery = readUserListQueryFromRequest(searchParams, { sort_by: 'name' });
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

  const backendUrl = `${BACKEND_API_URL}/api/v1/users`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'GET',
      authToken,
      queryParams: queryPayload,
      noCache: true,
    });
  } catch (fetchError) {
    console.error('[Users API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to fetch users');
  }

  const parsed = parseUserListResponse(result.decrypted.data);

  return NextResponse.json(
    buildEncryptedClientResponse(result.raw, {
      success: true,
      message: result.decrypted.message ?? 'Users fetched successfully',
      data: parsed,
      extra: parsed.permissions ? { permissions: parsed.permissions } : undefined,
    }),
    { status: 200 }
  );
}

export async function proxyUserCreate(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const body = await request.json().catch(() => ({}));
  const backendUrl = `${BACKEND_API_URL}/api/v1/users`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'POST',
      authToken,
      body,
    });
  } catch (fetchError) {
    console.error('[Users API POST] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to create user');
  }

  const userPayload = result.decrypted.data;
  const normalizedData = isRecord(userPayload)
    ? normalizeUser(userPayload)
    : userPayload;

  return encryptedSuccessResponse(result, normalizedData, {
    message: result.decrypted.message ?? 'User created successfully',
  });
}

export async function proxyUserUpdate(request: NextRequest, id: string) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const body = await request.json().catch(() => ({}));
  const backendUrl = `${BACKEND_API_URL}/api/v1/users/${id}`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'PUT',
      authToken,
      body,
    });
  } catch (fetchError) {
    console.error('[User Item API PUT] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to update user');
  }

  const userPayload = result.decrypted.data;
  const normalizedData = isRecord(userPayload)
    ? normalizeUser(userPayload)
    : userPayload;

  return encryptedSuccessResponse(result, normalizedData);
}

export async function proxyUserSoftDelete(request: NextRequest, id: string) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const backendUrl = `${BACKEND_API_URL}/api/v1/users/${id}`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'DELETE',
      authToken,
    });
  } catch (fetchError) {
    console.error('[User Soft Delete API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to delete user');
  }

  return encryptedSuccessResponse(result, result.decrypted.data ?? { success: true }, {
    message: result.decrypted.message ?? 'User deleted successfully',
  });
}

export async function proxyUserStatus(request: NextRequest, id: string) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const body = await request.json().catch(() => ({}));
  const backendUrl = `${BACKEND_API_URL}/api/v1/users/${id}/status`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'PATCH',
      authToken,
      body,
    });
  } catch (fetchError) {
    console.error('[User Status API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to update user status');
  }

  return encryptedSuccessResponse(result, result.decrypted.data ?? { success: true }, {
    message: result.decrypted.message ?? 'Status updated successfully',
  });
}

export async function proxyUserApprovalAction(
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

  const backendUrl = `${BACKEND_API_URL}/api/v1/users/approvals/${requestId}/${action}`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'POST',
      authToken,
      body: payload,
    });
  } catch (fetchError) {
    console.error(`[User Approval API ${action}] Fetch error:`, fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, `Failed to ${action} request`);
  }

  return encryptedSuccessResponse(result, result.decrypted.data ?? { success: true });
}

export async function proxyUserExcelExport(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const { searchParams } = new URL(request.url);
  const queryPayload = readUserExportQueryFromRequest(searchParams);
  const backendUrl = appendEncryptedQueryToUrl(
    `${BACKEND_API_URL}/api/v1/users/export/excel`,
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
    console.error('[User Export API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!response.ok) {
    const errorText = await response.text();

    return NextResponse.json(
      {
        success: false,
        message: readErrorMessage(errorText, 'Failed to export users'),
        error: errorText || 'Failed to export users',
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
    contentDisposition || 'attachment; filename="users-export.xlsx"'
  );

  return new NextResponse(buffer, { status: 200, headers });
}
