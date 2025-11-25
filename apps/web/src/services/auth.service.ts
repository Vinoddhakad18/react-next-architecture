/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { tokenManager } from '@/lib/auth/TokenManager';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@/types/api';

export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest) {
    const response = await apiClient.post<{ success: boolean; message: string; data: LoginResponse }, LoginRequest>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );

    if (response.success && response.data?.data?.accessToken) {
      tokenManager.setToken(response.data.data.accessToken);
      if (response.data.data.refreshToken) {
        tokenManager.setRefreshToken(response.data.data.refreshToken);
      }
    }

    return response;
  },

  /**
   * Register a new user
   */
  async register(data: RegisterRequest) {
    return apiClient.post<LoginResponse, RegisterRequest>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    );
  },

  /**
   * Logout the current user
   */
  async logout() {
    const response = await apiClient.post<void, Record<string, never>>(
      API_ENDPOINTS.AUTH.LOGOUT,
      {},
      { auth: true }
    );

    tokenManager.clearTokens();
    return response;
  },

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    return apiClient.get<User>(API_ENDPOINTS.AUTH.ME, { auth: true });
  },

  /**
   * Refresh access token
   */
  async refreshToken() {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      return { data: null, error: { message: 'No refresh token', status: 401 }, success: false };
    }

    const response = await apiClient.post<{ success: boolean; message: string; data: RefreshTokenResponse }, RefreshTokenRequest>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );

    if (response.success && response.data?.data?.accessToken) {
      tokenManager.setToken(response.data.data.accessToken);
      if (response.data.data.refreshToken) {
        tokenManager.setRefreshToken(response.data.data.refreshToken);
      }
    }

    return response;
  },

  // Delegate token management to TokenManager
  setToken: tokenManager.setToken.bind(tokenManager),
  getToken: tokenManager.getToken.bind(tokenManager),
  setRefreshToken: tokenManager.setRefreshToken.bind(tokenManager),
  getRefreshToken: tokenManager.getRefreshToken.bind(tokenManager),
  clearTokens: tokenManager.clearTokens.bind(tokenManager),
  isAuthenticated: tokenManager.isAuthenticated.bind(tokenManager),
};
