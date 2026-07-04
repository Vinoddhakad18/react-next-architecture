/**
 * Menu module — encrypted query parameter helpers.
 * GET requests use ?request_data=<encrypted> instead of plain query keys.
 */

import { decryptQueryPayload, buildEncryptedQueryString } from './customEncrypt';
import { buildEncryptedQueryString as buildClientEncryptedQueryString } from './customEncryptClient';
import {
  readListQueryParams,
  type BackendListQuery,
  type ListQueryInput,
} from './listQueryParams';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function pickString(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') {
      return String(value);
    }
  }
  return null;
}

function listQueryInputToPayload(params?: ListQueryInput): Record<string, string> {
  const payload: Record<string, string> = {};

  if (params?.page !== undefined) {
    payload.page = String(params.page);
  }
  if (params?.limit !== undefined) {
    payload.per_page = String(params.limit);
  }
  if (params?.sortBy) {
    payload.sort_by = params.sortBy;
  }
  if (params?.sortOrder) {
    payload.sort_order = params.sortOrder;
  }
  if (params?.search) {
    payload.search = params.search;
  }
  if (params?.isActive !== undefined) {
    payload.is_active = String(params.isActive);
  }

  return payload;
}

function decryptedToBackendListQuery(
  decrypted: unknown,
  defaults: { sort_by?: string; per_page?: string } = {}
): BackendListQuery | null {
  if (!isRecord(decrypted)) {
    return null;
  }

  return {
    page: pickString(decrypted, 'page') ?? '1',
    per_page:
      pickString(decrypted, 'per_page', 'limit') ?? defaults.per_page ?? '10',
    sort_by:
      pickString(decrypted, 'sort_by', 'sortBy') ?? defaults.sort_by ?? 'id',
    sort_order: pickString(decrypted, 'sort_order', 'sortOrder') ?? 'ASC',
    search: pickString(decrypted, 'search') ?? '',
    is_active: pickString(decrypted, 'is_active', 'isActive'),
  };
}

/** Server: build encrypted list query string for menu BFF → backend. */
export function buildMenuListEncryptedQuery(
  params?: ListQueryInput,
  options?: { includeCacheBuster?: boolean }
): string {
  const payload = listQueryInputToPayload(params);
  if (options?.includeCacheBuster) {
    payload._t = String(Date.now());
  }
  return buildEncryptedQueryString(payload);
}

/** Client: build encrypted list query string for browser → menu BFF. */
export function buildMenuListEncryptedQueryClient(params?: ListQueryInput): string {
  return buildClientEncryptedQueryString(listQueryInputToPayload(params));
}

/** Server: read plain or encrypted list query params from incoming request. */
export function readMenuListQueryFromRequest(
  searchParams: URLSearchParams,
  defaults: { sort_by?: string; per_page?: string } = {}
): BackendListQuery {
  const decrypted = decryptQueryPayload(searchParams);
  const fromEncrypted = decryptedToBackendListQuery(decrypted, defaults);
  if (fromEncrypted) {
    return fromEncrypted;
  }

  return readListQueryParams(searchParams, defaults);
}

/** Client: not needed for building; server reads encrypted params from client. */

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
  const decrypted = decryptQueryPayload(searchParams);
  if (isRecord(decrypted)) {
    const activeOnly =
      decrypted.active_only === true ||
      decrypted.active_only === 'true' ||
      decrypted.activeOnly === true ||
      decrypted.activeOnly === 'true';
    return { activeOnly };
  }

  return {
    activeOnly:
      searchParams.get('active_only') === 'true' ||
      searchParams.get('activeOnly') === 'true',
  };
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
  const payload: Record<string, string> = {
    sort_by: params?.sortBy ?? 'sort_order',
    sort_order: params?.sortOrder ?? 'ASC',
  };

  if (params?.search) {
    payload.search = params.search;
  }
  if (params?.isActive !== undefined) {
    payload.is_active = String(params.isActive);
  }

  return buildClientEncryptedQueryString(payload);
}

/** Server: read export query from request. */
export function readMenuExportQueryFromRequest(
  searchParams: URLSearchParams
): Record<string, string> {
  const decrypted = decryptQueryPayload(searchParams);
  if (isRecord(decrypted)) {
    const query: Record<string, string> = {
      sort_by: pickString(decrypted, 'sort_by', 'sortBy') ?? 'sort_order',
      sort_order: pickString(decrypted, 'sort_order', 'sortOrder') ?? 'ASC',
    };
    const search = pickString(decrypted, 'search');
    const isActive = pickString(decrypted, 'is_active', 'isActive');
    if (search) query.search = search;
    if (isActive) query.is_active = isActive;
    return query;
  }

  const query: Record<string, string> = {
    sort_by: searchParams.get('sort_by') ?? searchParams.get('sortBy') ?? 'sort_order',
    sort_order: searchParams.get('sort_order') ?? searchParams.get('sortOrder') ?? 'ASC',
  };
  const search = searchParams.get('search');
  const isActive = searchParams.get('is_active') ?? searchParams.get('isActive');
  if (search) query.search = search;
  if (isActive) query.is_active = isActive;
  return query;
}

