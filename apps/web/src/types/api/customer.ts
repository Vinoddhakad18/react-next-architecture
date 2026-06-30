export interface Customer {
  id: string;
  name: string;
  price: number;
  status: string;
  
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export interface CustomersListResponse {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateCustomerRequest {
  name: string;
  price: number;
  status: string;
  
}

export interface UpdateCustomerRequest {
  name?: string;
  price?: number;
  status?: string;
  
}
