/**
 * Permission Service
 * Handles RBAC permission API calls
 */

import { API_ENDPOINTS } from '@/lib/api';
import {
  encryptedGet,
  encryptedPut,
} from '@/lib/api/encryptedClientApi';
import {
  PERMISSION_REQUEST_DATA_PAYLOAD,
  buildPermissionExportEncryptedQueryClient,
  buildPermissionListQueryString,
} from '@/lib/api/permissionEncryptedQuery';
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
    const response = await encryptedGet<RbacPermissionsResponse>(
      `${API_ENDPOINTS.PERMISSIONS.LIST}${buildPermissionListQueryString(roleId)}`,
      { queryParams: PERMISSION_REQUEST_DATA_PAYLOAD }
    );

    if (response.success && response.data) {
      const unwrapped = unwrapRbacPermissionsPayload(response.data);
      if (unwrapped) {
        return { ...response, data: unwrapped };
      }
    }

    return response;
  },

  async savePermissions(payload: SaveRbacPermissionsRequest) {
    return encryptedPut<{ success: boolean; message: string; data?: RbacPermissionsResponse }>(
      API_ENDPOINTS.PERMISSIONS.LIST,
      payload
    );
  },

  async exportPermissions(params: PermissionExportParams) {
    const exportUrl = `${API_ENDPOINTS.PERMISSIONS.EXPORT}${buildPermissionExportEncryptedQueryClient({
      roleId: params.roleId,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    })}`;

    return downloadEntityExport(
      exportUrl,
      `rbac-permissions-role-${params.roleId}.xlsx`,
      {
        accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    );
  },
};
