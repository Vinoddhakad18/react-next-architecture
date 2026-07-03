/**
 * Branch Service
 * Handles branch-related API calls
 */

import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { postApprovalApprove, postApprovalReject } from '@/lib/api/approvalRequests';
import { toggleEntityStatus, downloadEntityExport } from '@/lib/api/entityActions';
import { resolveApprovalStatus } from '@/lib/approval';
import { normalizeApprovalObject, resolveEntityApprovalStatus } from '@/lib/approval/entityApproval';
import { pickField, toBooleanFlag } from '@/lib/api/fieldAccess';
import type { ApiResponse, PagePermissions } from '@/types/api';
import type { Branch, BranchListParams, BranchListResponse, BranchTreeNode, CreateBranchRequest, UpdateBranchRequest } from '@/types/api/branch';

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
    const response = await apiClient.get<{ success: boolean; message: string; data: { data: any[]; pagination?: any; meta?: any }; permissions?: PagePermissions }>(endpoint, { auth: true });

    if (!response.success || !response.data) {
      return response as unknown as ApiResponse<BranchListResponse>;
    }

    const payload = response.data;
    const branchItems = Array.isArray(payload.data?.data) ? payload.data.data : [];
    const normalizedBranches = branchItems.map((branch: Record<string, unknown>) => normalizeBranch(branch));

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
        // Preserve the per-action permissions the backend returns so the page's
        // usePagePermissions/extractPagePermissions can read them. Without this,
        // normalization would strip them and all branch actions stay hidden.
        permissions: response.data.permissions,
      },
    };
  },

  async getBranchTree(activeOnly = true) {
    const queryParams = new URLSearchParams();
    if (activeOnly) {
      queryParams.append('active_only', 'true');
    }

    const endpoint = `${API_ENDPOINTS.BRANCHES.TREE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<{ success: boolean; message: string; data: BranchTreeNode[] }>(endpoint, { auth: true });
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

  async approveBranchRequest(requestId: number, comment: string) {
    return postApprovalApprove(API_ENDPOINTS.BRANCHES.APPROVAL_APPROVE(requestId), comment);
  },

  async rejectBranchRequest(requestId: number, reason: string) {
    return postApprovalReject(API_ENDPOINTS.BRANCHES.APPROVAL_REJECT(requestId), reason);
  },

  async toggleBranchStatus(id: number, active: boolean) {
    return toggleEntityStatus(API_ENDPOINTS.BRANCHES.STATUS(id), active);
  },

  async exportBranches() {
    return downloadEntityExport(API_ENDPOINTS.BRANCHES.EXPORT, 'branches-export.csv');
  },
};

export function normalizeBranch(branch: Record<string, unknown>): Branch {
  const approval = normalizeApprovalObject(branch.approval);
  return {
    id: Number(branch.id),
    branchName: String(branch.branch_name ?? branch.branchName ?? ''),
    branchCode: String(branch.branch_code ?? branch.branchCode ?? ''),
    address: String(branch.address ?? ''),
    status: String(branch.status ?? ''),
    approval,
    isPendingCreate:
      toBooleanFlag(pickField(branch, 'isPendingCreate', 'is_pending_create')),
    approvalStatus: approval
      ? resolveEntityApprovalStatus(approval)
      : resolveApprovalStatus(
          branch.approval_status ?? branch.approvalStatus,
          branch.status
        ),
  };
}

export function withListPermissions<T extends Record<string, unknown>>(
  payload: T,
  permissions?: PagePermissions
): T & { permissions?: PagePermissions } {
  return permissions ? { ...payload, permissions } : payload;
}
