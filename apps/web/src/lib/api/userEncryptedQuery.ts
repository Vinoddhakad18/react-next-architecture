/**
 * User module — encrypted query parameter helpers.
 */

import { buildEncryptedQueryString as buildClientEncryptedQueryString } from './customEncryptClient';
import { readEncryptedExportQueryFromRequest, readEncryptedListQueryFromRequest } from './encryptedListQuery';
import {
  buildExportQueryPayload,
  listQueryInputToQueryString,
  type ListQueryInput,
} from './listQueryParams';

export function readUserListQueryFromRequest(
  searchParams: URLSearchParams,
  defaults: { sort_by?: string; per_page?: string } = {}
) {
  return readEncryptedListQueryFromRequest(searchParams, defaults);
}

export function buildUserListQueryPayload(params?: ListQueryInput): string {
  return listQueryInputToQueryString(params);
}

export function buildUserExportEncryptedQueryClient(params?: {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}): string {
  return buildClientEncryptedQueryString(
    buildExportQueryPayload({
      sortBy: params?.sortBy ?? 'name',
      sortOrder: params?.sortOrder,
      search: params?.search,
    })
  );
}

export function readUserExportQueryFromRequest(
  searchParams: URLSearchParams
): Record<string, string> {
  return readEncryptedExportQueryFromRequest(searchParams, {
    sort_by: 'name',
    sort_order: 'ASC',
  });
}
