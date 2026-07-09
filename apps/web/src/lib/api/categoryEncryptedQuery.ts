/**
 * Category module — encrypted query parameter helpers.
 */

import { buildEncryptedQueryString as buildClientEncryptedQueryString } from './customEncryptClient';
import { readEncryptedExportQueryFromRequest, readEncryptedListQueryFromRequest } from './encryptedListQuery';
import {
  buildExportQueryPayload,
  listQueryInputToQueryString,
  type ListQueryInput,
} from './listQueryParams';

export function readCategoryListQueryFromRequest(
  searchParams: URLSearchParams,
  defaults: { sort_by?: string; per_page?: string } = {}
) {
  return readEncryptedListQueryFromRequest(searchParams, defaults);
}

export function buildCategoryListQueryPayload(params?: ListQueryInput): string {
  return listQueryInputToQueryString(params);
}

export function buildCategoryActiveListEncryptedQueryClient(): string {
  return buildClientEncryptedQueryString({ _t: String(Date.now()) });
}

export function buildCategoryExportEncryptedQueryClient(params?: {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  isActive?: boolean;
}): string {
  return buildClientEncryptedQueryString(
    buildExportQueryPayload({
      sortBy: params?.sortBy ?? 'name',
      sortOrder: params?.sortOrder,
      search: params?.search,
      isActive: params?.isActive,
    })
  );
}

export function readCategoryExportQueryFromRequest(
  searchParams: URLSearchParams
): Record<string, string> {
  return readEncryptedExportQueryFromRequest(searchParams, {
    sort_by: 'name',
    sort_order: 'ASC',
  });
}
