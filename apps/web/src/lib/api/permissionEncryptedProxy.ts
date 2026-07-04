/**
 * Permission BFF proxy — encrypted backend communication for RBAC matrix APIs.
 */

import { NextRequest, NextResponse } from 'next/server';

import { BACKEND_API_URL, getBackendApiKey } from '@/lib/api/backendConfig';
import { encryptCustomToken } from '@/lib/api/customEncrypt';
import {
  backendUnavailableJsonResponse,
  encryptedBackendErrorResponse,
  encryptedSuccessResponse,
  proxyEncryptedBackendJson,
  resolveAuthTokenFromRequest,
  unauthorizedJsonResponse,
} from '@/lib/api/encryptedRouteProxy';
import {
  buildPermissionBackendExportUrl,
  buildPermissionBackendGetUrl,
  readPermissionExportQueryFromRequest,
  readPermissionQueryFromRequest,
} from '@/lib/api/permissionEncryptedQuery';
import { readErrorMessage } from '@/lib/api/parseResponse';

const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function proxyPermissionGet(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const { searchParams } = new URL(request.url);
  const { roleId } = readPermissionQueryFromRequest(searchParams);

  if (!roleId) {
    return NextResponse.json(
      {
        success: false,
        message: 'role_id is required',
        error: 'role_id query parameter is required',
      },
      { status: 400 }
    );
  }

  const backendUrl = buildPermissionBackendGetUrl(
    `${BACKEND_API_URL}/api/v1/permissions`,
    roleId
  );

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'GET',
      authToken,
      noCache: true,
    });
  } catch (fetchError) {
    console.error('[Permission API] GET Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to fetch permissions');
  }

  return encryptedSuccessResponse(result, result.decrypted.data ?? result.decrypted, {
    message: result.decrypted.message ?? 'Permissions fetched successfully',
  });
}

export async function proxyPermissionSave(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const body = await request.json().catch(() => ({}));
  const backendUrl = `${BACKEND_API_URL}/api/v1/permissions`;

  let result;
  try {
    result = await proxyEncryptedBackendJson(backendUrl, {
      method: 'PUT',
      authToken,
      body,
    });
  } catch (fetchError) {
    console.error('[Permission API] PUT Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!result.ok) {
    return encryptedBackendErrorResponse(result, 'Failed to save permissions');
  }

  return encryptedSuccessResponse(result, result.decrypted.data ?? { success: true }, {
    message: result.decrypted.message ?? 'Permissions saved successfully',
  });
}

export async function proxyPermissionExcelExport(request: NextRequest) {
  const authToken = await resolveAuthTokenFromRequest(request);
  if (!authToken) {
    return unauthorizedJsonResponse();
  }

  const { searchParams } = new URL(request.url);
  const queryPayload = readPermissionExportQueryFromRequest(searchParams);

  if (!queryPayload.role_id) {
    return NextResponse.json(
      {
        success: false,
        message: 'role_id is required',
        error: 'role_id query parameter is required for permissions export',
      },
      { status: 400 }
    );
  }

  const backendUrl = buildPermissionBackendExportUrl(
    `${BACKEND_API_URL}/api/v1/permissions/export/excel`,
    {
      role_id: queryPayload.role_id,
      sort_by: queryPayload.sort_by,
      sort_order: queryPayload.sort_order,
    }
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
    console.error('[Permission Export API] Fetch error:', fetchError);
    return backendUnavailableJsonResponse(fetchError);
  }

  if (!response.ok) {
    const errorText = await response.text();

    return NextResponse.json(
      {
        success: false,
        message: readErrorMessage(errorText, 'Failed to export permissions'),
        error: errorText || 'Failed to export permissions',
      },
      { status: response.status }
    );
  }

  const buffer = await response.arrayBuffer();
  const headers = new Headers();
  headers.set('Content-Type', response.headers.get('Content-Type') || EXCEL_MIME);

  const roleId = queryPayload.role_id;
  const contentDisposition = response.headers.get('Content-Disposition');
  headers.set(
    'Content-Disposition',
    contentDisposition || `attachment; filename="rbac-permissions-role-${roleId}.xlsx"`
  );

  return new NextResponse(buffer, { status: 200, headers });
}
