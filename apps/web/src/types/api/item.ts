export interface Item {
  id: string;
  name: string;
  price: number;
  status: string;
  
}

export interface ItemListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export interface ItemsListResponse {
  data: Item[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateItemRequest {
  name: string;
  price: number;
  status: string;
  
}

export interface UpdateItemRequest {
  name?: string;
  price?: number;
  status?: string;
  
}
