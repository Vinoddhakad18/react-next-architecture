/**
 * API Mocks
 * Mock data and responses for testing
 */

import type { User, LoginResponse, ApiResponse } from '@/types/api';

export const mockUser: User = {
  id: '1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockLoginResponse: ApiResponse<LoginResponse> = {
  success: true,
  data: {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: mockUser,
  },
  error: null,
};

export const mockApiError: ApiResponse<never> = {
  success: false,
  data: null as never,
  error: {
    message: 'An error occurred',
    status: 400,
  },
};



