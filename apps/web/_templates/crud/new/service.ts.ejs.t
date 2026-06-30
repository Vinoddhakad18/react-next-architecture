---
to: src/services/<%= singular %>.service.ts
---
import { apiClient } from '@/lib/api';
import type {
  <%= entityPascal %>,
  <%= entityPascal %>ListParams,
  <%= pluralPascal %>ListResponse,
  Create<%= entityPascal %>Request,
  Update<%= entityPascal %>Request,
} from '@/types/api/<%= singular %>';

const API_ENDPOINTS = {
  LIST: '/api/v1/<%= plural %>',
  GET: (id: string | number) => `/api/v1/<%= plural %>/${id}`,
  CREATE: '/api/v1/<%= plural %>',
  UPDATE: (id: string | number) => `/api/v1/<%= plural %>/${id}`,
  DELETE: (id: string | number) => `/api/v1/<%= plural %>/${id}`,
} as const;

export const <%= entityCamel %>Service = {
  async get<%= pluralPascal %>(params?: <%= entityPascal %>ListParams) {
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

    const endpoint = `${API_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<<%= pluralPascal %>ListResponse>(endpoint, { auth: true });
  },

  async create<%= entityPascal %>(data: Create<%= entityPascal %>Request) {
    return apiClient.post<<%= entityPascal %>, Create<%= entityPascal %>Request>(
      API_ENDPOINTS.CREATE,
      data,
      { auth: true }
    );
  },

  async update<%= entityPascal %>(id: string | number, data: Update<%= entityPascal %>Request) {
    return apiClient.put<<%= entityPascal %>, Update<%= entityPascal %>Request>(
      API_ENDPOINTS.UPDATE(id),
      data,
      { auth: true }
    );
  },

  async delete<%= entityPascal %>(id: string | number) {
    return apiClient.delete<{ success: boolean; message?: string }>(
      API_ENDPOINTS.DELETE(id),
      { auth: true }
    );
  },
};
