/**
 * Menu Service
 * Handles all menu-related API calls
 */

import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { postApprovalApprove, postApprovalReject } from '@/lib/api/approvalRequests';
import { toggleEntityStatus, downloadEntityExport } from '@/lib/api/entityActions';
import { resolveApprovalStatus } from '@/lib/approval';
import { normalizeApprovalObject, resolveEntityApprovalStatus } from '@/lib/approval/entityApproval';
import { pickField, toBooleanFlag } from '@/lib/api/fieldAccess';
import type { Menu, MenuListParams, MenuListResponse } from '@/types/api';
import type { PagePermissions } from '@/types/api';

export interface CreateMenuRequest {
  name: string;
  route: string;
  parent_id: number | null;
  sort_order: number;
  is_active: boolean;
}

export interface UpdateMenuRequest {
  name?: string;
  route?: string;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}

export const menuService = {
  /**
   * Get list of menus with pagination and sorting
   */
  async getMenus(params?: MenuListParams) {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params?.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }
    if (params?.search) {
      queryParams.append('search', params.search);
    }
    if (params?.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString());
    }

    const endpoint = `${API_ENDPOINTS.MENUS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // API client returns { success: true, data: MenuListResponse, error: null }
    // So response.data is the MenuListResponse
    return apiClient.get<MenuListResponse>(endpoint, { auth: true });
  },

  /**
   * Get list of active menus
   */
  async getActiveMenus() {
    return apiClient.get<{ data: Menu[] } | Menu[]>(API_ENDPOINTS.MENUS.ACTIVE_LIST, { auth: true });
  },

  /**
   * Get the hierarchical menu tree
   */
  async getMenuTree(activeOnly = false) {
    const queryParams = new URLSearchParams();
    if (activeOnly) {
      queryParams.append('active_only', 'true');
    }

    const endpoint = `${API_ENDPOINTS.MENUS.TREE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<{ success: boolean; message: string; data: Menu[] }>(endpoint, { auth: true });
  },

  /**
   * Create a new menu
   */
  async createMenu(menu: CreateMenuRequest) {
    return apiClient.post<Menu, CreateMenuRequest>(
      API_ENDPOINTS.MENUS.CREATE,
      menu,
      { auth: true }
    );
  },

  /**
   * Get a single menu by ID
   */
  async getMenu(id: number) {
    return apiClient.get<Menu>(API_ENDPOINTS.MENUS.GET(id), { auth: true });
  },

  /**
   * Update an existing menu
   */
  async updateMenu(id: number, menu: UpdateMenuRequest) {
    return apiClient.put<Menu, UpdateMenuRequest>(
      API_ENDPOINTS.MENUS.UPDATE(id),
      menu,
      { auth: true }
    );
  },

  /**
   * Delete a menu
   */
  async deleteMenu(id: number) {
    return apiClient.delete<void>(API_ENDPOINTS.MENUS.DELETE(id), { auth: true });
  },

  async approveMenuRequest(requestId: number, comment: string) {
    return postApprovalApprove(API_ENDPOINTS.MENUS.APPROVAL_APPROVE(requestId), comment);
  },

  async rejectMenuRequest(requestId: number, reason: string) {
    return postApprovalReject(API_ENDPOINTS.MENUS.APPROVAL_REJECT(requestId), reason);
  },

  async toggleMenuStatus(id: number, active: boolean) {
    return toggleEntityStatus(API_ENDPOINTS.MENUS.STATUS(id), active);
  },

  async exportMenus() {
    return downloadEntityExport(API_ENDPOINTS.MENUS.EXPORT, 'menus-export.csv');
  },
};

export function normalizeMenu(menu: Record<string, unknown>): Menu {
  const isActive = Boolean(menu.is_active ?? menu.isActive ?? true);
  const approval = normalizeApprovalObject(menu.approval);
  return {
    id: Number(menu.id),
    name: String(menu.name ?? ''),
    slug: menu.slug ? String(menu.slug) : undefined,
    route: menu.route ? String(menu.route) : undefined,
    description: menu.description ? String(menu.description) : undefined,
    sortOrder: Number(menu.sort_order ?? menu.sortOrder ?? 0),
    isActive,
    approval,
    isPendingCreate:
      toBooleanFlag(pickField(menu, 'isPendingCreate', 'is_pending_create')),
    approvalStatus: approval
      ? resolveEntityApprovalStatus(approval)
      : resolveApprovalStatus(
          menu.approval_status ?? menu.approvalStatus,
          menu.is_active ?? menu.isActive
        ),
    parentId: menu.parent_id !== undefined ? Number(menu.parent_id) : menu.parentId !== undefined ? Number(menu.parentId) : null,
    createdAt: String(menu.created_at ?? menu.createdAt ?? new Date().toISOString()),
    updatedAt: String(menu.updated_at ?? menu.updatedAt ?? new Date().toISOString()),
  };
}

export function withListPermissions<T extends Record<string, unknown>>(
  payload: T,
  permissions?: PagePermissions
): T & { permissions?: PagePermissions } {
  return permissions ? { ...payload, permissions } : payload;
}

