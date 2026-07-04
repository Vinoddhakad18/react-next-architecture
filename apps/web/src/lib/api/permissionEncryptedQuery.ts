/**
 * Permission module — query helpers.
 * Backend reads role_id / sort from plain query params; request_data is required but {}.
 * - GET:  ?role_id=2&request_data=<encrypted {}>
 * - Export: ?role_id=2&sort_by=menu_id&sort_order=ASC&request_data=<encrypted {}>
 */

import { buildEncryptedQueryString } from './customEncrypt';
import { buildEncryptedQueryString as buildClientEncryptedQueryString } from './customEncryptClient';

/** Empty payload — required request_data token (same idea as menus/active/list). */
export const PERMISSION_REQUEST_DATA_PAYLOAD = {};

/** Read role_id from plain query params (?role_id=2). */
export function readPermissionQueryFromRequest(
  searchParams: URLSearchParams
): { roleId: number | null } {
  const plain = searchParams.get('role_id') ?? searchParams.get('roleId');
  if (plain !== null && plain !== '') {
    const parsed = Number(plain);
    if (Number.isFinite(parsed) && parsed > 0) {
      return { roleId: parsed };
    }
  }
  return { roleId: null };
}

/** Plain query string for permission GET. */
export function buildPermissionListQueryString(roleId: number): string {
  return `?role_id=${roleId}`;
}

/** Plain query string for permission export (role_id + sort in URL, not inside request_data JSON). */
export function buildPermissionExportQueryString(params: {
  roleId: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}): string {
  const query = new URLSearchParams({
    role_id: String(params.roleId),
    sort_by: params.sortBy ?? 'menu_id',
    sort_order: params.sortOrder ?? 'ASC',
  });
  return `?${query.toString()}`;
}

/** Client: plain export query + encrypted empty request_data. */
export function buildPermissionExportEncryptedQueryClient(params: {
  roleId: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}): string {
  const plain = buildPermissionExportQueryString(params).slice(1);
  return buildClientEncryptedQueryString(PERMISSION_REQUEST_DATA_PAYLOAD).replace(
    '?',
    `?${plain}&`
  );
}

/** Server: plain export query + encrypted empty request_data. */
export function buildPermissionExportEncryptedQuery(params: {
  roleId: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}): string {
  const plain = buildPermissionExportQueryString(params).slice(1);
  return buildEncryptedQueryString(PERMISSION_REQUEST_DATA_PAYLOAD).replace(
    '?',
    `?${plain}&`
  );
}

/** Read export params from plain query string. */
export function readPermissionExportQueryFromRequest(
  searchParams: URLSearchParams
): Record<string, string> {
  return {
    role_id: searchParams.get('role_id') ?? searchParams.get('roleId') ?? '',
    sort_by: searchParams.get('sort_by') ?? searchParams.get('sortBy') ?? 'menu_id',
    sort_order: searchParams.get('sort_order') ?? searchParams.get('sortOrder') ?? 'ASC',
  };
}

/** @deprecated Use PERMISSION_REQUEST_DATA_PAYLOAD */
export const PERMISSION_GET_REQUEST_DATA_PAYLOAD = PERMISSION_REQUEST_DATA_PAYLOAD;
