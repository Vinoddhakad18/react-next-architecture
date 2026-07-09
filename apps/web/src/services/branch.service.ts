/**
 * Branch Service
 * Handles branch-related API calls with encrypted request/response.
 */

import { API_ENDPOINTS } from '@/lib/api';
import {
  buildBranchExportEncryptedQueryClient,
  buildBranchListQueryPayload,
} from '@/lib/api/branchEncryptedQuery';
import {
  encryptedDelete,
  encryptedGet,
  encryptedPatch,
  encryptedPost,
  encryptedPut,
} from '@/lib/api/encryptedClientApi';
import { downloadEntityExport } from '@/lib/api/entityActions';
import { normalizeBranch } from '@/lib/branches/normalizeBranch';
import { extractPagePermissions } from '@/lib/api/permissions';
import type { ApiResponse, PagePermissions } from '@/types/api';
import type { Branch, BranchListParams, BranchListResponse, BranchTreeNode, CreateBranchRequest, UpdateBranchRequest } from '@/types/api/branch';
import { extractBranchTreePayload } from '@/lib/utils/normalizeBranchTree';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeBranchListPayload(
  payload: unknown,
  page = 1,
  limit = 10
): BranchListResponse & { permissions?: PagePermissions } {
  let backendData: unknown = payload;

  if (isRecord(payload) && isRecord(payload.data)) {
    backendData = payload.data;
  }

  const branchItems = isRecord(backendData)
    ? (backendData.data ?? backendData.branches ?? [])
    : backendData;

  const normalizedBranches = (Array.isArray(branchItems) ? branchItems : []).map((branch) =>
    normalizeBranch(branch as Record<string, unknown>)
  );

  const paginationSource = isRecord(backendData) ? backendData.pagination ?? backendData.meta : null;
  const pagination = isRecord(paginationSource)
    ? paginationSource
    : {
        total: normalizedBranches.length,
        page,
        limit,
        totalPages: 1,
      };

  const permissions = isRecord(payload) ? extractPagePermissions(payload) : undefined;

  return withListPermissions(
    {
      data: normalizedBranches,
      meta: {
        total: Number(
          pagination.total_records ?? pagination.total ?? normalizedBranches.length
        ),
        page: Number(pagination.page ?? page),
        limit: Number(pagination.per_page ?? pagination.limit ?? limit),
        totalPages: Number(pagination.total_pages ?? pagination.totalPages ?? 1),
      },
    },
    permissions
  );
}

export const branchService = {
  async getBranches(params?: BranchListParams) {
    const response = await encryptedGet<BranchListResponse & { permissions?: PagePermissions }>(
      API_ENDPOINTS.BRANCHES.LIST,
      { queryParams: buildBranchListQueryPayload(params) || undefined }
    );

    if (response.success && response.data) {
      return {
        ...response,
        data: normalizeBranchListPayload(
          response.data,
          params?.page ?? 1,
          params?.limit ?? 10
        ),
      };
    }

    return response;
  },

  async getBranchTree(activeOnly = true) {
    const response = await encryptedGet<unknown>(API_ENDPOINTS.BRANCHES.TREE, {
      queryParams: activeOnly ? 'active_only=true' : undefined,
    });

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
    const response = await encryptedPost<Branch, CreateBranchRequest>(
      API_ENDPOINTS.BRANCHES.CREATE,
      branch
    );

    if (response.success && isRecord(response.data)) {
      return { ...response, data: normalizeBranch(response.data) };
    }

    return response;
  },

  async updateBranch(id: number, branch: UpdateBranchRequest) {
    const response = await encryptedPut<Branch, UpdateBranchRequest>(
      API_ENDPOINTS.BRANCHES.UPDATE(id),
      branch
    );

    if (response.success && isRecord(response.data)) {
      return { ...response, data: normalizeBranch(response.data) };
    }

    return response;
  },

  async softDeleteBranch(id: number) {
    return encryptedDelete<{ success: boolean; message?: string }>(
      API_ENDPOINTS.BRANCHES.SOFT_DELETE(id)
    );
  },

  async deleteBranch(id: number) {
    return this.softDeleteBranch(id);
  },

  async approveBranchRequest(requestId: number, comment: string) {
    const response = await encryptedPost<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.BRANCHES.APPROVAL_APPROVE(requestId),
      { comment: comment.trim() }
    );
    return { success: response.success, error: response.error };
  },

  async rejectBranchRequest(requestId: number, reason: string) {
    const response = await encryptedPost<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.BRANCHES.APPROVAL_REJECT(requestId),
      { reason: reason.trim() }
    );
    return { success: response.success, error: response.error };
  },

  async toggleBranchStatus(id: number, active: boolean) {
    const response = await encryptedPatch<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.BRANCHES.STATUS(id),
      { status: active ? 'active' : 'inactive' }
    );
    return { success: response.success, error: response.error };
  },

  async exportBranches(params?: Pick<BranchListParams, 'sortBy' | 'sortOrder' | 'search'>) {
    const encryptedQuery = buildBranchExportEncryptedQueryClient({
      sortBy: params?.sortBy ?? 'branch_name',
      sortOrder: params?.sortOrder,
      search: params?.search,
    });

    return downloadEntityExport(
      `${API_ENDPOINTS.BRANCHES.EXPORT}${encryptedQuery}`,
      'branches-export.xlsx',
      {
        accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    );
  },
};

export { normalizeBranch } from '@/lib/branches/normalizeBranch';

export function withListPermissions<T extends Record<string, unknown>>(
  payload: T,
  permissions?: PagePermissions
): T & { permissions?: PagePermissions } {
  return permissions ? { ...payload, permissions } : payload;
}
