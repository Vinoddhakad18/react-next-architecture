/**
 * Permission Service
 * Handles RBAC permission API calls
 */

import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { downloadEntityExport } from '@/lib/api/entityActions';
import type { RbacPermissionsResponse, SaveRbacPermissionsRequest } from '@/types/api/permission';

export interface PermissionExportParams {
  roleId: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Resolve menu id from API item (snake_case or legacy camelCase). */
export function resolvePermissionMenuId(item: Record<string, unknown>): number | undefined {
  const id = item.menu_id ?? item.menuId;
  if (id === undefined || id === null) {
    return undefined;
  }
  const parsed = Number(id);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/** Unwrap `{ data: { role_id, permissions } }` or return the object itself. */
export function unwrapRbacPermissionsPayload(raw: unknown): RbacPermissionsResponse | null {
  if (!isRecord(raw)) {
    return null;
  }

  const payload = isRecord(raw.data) && !Array.isArray(raw.data) ? raw.data : raw;
  const roleId = payload.role_id ?? payload.roleId;

  if (roleId === undefined || !Array.isArray(payload.permissions)) {
    return null;
  }

  return {
    role_id: Number(roleId),
    permissions: payload.permissions
      .filter(isRecord)
      .map((item) => {
        const menuId = resolvePermissionMenuId(item);
        const flags = isRecord(item.permissions) ? item.permissions : item;
        return {
          menu_id: menuId ?? 0,
          permissions: {
            view: Number(flags.view ?? 0),
            add: Number(flags.add ?? 0),
            edit: Number(flags.edit ?? 0),
            delete: Number(flags.delete ?? 0),
            export: Number(flags.export ?? 0),
            status: Number(flags.status ?? 0),
            approval: Number(flags.approval ?? 0),
          },
        };
      })
      .filter((item) => item.menu_id > 0),
  };
}

export const permissionService = {
  async getPermissions(roleId: number) {
    return apiClient.get<RbacPermissionsResponse>(
      `${API_ENDPOINTS.PERMISSIONS.LIST}?role_id=${roleId}`,
      { auth: true }
    );
  },

  async savePermissions(payload: SaveRbacPermissionsRequest) {
    return apiClient.put<{ success: boolean; message: string; data?: RbacPermissionsResponse }>(
      API_ENDPOINTS.PERMISSIONS.LIST,
      payload,
      { auth: true }
    );
  },

  async exportPermissions(params: PermissionExportParams) {
    const queryParams: Record<string, string> = {
      role_id: params.roleId.toString(),
      sort_by: params.sortBy ?? 'menu_id',
      sort_order: params.sortOrder ?? 'ASC',
    };

    return downloadEntityExport(
      API_ENDPOINTS.PERMISSIONS.EXPORT,
      `rbac-permissions-role-${params.roleId}.xlsx`,
      {
        queryParams,
        accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    );
  },
};
