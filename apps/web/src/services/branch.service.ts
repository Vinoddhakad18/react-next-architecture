/**
 * Branch Service
 * Handles branch-related API calls
 */

import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type { Branch, BranchListParams, BranchListResponse, CreateBranchRequest, UpdateBranchRequest } from '@/types/api/branch';

export const branchService = {
  async getBranches(params?: BranchListParams) {
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

    const endpoint = `${API_ENDPOINTS.BRANCHES.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<{ success: boolean; message: string; data: { data: any[]; pagination?: any; meta?: any } }>(endpoint, { auth: true });

    if (!response.success || !response.data) {
      return response as unknown as ApiResponse<BranchListResponse>;
    }

    const payload = response.data;
    const branchItems = Array.isArray(payload.data?.data) ? payload.data.data : [];
    const normalizedBranches = branchItems.map((branch: any) => ({
      id: branch.id,
      branchName: branch.branch_name ?? branch.branchName ?? '',
      branchCode: branch.branch_code ?? branch.branchCode ?? '',
      address: branch.address ?? '',
      status: branch.status ?? '',
    }));

    const pagination = payload.data?.pagination || payload.data?.meta || {
      total: normalizedBranches.length,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: Math.ceil(normalizedBranches.length / (params?.limit || 10)),
    };

    return {
      success: true,
      error: null,
      data: {
        data: normalizedBranches,
        meta: {
          total: pagination.total ?? normalizedBranches.length,
          page: pagination.page || params?.page || 1,
          limit: pagination.limit || params?.limit || 10,
          totalPages: pagination.totalPages || pagination.total_pages || Math.ceil(normalizedBranches.length / (pagination.limit || params?.limit || 10)),
        },
      },
    };
  },

  async createBranch(branch: CreateBranchRequest) {
    return apiClient.post<Branch, CreateBranchRequest>(
      API_ENDPOINTS.BRANCHES.CREATE,
      branch,
      { auth: true }
    );
  },

  async updateBranch(id: number, branch: UpdateBranchRequest) {
    return apiClient.put<Branch, UpdateBranchRequest>(
      API_ENDPOINTS.BRANCHES.UPDATE(id),
      branch,
      { auth: true }
    );
  },

  async deleteBranch(id: number) {
    return apiClient.delete<Branch>(
      API_ENDPOINTS.BRANCHES.DELETE(id),
      { auth: true }
    );
  },
};
