import { apiClient } from '@/lib/api';
import type {
  Customer,
  CustomerListParams,
  CustomersListResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '@/types/api/customer';

const API_ENDPOINTS = {
  LIST: '/api/v1/customers',
  GET: (id: string | number) => `/api/v1/customers/${id}`,
  CREATE: '/api/v1/customers',
  UPDATE: (id: string | number) => `/api/v1/customers/${id}`,
  DELETE: (id: string | number) => `/api/v1/customers/${id}`,
} as const;

export const customerService = {
  async getCustomers(params?: CustomerListParams) {
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
    return apiClient.get<CustomersListResponse>(endpoint, { auth: true });
  },

  async createCustomer(data: CreateCustomerRequest) {
    return apiClient.post<Customer, CreateCustomerRequest>(
      API_ENDPOINTS.CREATE,
      data,
      { auth: true }
    );
  },

  async updateCustomer(id: string | number, data: UpdateCustomerRequest) {
    return apiClient.put<Customer, UpdateCustomerRequest>(
      API_ENDPOINTS.UPDATE(id),
      data,
      { auth: true }
    );
  },

  async deleteCustomer(id: string | number) {
    return apiClient.delete<{ success: boolean; message?: string }>(
      API_ENDPOINTS.DELETE(id),
      { auth: true }
    );
  },
};
