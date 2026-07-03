/**
 * Branch API Types
 */

import type { ApprovalStatus } from './common';

export interface Branch {
  id: number;
  branchName: string;
  branchCode: string;
  address: string;
  status: string;
  approvalStatus?: ApprovalStatus;
}

export interface BranchTreeNode {
  id: number;
  branchName: string;
  branchCode: string;
  address: string;
  parentId: number | null;
  status: string;
  children: BranchTreeNode[];
}

export interface BranchListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export interface BranchListResponse {
  data: Branch[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateBranchRequest {
  branch_name: string;
  branch_code: string;
  address: string;
  status: string;
}

export interface UpdateBranchRequest {
  branch_name?: string;
  branch_code?: string;
  address?: string;
  status?: string;
}

export interface CreateBranchRequest {
  branch_name: string;
  branch_code: string;
  address: string;
  status: string;
}
