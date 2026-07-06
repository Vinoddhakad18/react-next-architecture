/**
 * Category API Types
 */

import type { ApprovalStatus } from './common';
import type { EntityApprovalInfo } from './approval';

export interface Category {
  id: number;
  name: string;
  code: string;
  description?: string;
  parentId: number | null;
  parentName?: string;
  isActive: boolean;
  approvalStatus?: ApprovalStatus;
  approval?: EntityApprovalInfo;
  isPendingCreate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  isActive?: boolean;
}

export interface CategoryListResponse {
  data: Category[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateCategoryRequest {
  name: string;
  code: string;
  description?: string;
  parent_id: number | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  code?: string;
  description?: string;
  parent_id?: number | null;
  status?: boolean;
}
