/**
 * Role Service
 * Handles role-related API calls with encrypted request/response.
 */

import { API_ENDPOINTS } from '@/lib/api';
import {
  buildRoleExportEncryptedQueryClient,
  buildRoleListQueryPayload,
} from '@/lib/api/roleEncryptedQuery';
import {
  encryptedDelete,
  encryptedGet,
  encryptedPatch,
  encryptedPost,
  encryptedPut,
} from '@/lib/api/encryptedClientApi';
import { downloadEntityExport } from '@/lib/api/entityActions';
import { extractPagePermissions } from '@/lib/api/permissions';
import { normalizeRole, normalizeRoleRecord } from '@/lib/roles/normalizeRole';
import type { Role, RoleListParams, RoleListResponse } from '@/types/api';
import type { PagePermissions } from '@/types/api';

export interface CreateRoleRequest {
  name: string;
  description?: string;
  status: boolean;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  status?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractRoleListItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  const container = isRecord(payload.data) ? payload.data : payload;
  const direct = isRecord(container)
    ? (container.data ?? container.roles ?? container.items)
    : container;

  if (Array.isArray(direct)) {
    return direct;
  }

  if (isRecord(direct)) {
    const nested = direct.data ?? direct.roles ?? direct.items;
    if (Array.isArray(nested)) {
      return nested;
    }
  }

  return [];
}

export function normalizeRoleListPayload(
  payload: unknown,
  page = 1,
  limit = 10
): RoleListResponse & { permissions?: PagePermissions } {
  const roleItems = extractRoleListItems(payload);

  const normalizedRoles = roleItems.map((role) =>
    normalizeRole(role as Record<string, unknown>)
  );

  let paginationSource: Record<string, unknown> | null = null;
  if (isRecord(payload)) {
    const container = isRecord(payload.data) && !Array.isArray(payload.data) ? payload.data : payload;
    if (isRecord(container)) {
      paginationSource = (isRecord(container.pagination)
        ? container.pagination
        : isRecord(container.meta)
          ? container.meta
          : null) as Record<string, unknown> | null;
    }
  }

  const pagination = paginationSource ?? {
    total: normalizedRoles.length,
    page,
    limit,
    totalPages: 1,
  };

  const permissions = isRecord(payload) ? extractPagePermissions(payload) : undefined;

  return withListPermissions(
    {
      data: normalizedRoles,
      meta: {
        total: Number(
          pagination.total_records ?? pagination.total ?? normalizedRoles.length
        ),
        page: Number(pagination.page ?? page),
        limit: Number(pagination.per_page ?? pagination.limit ?? limit),
        totalPages: Number(pagination.total_pages ?? pagination.totalPages ?? 1),
      },
    },
    permissions
  );
}

export const roleService = {
  async getRoles(params?: RoleListParams) {
    const response = await encryptedGet<RoleListResponse & { permissions?: PagePermissions }>(
      API_ENDPOINTS.ROLES.LIST,
      { queryParams: buildRoleListQueryPayload(params) || undefined }
    );

    if (response.success && response.data) {
      return {
        ...response,
        data: normalizeRoleListPayload(
          response.data,
          params?.page ?? 1,
          params?.limit ?? 10
        ),
      };
    }

    return response;
  },

  async getActiveRoles() {
    const response = await encryptedGet<{ data: Role[] } | Role[]>(
      API_ENDPOINTS.ROLES.ACTIVE_LIST,
      { queryParams: {} }
    );

    if (!response.success || !response.data) {
      return response;
    }

    const payload = response.data;
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { data?: Role[] }).data)
        ? (payload as { data: Role[] }).data
        : [];

    return {
      ...response,
      data: items.map((role) =>
        normalizeRole(role as unknown as Record<string, unknown>)
      ),
    };
  },

  async createRole(role: CreateRoleRequest) {
    const response = await encryptedPost<Role, Record<string, unknown>>(
      API_ENDPOINTS.ROLES.CREATE,
      {
        name: role.name,
        ...(role.description !== undefined ? { description: role.description } : {}),
        is_active: role.status,
      }
    );

    if (response.success && isRecord(response.data)) {
      return { ...response, data: normalizeRoleRecord(response.data) as unknown as Role };
    }

    return response;
  },

  async getRole(id: number) {
    const response = await encryptedGet<Role>(API_ENDPOINTS.ROLES.GET(id));

    if (response.success && isRecord(response.data)) {
      return { ...response, data: normalizeRoleRecord(response.data) as unknown as Role };
    }

    return response;
  },

  async updateRole(id: number, role: UpdateRoleRequest) {
    const response = await encryptedPut<Role, Record<string, unknown>>(
      API_ENDPOINTS.ROLES.UPDATE(id),
      {
        ...(role.name !== undefined ? { name: role.name } : {}),
        ...(role.description !== undefined ? { description: role.description } : {}),
        ...(role.status !== undefined ? { is_active: role.status } : {}),
      }
    );

    if (response.success && isRecord(response.data)) {
      return { ...response, data: normalizeRoleRecord(response.data) as unknown as Role };
    }

    return response;
  },

  async deleteRole(id: number) {
    return encryptedDelete<void>(API_ENDPOINTS.ROLES.DELETE(id));
  },

  async approveRoleRequest(requestId: number, comment: string) {
    const response = await encryptedPost<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.ROLES.APPROVAL_APPROVE(requestId),
      { comment: comment.trim() }
    );
    return { success: response.success, error: response.error };
  },

  async rejectRoleRequest(requestId: number, reason: string) {
    const response = await encryptedPost<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.ROLES.APPROVAL_REJECT(requestId),
      { reason: reason.trim() }
    );
    return { success: response.success, error: response.error };
  },

  async toggleRoleStatus(id: number, active: boolean) {
    const response = await encryptedPatch<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.ROLES.STATUS(id),
      { status: active ? 'active' : 'inactive' }
    );
    return { success: response.success, error: response.error };
  },

  async exportRoles(params?: Pick<RoleListParams, 'sortBy' | 'sortOrder' | 'search' | 'isActive'>) {
    const encryptedQuery = buildRoleExportEncryptedQueryClient({
      sortBy: params?.sortBy ?? 'id',
      sortOrder: params?.sortOrder,
      search: params?.search,
      isActive: params?.isActive,
    });

    return downloadEntityExport(
      `${API_ENDPOINTS.ROLES.EXPORT}${encryptedQuery}`,
      'roles-export.xlsx',
      {
        accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    );
  },
};

export { normalizeRole } from '@/lib/roles/normalizeRole';

export function withListPermissions<T extends Record<string, unknown>>(
  payload: T,
  permissions?: PagePermissions
): T & { permissions?: PagePermissions } {
  return permissions ? { ...payload, permissions } : payload;
}
