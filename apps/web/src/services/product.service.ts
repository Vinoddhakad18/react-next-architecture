import { apiClient } from '@/lib/api';
import type {
  Product,
  ProductListParams,
  ProductsListResponse,
  CreateProductRequest,
  UpdateProductRequest,
} from '@/types/api/product';

const API_ENDPOINTS = {
  LIST: '/api/v1/products',
  GET: (id: string | number) => `/api/v1/products/${id}`,
  CREATE: '/api/v1/products',
  UPDATE: (id: string | number) => `/api/v1/products/${id}`,
  DELETE: (id: string | number) => `/api/v1/products/${id}`,
} as const;

export const productService = {
  async getProducts(params?: ProductListParams) {
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
    return apiClient.get<ProductsListResponse>(endpoint, { auth: true });
  },

  async createProduct(data: CreateProductRequest) {
    return apiClient.post<Product, CreateProductRequest>(
      API_ENDPOINTS.CREATE,
      data,
      { auth: true }
    );
  },

  async updateProduct(id: string | number, data: UpdateProductRequest) {
    return apiClient.put<Product, UpdateProductRequest>(
      API_ENDPOINTS.UPDATE(id),
      data,
      { auth: true }
    );
  },

  async deleteProduct(id: string | number) {
    return apiClient.delete<{ success: boolean; message?: string }>(
      API_ENDPOINTS.DELETE(id),
      { auth: true }
    );
  },
};
