/**
 * Menu API Types
 */

export interface Menu {
  id: number;
  name: string;
  slug?: string; // Optional, can be derived from route
  route?: string; // Route path from API
  description?: string;
  sortOrder: number;
  isActive: boolean;
  parentId?: number | null;
  createdAt: string;
  updatedAt: string;
  children?: Menu[];
}

export interface MenuListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  isActive?: boolean;
}

export interface MenuListResponse {
  data: Menu[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

