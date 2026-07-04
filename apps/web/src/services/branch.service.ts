/**
 * Branch Service
 * Handles branch-related API calls
 */

import { apiClient, API_ENDPOINTS, buildListQueryString } from '@/lib/api';
import { postApprovalApprove, postApprovalReject } from '@/lib/api/approvalRequests';
import { toggleEntityStatus, downloadEntityExport } from '@/lib/api/entityActions';
import { resolveApprovalStatus } from '@/lib/approval';
import { normalizeApprovalObject, resolveEntityApprovalStatus } from '@/lib/approval/entityApproval';
import { pickField, toBooleanFlag } from '@/lib/api/fieldAccess';
import type { ApiResponse, PagePermissions } from '@/types/api';
import type { Branch, BranchListParams, BranchListResponse, BranchTreeNode, CreateBranchRequest, UpdateBranchRequest } from '@/types/api/branch';
import { extractBranchTreePayload } from '@/lib/utils/normalizeBranchTree';

export const branchService = {
  async getBranches(params?: BranchListParams) {
    const endpoint = `${API_ENDPOINTS.BRANCHES.LIST}${buildListQueryString(params)}`;
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

    const perPage =
      (pagination.per_page ?? pagination.limit ?? params?.limit) || 10;

    return {
      success: true,
      error: null,
      data: {
        data: normalizedBranches,
        meta: {
          total: pagination.total ?? pagination.total_records ?? normalizedBranches.length,
          page: pagination.page || params?.page || 1,
          limit: perPage,
          totalPages:
            (pagination.total_pages ?? pagination.totalPages) ||
            Math.ceil(normalizedBranches.length / perPage),
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
    const response = await apiClient.get<unknown>(endpoint, { auth: true });

    if (!response.success || response.data == null) {
      return response as ApiResponse<BranchTreeNode[]>;
    }

    return {
      success: true,
      error: null,
      data: extractBranchTreePayload(response.data),
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

  async softDeleteBranch(id: number) {
    return apiClient.delete<{ success: boolean; message?: string }>(
      API_ENDPOINTS.BRANCHES.SOFT_DELETE(id),
      { auth: true }
    );
  },

  async deleteBranch(id: number) {
    return this.softDeleteBranch(id);
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

  async exportBranches(params?: Pick<BranchListParams, 'sortBy' | 'sortOrder' | 'search'>) {
    const queryParams: Record<string, string> = {
      sort_by: params?.sortBy ?? 'branch_name',
      sort_order: params?.sortOrder ?? 'ASC',
    };

    if (params?.search) {
      queryParams.search = params.search;
    }

    return downloadEntityExport(API_ENDPOINTS.BRANCHES.EXPORT, 'branches-export.xlsx', {
      queryParams,
      accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },
};

export function normalizeBranch(branch: Record<string, unknown>): Branch {
  const approval = normalizeApprovalObject(branch.approval);
  return {
    id: Number(branch.id),
    branchName: String(branch.branch_name ?? branch.branchName ?? branch.name ?? ''),
    branchCode: String(branch.branch_code ?? branch.branchCode ?? branch.code ?? ''),
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
