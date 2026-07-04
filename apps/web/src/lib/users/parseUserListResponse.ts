/**
 * Parse the users list API response into a normalized UserListResponse.
 *
 * Supports the backend shape:
 * { success, message, data: { data: User[], pendingCreates: User[], pagination }, permissions }
 * and the Next.js proxy shape:
 * { data: User[], pendingCreates?: User[], meta, permissions }
 */

import { extractPagePermissions } from '@/lib/api/permissions';
import { normalizeUser } from '@/lib/utils/normalizeUser';
import type { PagePermissions } from '@/types/api';
import type { User, UserListMeta, UserListResponse } from '@/types/api/user';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizePagination(
  pagination: Record<string, unknown> | undefined,
  fallbackTotal: number
): UserListMeta {
  const perPage = Number(pagination?.per_page ?? pagination?.limit ?? 10);
  const totalRecords = Number(
    pagination?.total_records ?? pagination?.total ?? fallbackTotal
  );

  return {
    total: totalRecords,
    page: Number(pagination?.page ?? 1),
    limit: perPage,
    totalPages: Number(
      pagination?.total_pages ??
        pagination?.totalPages ??
        Math.max(1, Math.ceil(totalRecords / perPage))
    ),
  };
}

function mapUserRows(rows: unknown[], isPendingCreate = false): User[] {
  return rows
    .filter(isRecord)
    .map((row) => normalizeUser(row, { isPendingCreate }));
}

/**
 * Extract list payload + permissions from any supported response nesting.
 */
export function parseUserListResponse(raw: unknown): UserListResponse {
  if (!isRecord(raw)) {
    return {
      data: [],
      pendingCreates: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      permissions: extractPagePermissions(null),
    };
  }

  // Permissions may sit at the top level or inside nested wrappers.
  const permissions: PagePermissions = extractPagePermissions(raw);

  // Unwrap { success, data: { data, pendingCreates, pagination }, permissions }
  // or proxy { data: User[], pendingCreates?, meta, permissions }
  const listContainer: Record<string, unknown> =
    isRecord(raw.data) && !Array.isArray(raw.data) ? raw.data : raw;

  const userRows = Array.isArray(listContainer.data)
    ? listContainer.data
    : Array.isArray(raw.data)
    ? raw.data
    : [];

  const paginationSource = isRecord(listContainer.pagination)
    ? listContainer.pagination
    : isRecord(listContainer.meta)
    ? listContainer.meta
    : isRecord(raw.meta)
    ? raw.meta
    : undefined;

  const pendingRows = Array.isArray(listContainer.pendingCreates)
    ? listContainer.pendingCreates
    : Array.isArray(listContainer.pending_creates)
    ? listContainer.pending_creates
    : Array.isArray(raw.pendingCreates)
    ? raw.pendingCreates
    : Array.isArray(raw.pending_creates)
    ? raw.pending_creates
    : [];

  const data = mapUserRows(userRows);
  const pendingCreates = mapUserRows(pendingRows, true);
  const totalCount = Number(paginationSource?.total ?? data.length + pendingCreates.length);

  return {
    data,
    pendingCreates,
    meta: normalizePagination(paginationSource, totalCount),
    permissions,
  };
}
