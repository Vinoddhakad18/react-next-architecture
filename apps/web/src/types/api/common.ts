/**
 * Common API Types
 */

// Generic API Response wrapper
export interface ApiResponse<T> {
  data: T;
  error: ApiError | null;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}



