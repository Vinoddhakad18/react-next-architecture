/**
 * Common API Types
 */

/** Maker-checker workflow states returned by the backend. */
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected';

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






