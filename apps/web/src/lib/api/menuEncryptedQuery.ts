/**
 * Menu module — encrypted query parameter helpers.
 * request_data uses query-string format (same as all modules).
 */

import { buildEncryptedQueryString } from './customEncrypt';
import { buildEncryptedQueryString as buildClientEncryptedQueryString } from './customEncryptClient';
import {
  readEncryptedActiveOnlyFromRequest,
  readEncryptedExportQueryFromRequest,
  readEncryptedListQueryFromRequest,
} from './encryptedListQuery';
import { listQueryInputToQueryString, type ListQueryInput } from './listQueryParams';
import { buildExportQueryPayload } from './listQueryParams';

/** Server: read plain or encrypted list query params from incoming request. */
export function readMenuListQueryFromRequest(
  searchParams: URLSearchParams,
  defaults: { sort_by?: string; per_page?: string } = {}
) {
  return readEncryptedListQueryFromRequest(searchParams, defaults);
}

/** Client/server: query-string payload for menu list GET. */
export function buildMenuListQueryPayload(params?: ListQueryInput): string {
  return listQueryInputToQueryString(params);
}

/** Server: encrypted query for menu tree endpoint. */
export function buildMenuTreeEncryptedQuery(activeOnly?: boolean): string {
  const payload: Record<string, string> = {
    _t: String(Date.now()),
  };
  if (activeOnly) {
    payload.active_only = 'true';
  }
  return buildEncryptedQueryString(payload);
}

/** Client: encrypted query for menu tree endpoint. */
export function buildMenuTreeEncryptedQueryClient(activeOnly?: boolean): string {
  const payload: Record<string, string> = {};
  if (activeOnly) {
    payload.active_only = 'true';
  }
  return buildClientEncryptedQueryString(payload);
}

/** Server: read tree query params from plain or encrypted request. */
export function readMenuTreeQueryFromRequest(
  searchParams: URLSearchParams
): { activeOnly: boolean } {
  return { activeOnly: readEncryptedActiveOnlyFromRequest(searchParams) };
}

/** Server: encrypted cache-buster query for menu GET by id. */
export function buildMenuDetailEncryptedQuery(): string {
  return buildEncryptedQueryString({ _t: String(Date.now()) });
}

/** Client: encrypted export query params for menu excel export. */
export function buildMenuExportEncryptedQueryClient(params?: {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  isActive?: boolean;
}): string {
  return buildClientEncryptedQueryString(
    buildExportQueryPayload({
      sortBy: params?.sortBy ?? 'sort_order',
      sortOrder: params?.sortOrder,
      search: params?.search,
      isActive: params?.isActive,
    })
  );
}

/** Server: read export query from request. */
export function readMenuExportQueryFromRequest(
  searchParams: URLSearchParams
): Record<string, string> {
  return readEncryptedExportQueryFromRequest(searchParams, {
    sort_by: 'sort_order',
    sort_order: 'ASC',
  });
}
