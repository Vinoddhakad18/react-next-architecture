export interface Order {
  id: string;
  name: string;
  price: number;
  sku: string;
  status: string;
  
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export interface OrdersListResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateOrderRequest {
  name: string;
  price: number;
  sku: string;
  status: string;
  
}

export interface UpdateOrderRequest {
  name?: string;
  price?: number;
  sku?: string;
  status?: string;
  
}
