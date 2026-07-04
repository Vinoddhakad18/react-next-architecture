/**
 * Permission Service
 * Handles RBAC permission API calls
 */

import { API_ENDPOINTS } from '@/lib/api';
import { downloadEntityExport } from '@/lib/api/entityActions';

export interface PermissionExportParams {
  roleId: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const permissionService = {
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
