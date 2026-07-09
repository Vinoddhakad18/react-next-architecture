/**
 * Category Service
 * Handles category-related API calls with encrypted request/response.
 */

import { API_ENDPOINTS } from '@/lib/api';
import {
  buildCategoryExportEncryptedQueryClient,
  buildCategoryListQueryPayload,
} from '@/lib/api/categoryEncryptedQuery';
import {
  encryptedDelete,
  encryptedGet,
  encryptedPatch,
  encryptedPost,
  encryptedPut,
} from '@/lib/api/encryptedClientApi';
import { downloadEntityExport } from '@/lib/api/entityActions';
import { extractPagePermissions } from '@/lib/api/permissions';
import { normalizeCategory, normalizeCategoryRecord } from '@/lib/categories/normalizeCategory';
import type { ApiResponse, PagePermissions } from '@/types/api';
import type {
  Category,
  CategoryListParams,
  CategoryListResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/types/api/category';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractCategoryListItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  const container = isRecord(payload.data) ? payload.data : payload;
  const direct = isRecord(container)
    ? (container.data ?? container.categories ?? container.items)
    : container;

  if (Array.isArray(direct)) {
    return direct;
  }

  if (isRecord(direct)) {
    const nested = direct.data ?? direct.categories ?? direct.items;
    if (Array.isArray(nested)) {
      return nested;
    }
  }

  return [];
}

export function normalizeCategoryListPayload(
  payload: unknown,
  page = 1,
  limit = 10
): CategoryListResponse & { permissions?: PagePermissions } {
  const categoryItems = extractCategoryListItems(payload);

  const normalizedCategories = categoryItems.map((category) =>
    normalizeCategory(category as Record<string, unknown>)
  );

  let paginationSource: Record<string, unknown> | null = null;
  if (isRecord(payload)) {
    const container = isRecord(payload.data) && !Array.isArray(payload.data) ? payload.data : payload;
    if (isRecord(container)) {
      paginationSource = (isRecord(container.pagination)
        ? container.pagination
        : isRecord(container.meta)
          ? container.meta
          : null) as Record<string, unknown> | null;
    }
  }

  const pagination = paginationSource ?? {
    total: normalizedCategories.length,
    page,
    limit,
    totalPages: 1,
  };

  const permissions = isRecord(payload) ? extractPagePermissions(payload) : undefined;

  return withListPermissions(
    {
      data: normalizedCategories,
      meta: {
        total: Number(
          pagination.total_records ?? pagination.total ?? normalizedCategories.length
        ),
        page: Number(pagination.page ?? page),
        limit: Number(pagination.per_page ?? pagination.limit ?? limit),
        totalPages: Number(pagination.total_pages ?? pagination.totalPages ?? 1),
      },
    },
    permissions
  );
}

export const categoryService = {
  async getCategories(params?: CategoryListParams) {
    const response = await encryptedGet<CategoryListResponse & { permissions?: PagePermissions }>(
      API_ENDPOINTS.CATEGORIES.LIST,
      { queryParams: buildCategoryListQueryPayload(params) || undefined }
    );

    if (response.success && response.data) {
      return {
        ...response,
        data: normalizeCategoryListPayload(
          response.data,
          params?.page ?? 1,
          params?.limit ?? 10
        ),
      };
    }

    return response;
  },

  async getActiveCategories() {
    const response = await encryptedGet<{ data: Category[] } | Category[]>(
      API_ENDPOINTS.CATEGORIES.ACTIVE_LIST,
      { queryParams: {} }
    );

    if (!response.success || !response.data) {
      return response;
    }

    const payload = response.data;
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { data?: Category[] }).data)
        ? (payload as { data: Category[] }).data
        : [];

    return {
      ...response,
      data: items.map((category) =>
        normalizeCategory(category as unknown as Record<string, unknown>)
      ),
    };
  },

  async createCategory(category: CreateCategoryRequest & { status?: boolean }) {
    const response = await encryptedPost<Category, Record<string, unknown>>(
      API_ENDPOINTS.CATEGORIES.CREATE,
      {
        name: category.name,
        code: category.code,
        ...(category.description !== undefined ? { description: category.description } : {}),
        parent_id: category.parent_id,
        ...(category.status !== undefined ? { is_active: category.status } : {}),
      }
    );

    if (response.success && isRecord(response.data)) {
      return { ...response, data: normalizeCategoryRecord(response.data) as unknown as Category };
    }

    return response;
  },

  async getCategory(id: number) {
    const response = await encryptedGet<Category>(API_ENDPOINTS.CATEGORIES.GET(id));

    if (response.success && isRecord(response.data)) {
      return { ...response, data: normalizeCategoryRecord(response.data) as unknown as Category };
    }

    return response;
  },

  async updateCategory(id: number, category: UpdateCategoryRequest) {
    const response = await encryptedPut<Category, Record<string, unknown>>(
      API_ENDPOINTS.CATEGORIES.UPDATE(id),
      {
        ...(category.name !== undefined ? { name: category.name } : {}),
        ...(category.code !== undefined ? { code: category.code } : {}),
        ...(category.description !== undefined ? { description: category.description } : {}),
        ...(category.parent_id !== undefined ? { parent_id: category.parent_id } : {}),
        ...(category.status !== undefined ? { is_active: category.status } : {}),
      }
    );

    if (response.success && isRecord(response.data)) {
      return { ...response, data: normalizeCategoryRecord(response.data) as unknown as Category };
    }

    return response;
  },

  async deleteCategory(id: number) {
    return encryptedDelete<void>(API_ENDPOINTS.CATEGORIES.DELETE(id));
  },

  async approveCategoryRequest(requestId: number, comment: string) {
    const response = await encryptedPost<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.CATEGORIES.APPROVAL_APPROVE(requestId),
      { comment: comment.trim() }
    );
    return { success: response.success, error: response.error };
  },

  async rejectCategoryRequest(requestId: number, reason: string) {
    const response = await encryptedPost<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.CATEGORIES.APPROVAL_REJECT(requestId),
      { reason: reason.trim() }
    );
    return { success: response.success, error: response.error };
  },

  async toggleCategoryStatus(id: number, active: boolean) {
    const response = await encryptedPatch<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.CATEGORIES.STATUS(id),
      { status: active ? 'active' : 'inactive' }
    );
    return { success: response.success, error: response.error };
  },

  async exportCategories(params?: Pick<CategoryListParams, 'sortBy' | 'sortOrder' | 'search' | 'isActive'>) {
    const encryptedQuery = buildCategoryExportEncryptedQueryClient({
      sortBy: params?.sortBy ?? 'name',
      sortOrder: params?.sortOrder,
      search: params?.search,
      isActive: params?.isActive,
    });

    return downloadEntityExport(
      `${API_ENDPOINTS.CATEGORIES.EXPORT}${encryptedQuery}`,
      'categories-export.xlsx',
      {
        accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    );
  },
};

export { normalizeCategory } from '@/lib/categories/normalizeCategory';

export function withListPermissions<T extends Record<string, unknown>>(
  payload: T,
  permissions?: PagePermissions
): T & { permissions?: PagePermissions } {
  return permissions ? { ...payload, permissions } : payload;
}
