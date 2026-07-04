/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { tokenManager } from '@/lib/auth/TokenManager';
import { extractAuthTokensFromApiResponse } from '@/lib/auth/normalizeAuthTokens';
import type {
  LoginRequest,
  RegisterRequest,
  User,
} from '@/types/api';

function storeTokensFromResponse(responseData: unknown): boolean {
  const tokens = extractAuthTokensFromApiResponse(responseData);
  if (!tokens?.accessToken) {
    return false;
  }

  tokenManager.setToken(tokens.accessToken);
  if (tokens.refreshToken) {
    tokenManager.setRefreshToken(tokens.refreshToken);
  }
  return true;
}

export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest) {
    const response = await apiClient.post<
      { success: boolean; message: string; data: unknown },
      LoginRequest
    >(API_ENDPOINTS.AUTH.LOGIN, credentials);

    if (response.success) {
      const stored = storeTokensFromResponse(response.data);
      if (!stored) {
        return {
          success: false as const,
          data: response.data,
          error: {
            message: 'Login response did not include an access token',
            status: 502,
          },
        };
      }
    }

    return response;
  },

  /**
   * Register a new user
   */
  async register(data: RegisterRequest) {
    return apiClient.post<unknown, RegisterRequest>(
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

    const response = await apiClient.post<
      { success: boolean; message: string; data: unknown },
      { refresh_token: string }
    >(API_ENDPOINTS.AUTH.REFRESH, { refresh_token: refreshToken });

    if (response.success) {
      storeTokensFromResponse(response.data);
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
