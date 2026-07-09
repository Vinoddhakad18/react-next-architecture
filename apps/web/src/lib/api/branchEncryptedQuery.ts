/**
 * Branch module — encrypted query parameter helpers.
 * request_data uses query-string format (same as all modules).
 */

import { buildEncryptedQueryString as buildClientEncryptedQueryString } from './customEncryptClient';
import {
  readEncryptedActiveOnlyFromRequest,
  readEncryptedExportQueryFromRequest,
  readEncryptedListQueryFromRequest,
} from './encryptedListQuery';
import {
  buildExportQueryPayload,
  listQueryInputToQueryString,
  type ListQueryInput,
} from './listQueryParams';

/** Server: read plain or encrypted list query params from incoming request. */
export function readBranchListQueryFromRequest(
  searchParams: URLSearchParams,
  defaults: { sort_by?: string; per_page?: string } = {}
) {
  return readEncryptedListQueryFromRequest(searchParams, defaults);
}

/** Client/server: query-string payload for branch list GET. */
export function buildBranchListQueryPayload(params?: ListQueryInput): string {
  return listQueryInputToQueryString(params);
}

/** Server: read tree query params from plain or encrypted request. */
export function readBranchTreeQueryFromRequest(
  searchParams: URLSearchParams
): { activeOnly: boolean } {
  return { activeOnly: readEncryptedActiveOnlyFromRequest(searchParams) };
}

/** Client: encrypted query for branch tree endpoint. */
export function buildBranchTreeEncryptedQueryClient(activeOnly?: boolean): string {
  const payload: Record<string, string> = {};
  if (activeOnly) {
    payload.active_only = 'true';
  }
  return buildClientEncryptedQueryString(payload);
}

/** Client: encrypted export query params for branch excel export. */
export function buildBranchExportEncryptedQueryClient(params?: {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}): string {
  return buildClientEncryptedQueryString(
    buildExportQueryPayload({
      sortBy: params?.sortBy ?? 'branch_name',
      sortOrder: params?.sortOrder,
      search: params?.search,
    })
  );
}

/** Server: read export query from request. */
export function readBranchExportQueryFromRequest(
  searchParams: URLSearchParams
): Record<string, string> {
  return readEncryptedExportQueryFromRequest(searchParams, {
    sort_by: 'branch_name',
    sort_order: 'ASC',
  });
}
