/**
 * Role module — encrypted query parameter helpers.
 */

import { buildEncryptedQueryString as buildClientEncryptedQueryString } from './customEncryptClient';
import { readEncryptedExportQueryFromRequest, readEncryptedListQueryFromRequest } from './encryptedListQuery';
import {
  buildExportQueryPayload,
  listQueryInputToQueryString,
  type ListQueryInput,
} from './listQueryParams';

export function readRoleListQueryFromRequest(
  searchParams: URLSearchParams,
  defaults: { sort_by?: string; per_page?: string } = {}
) {
  return readEncryptedListQueryFromRequest(searchParams, defaults);
}

export function buildRoleListQueryPayload(params?: ListQueryInput): string {
  return listQueryInputToQueryString(params);
}

export function buildRoleActiveListEncryptedQueryClient(): string {
  return buildClientEncryptedQueryString({ _t: String(Date.now()) });
}

export function buildRoleExportEncryptedQueryClient(params?: {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  isActive?: boolean;
}): string {
  return buildClientEncryptedQueryString(
    buildExportQueryPayload({
      sortBy: params?.sortBy ?? 'id',
      sortOrder: params?.sortOrder,
      search: params?.search,
      isActive: params?.isActive,
    })
  );
}

export function readRoleExportQueryFromRequest(
  searchParams: URLSearchParams
): Record<string, string> {
  return readEncryptedExportQueryFromRequest(searchParams, {
    sort_by: 'id',
    sort_order: 'ASC',
  });
}
