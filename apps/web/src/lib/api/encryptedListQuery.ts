/**
 * Server-side readers for encrypted list/export/tree query params.
 */

import { decryptQueryPayload } from './customEncrypt';
import {
  parseEncryptedQueryPayload,
  parseQueryFlag,
  pickQueryField,
} from './encryptedQueryPayload';
import {
  readListQueryParams,
  type BackendListQuery,
} from './listQueryParams';

function fieldsToBackendListQuery(
  fields: Record<string, string>,
  defaults: { sort_by?: string; per_page?: string } = {}
): BackendListQuery {
  return {
    page: pickQueryField(fields, 'page') ?? '1',
    per_page: pickQueryField(fields, 'per_page', 'limit') ?? defaults.per_page ?? '10',
    sort_by: pickQueryField(fields, 'sort_by', 'sortBy') ?? defaults.sort_by ?? 'id',
    sort_order: pickQueryField(fields, 'sort_order', 'sortOrder') ?? 'ASC',
    search: pickQueryField(fields, 'search') ?? '',
    is_active: pickQueryField(fields, 'is_active', 'isActive'),
  };
}

/** Read list query from encrypted request_data or plain query params. */
export function readEncryptedListQueryFromRequest(
  searchParams: URLSearchParams,
  defaults: { sort_by?: string; per_page?: string } = {}
): BackendListQuery {
  const fields = parseEncryptedQueryPayload(decryptQueryPayload(searchParams));
  if (fields) {
    return fieldsToBackendListQuery(fields, defaults);
  }

  return readListQueryParams(searchParams, defaults);
}

/** Read export sort/filter params from encrypted request_data or plain query. */
export function readEncryptedExportQueryFromRequest(
  searchParams: URLSearchParams,
  defaults: { sort_by?: string; sort_order?: string } = {}
): Record<string, string> {
  const fields = parseEncryptedQueryPayload(decryptQueryPayload(searchParams));
  if (fields) {
    return {
      sort_by: pickQueryField(fields, 'sort_by', 'sortBy') ?? defaults.sort_by ?? 'id',
      sort_order: pickQueryField(fields, 'sort_order', 'sortOrder') ?? defaults.sort_order ?? 'ASC',
      ...(pickQueryField(fields, 'search') ? { search: pickQueryField(fields, 'search')! } : {}),
      ...(pickQueryField(fields, 'is_active', 'isActive')
        ? { is_active: pickQueryField(fields, 'is_active', 'isActive')! }
        : {}),
      ...(pickQueryField(fields, 'role_id', 'roleId')
        ? { role_id: pickQueryField(fields, 'role_id', 'roleId')! }
        : {}),
    };
  }

  const query: Record<string, string> = {
    sort_by: searchParams.get('sort_by') ?? searchParams.get('sortBy') ?? defaults.sort_by ?? 'id',
    sort_order:
      searchParams.get('sort_order') ?? searchParams.get('sortOrder') ?? defaults.sort_order ?? 'ASC',
  };

  const search = searchParams.get('search');
  const isActive = searchParams.get('is_active') ?? searchParams.get('isActive');
  const roleId = searchParams.get('role_id') ?? searchParams.get('roleId');

  if (search) query.search = search;
  if (isActive) query.is_active = isActive;
  if (roleId) query.role_id = roleId;

  return query;
}

/** Read active_only flag from encrypted request_data or plain query. */
export function readEncryptedActiveOnlyFromRequest(searchParams: URLSearchParams): boolean {
  const fields = parseEncryptedQueryPayload(decryptQueryPayload(searchParams));
  if (fields) {
    return parseQueryFlag(pickQueryField(fields, 'active_only', 'activeOnly'));
  }

  return (
    searchParams.get('active_only') === 'true' || searchParams.get('activeOnly') === 'true'
  );
}

/** Read role_id from encrypted request_data or plain query. */
export function readEncryptedRoleIdFromRequest(
  searchParams: URLSearchParams
): { roleId: number | null } {
  const fields = parseEncryptedQueryPayload(decryptQueryPayload(searchParams));
  if (fields) {
    const roleId = pickQueryField(fields, 'role_id', 'roleId');
    if (roleId) {
      const parsed = Number(roleId);
      if (Number.isFinite(parsed) && parsed > 0) {
        return { roleId: parsed };
      }
    }
  }

  const plain = searchParams.get('role_id') ?? searchParams.get('roleId');
  if (plain) {
    const parsed = Number(plain);
    if (Number.isFinite(parsed) && parsed > 0) {
      return { roleId: parsed };
    }
  }

  return { roleId: null };
}
