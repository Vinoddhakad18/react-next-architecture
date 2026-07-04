/**
 * Menu Service
 * Handles all menu-related API calls with encrypted request/response.
 */

import { API_ENDPOINTS } from '@/lib/api';
import {
  encryptedDelete,
  encryptedGet,
  encryptedPatch,
  encryptedPost,
  encryptedPut,
} from '@/lib/api/encryptedClientApi';
import { buildMenuExportEncryptedQueryClient } from '@/lib/api/menuEncryptedQuery';
import { downloadEntityExport } from '@/lib/api/entityActions';
import { extractPagePermissions } from '@/lib/api/permissions';
import { normalizeMenu } from '@/lib/menus/normalizeMenu';
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeMenuListPayload(
  payload: unknown,
  page = 1,
  limit = 10
): MenuListResponse & { permissions?: PagePermissions } {
  let backendData: unknown = payload;

  if (isRecord(payload) && isRecord(payload.data)) {
    backendData = payload.data;
  }

  const menuItems = isRecord(backendData)
    ? (backendData.data ?? backendData.menus ?? [])
    : backendData;

  const normalizedMenus = (Array.isArray(menuItems) ? menuItems : []).map((menu) =>
    normalizeMenu(menu as Record<string, unknown>)
  );

  const paginationSource = isRecord(backendData) ? backendData.pagination ?? backendData.meta : null;
  const pagination = isRecord(paginationSource)
    ? paginationSource
    : {
        total: normalizedMenus.length,
        page,
        limit,
        totalPages: 1,
      };

  const permissions = isRecord(payload) ? extractPagePermissions(payload) : undefined;

  return withListPermissions(
    {
      data: normalizedMenus,
      meta: {
        total: Number(
          pagination.total_records ?? pagination.total ?? normalizedMenus.length
        ),
        page: Number(pagination.page ?? page),
        limit: Number(pagination.per_page ?? pagination.limit ?? limit),
        totalPages: Number(pagination.total_pages ?? pagination.totalPages ?? 1),
      },
    },
    permissions
  );
}

function normalizeMenuTree(items: unknown[]): Menu[] {
  return items.map((item) => {
    const menu = normalizeMenu(item as Record<string, unknown>);
    const children = (item as Record<string, unknown>).children;
    return {
      ...menu,
      children: Array.isArray(children)
        ? normalizeMenuTree(children as unknown[])
        : undefined,
    };
  });
}

function extractTreeItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isRecord(payload)) {
    if (Array.isArray(payload.data)) {
      return payload.data;
    }
    if (isRecord(payload.data) && Array.isArray(payload.data.data)) {
      return payload.data.data;
    }
  }

  return [];
}

function buildMenuListQueryPayload(params?: MenuListParams): Record<string, string> {
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

export const menuService = {
  async getMenus(params?: MenuListParams) {
    const response = await encryptedGet<MenuListResponse & { permissions?: PagePermissions }>(
      API_ENDPOINTS.MENUS.LIST,
      { queryParams: buildMenuListQueryPayload(params) }
    );

    if (response.success && response.data) {
      return {
        ...response,
        data: normalizeMenuListPayload(
          response.data,
          params?.page ?? 1,
          params?.limit ?? 10
        ),
      };
    }

    return response;
  },

  async getActiveMenus() {
    const response = await encryptedGet<{ data: Menu[] } | Menu[]>(
      API_ENDPOINTS.MENUS.ACTIVE_LIST,
      { queryParams: {} }
    );

    if (!response.success || !response.data) {
      return response;
    }

    const payload = response.data;
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { data?: Menu[] }).data)
        ? (payload as { data: Menu[] }).data
        : [];

    return {
      ...response,
      data: items.map((menu) => normalizeMenu(menu as unknown as Record<string, unknown>)),
    };
  },

  async getMenuTree(activeOnly = false) {
    const response = await encryptedGet<{ success: boolean; message: string; data: Menu[] }>(
      API_ENDPOINTS.MENUS.TREE,
      {
        queryParams: activeOnly ? { active_only: 'true' } : {},
      }
    );

    if (response.success && response.data) {
      const treeItems = extractTreeItems(response.data);
      return {
        ...response,
        data: {
          success: true,
          message: 'Menu tree retrieved successfully',
          data: normalizeMenuTree(treeItems),
        },
      };
    }

    return response;
  },

  async createMenu(menu: CreateMenuRequest) {
    const response = await encryptedPost<Menu, CreateMenuRequest>(
      API_ENDPOINTS.MENUS.CREATE,
      menu
    );

    if (response.success && isRecord(response.data)) {
      return { ...response, data: normalizeMenu(response.data) };
    }

    return response;
  },

  async getMenu(id: number) {
    const response = await encryptedGet<Menu>(API_ENDPOINTS.MENUS.GET(id));

    if (response.success && isRecord(response.data)) {
      return { ...response, data: normalizeMenu(response.data) };
    }

    return response;
  },

  async updateMenu(id: number, menu: UpdateMenuRequest) {
    const response = await encryptedPut<Menu, UpdateMenuRequest>(
      API_ENDPOINTS.MENUS.UPDATE(id),
      menu
    );

    if (response.success && isRecord(response.data)) {
      return { ...response, data: normalizeMenu(response.data) };
    }

    return response;
  },

  async deleteMenu(id: number) {
    return encryptedDelete<void>(API_ENDPOINTS.MENUS.DELETE(id));
  },

  async approveMenuRequest(requestId: number, comment: string) {
    const response = await encryptedPost<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.MENUS.APPROVAL_APPROVE(requestId),
      { comment: comment.trim() }
    );
    return { success: response.success, error: response.error };
  },

  async rejectMenuRequest(requestId: number, reason: string) {
    const response = await encryptedPost<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.MENUS.APPROVAL_REJECT(requestId),
      { reason: reason.trim() }
    );
    return { success: response.success, error: response.error };
  },

  async toggleMenuStatus(id: number, active: boolean) {
    const response = await encryptedPatch<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.MENUS.STATUS(id),
      { status: active ? 'active' : 'inactive' }
    );
    return { success: response.success, error: response.error };
  },

  async exportMenus(params?: Pick<MenuListParams, 'sortBy' | 'sortOrder' | 'search' | 'isActive'>) {
    const encryptedQuery = buildMenuExportEncryptedQueryClient({
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      search: params?.search,
      isActive: params?.isActive,
    });

    return downloadEntityExport(
      `${API_ENDPOINTS.MENUS.EXPORT}${encryptedQuery}`,
      'menus-export.xlsx',
      {
        accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    );
  },
};

export { normalizeMenu } from '@/lib/menus/normalizeMenu';

export function withListPermissions<T extends Record<string, unknown>>(
  payload: T,
  permissions?: PagePermissions
): T & { permissions?: PagePermissions } {
  return permissions ? { ...payload, permissions } : payload;
}
