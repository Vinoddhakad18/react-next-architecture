/**
 * Role API Types
 */

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  isActive?: boolean;
}

export interface RoleListResponse {
  data: Role[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}






