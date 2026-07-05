/**
 * Permission module — encrypted query parameter helpers.
 *
 * Client → BFF: ?request_data=<encrypted role_id=2>
 * BFF → Backend: plain ?role_id=2&request_data=<encrypted {}>
 *
 * The permissions backend reads role_id from plain query params (not from
 * decrypted request_data). request_data must be present but empty.
 */

import { buildEncryptedQueryString } from './customEncrypt';
import { buildEncryptedQueryString as buildClientEncryptedQueryString } from './customEncryptClient';
import {
  readEncryptedExportQueryFromRequest,
  readEncryptedRoleIdFromRequest,
} from './encryptedListQuery';
import { buildExportQueryPayload } from './listQueryParams';
import { serializeEncryptedQueryPayload } from './encryptedQueryPayload';

/** Empty payload — backend requires request_data alongside plain query params. */
export const PERMISSION_BACKEND_REQUEST_DATA_PAYLOAD = {};

/** Plain query-string payload for permission GET (encrypted into request_data). */
export function buildPermissionListQueryPayload(roleId: number): string {
  return `role_id=${roleId}`;
}

/** Server: backend GET URL with plain role_id + encrypted empty request_data. */
export function buildPermissionBackendGetUrl(baseUrl: string, roleId: number): string {
  const encryptedToken = buildEncryptedQueryString(PERMISSION_BACKEND_REQUEST_DATA_PAYLOAD);
  return `${baseUrl}?role_id=${roleId}&${encryptedToken.slice(1)}`;
}

/** Server: backend export URL with plain params + encrypted empty request_data. */
export function buildPermissionBackendExportUrl(
  baseUrl: string,
  params: { role_id: string; sort_by: string; sort_order: string }
): string {
  const plain = new URLSearchParams({
    role_id: params.role_id,
    sort_by: params.sort_by,
    sort_order: params.sort_order,
  }).toString();
  const encryptedToken = buildEncryptedQueryString(PERMISSION_BACKEND_REQUEST_DATA_PAYLOAD);
  return `${baseUrl}?${plain}&${encryptedToken.slice(1)}`;
}

/** Client: encrypted query string for permission GET. */
export function buildPermissionListEncryptedQueryClient(roleId: number): string {
  return buildClientEncryptedQueryString(buildPermissionListQueryPayload(roleId));
}

/** Server: read role_id from encrypted or plain query params. */
export function readPermissionQueryFromRequest(
  searchParams: URLSearchParams
): { roleId: number | null } {
  return readEncryptedRoleIdFromRequest(searchParams);
}

/** Client: encrypted export query string (query-string inside request_data). */
export function buildPermissionExportEncryptedQueryClient(params: {
  roleId: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}): string {
  const queryString = serializeEncryptedQueryPayload(
    buildExportQueryPayload({
      roleId: params.roleId,
      sortBy: params.sortBy ?? 'menu_id',
      sortOrder: params.sortOrder,
    })
  );
  return buildClientEncryptedQueryString(queryString);
}

/** Server: read export params from encrypted or plain request. */
export function readPermissionExportQueryFromRequest(
  searchParams: URLSearchParams
): Record<string, string> {
  return readEncryptedExportQueryFromRequest(searchParams, {
    sort_by: 'menu_id',
    sort_order: 'ASC',
  });
}

/** @deprecated Use PERMISSION_BACKEND_REQUEST_DATA_PAYLOAD */
export const PERMISSION_GET_REQUEST_DATA_PAYLOAD = PERMISSION_BACKEND_REQUEST_DATA_PAYLOAD;
