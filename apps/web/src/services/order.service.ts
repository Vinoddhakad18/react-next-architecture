import { apiClient } from '@/lib/api';
import type {
  Order,
  OrderListParams,
  OrdersListResponse,
  CreateOrderRequest,
  UpdateOrderRequest,
} from '@/types/api/order';

const API_ENDPOINTS = {
  LIST: '/api/v1/orders',
  GET: (id: string | number) => `/api/v1/orders/${id}`,
  CREATE: '/api/v1/orders',
  UPDATE: (id: string | number) => `/api/v1/orders/${id}`,
  DELETE: (id: string | number) => `/api/v1/orders/${id}`,
} as const;

export const orderService = {
  async getOrders(params?: OrderListParams) {
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
    return apiClient.get<OrdersListResponse>(endpoint, { auth: true });
  },

  async createOrder(data: CreateOrderRequest) {
    return apiClient.post<Order, CreateOrderRequest>(
      API_ENDPOINTS.CREATE,
      data,
      { auth: true }
    );
  },

  async updateOrder(id: string | number, data: UpdateOrderRequest) {
    return apiClient.put<Order, UpdateOrderRequest>(
      API_ENDPOINTS.UPDATE(id),
      data,
      { auth: true }
    );
  },

  async deleteOrder(id: string | number) {
    return apiClient.delete<{ success: boolean; message?: string }>(
      API_ENDPOINTS.DELETE(id),
      { auth: true }
    );
  },
};
