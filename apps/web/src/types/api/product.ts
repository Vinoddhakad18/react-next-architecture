export interface Product {
  id: string;
  name: string;
  price: number;
  status: string;
  
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export interface ProductsListResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateProductRequest {
  name: string;
  price: number;
  status: string;
  
}

export interface UpdateProductRequest {
  name?: string;
  price?: number;
  status?: string;
  
}
