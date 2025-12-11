/**
 * Menu Service
 * Handles all menu-related API calls
 */

import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type { Menu, MenuListParams, MenuListResponse, ApiResponse } from '@/types/api';

export type { UpdateMenuRequest };

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
};

