/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@/types/api';

const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

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
      this.setToken(response.data.data.accessToken);
      if (response.data.data.refreshToken) {
        this.setRefreshToken(response.data.data.refreshToken);
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

    this.clearTokens();
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
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return { data: null, error: { message: 'No refresh token', status: 401 }, success: false };
    }

    const response = await apiClient.post<{ success: boolean; message: string; data: RefreshTokenResponse }, RefreshTokenRequest>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );

    if (response.success && response.data?.data?.accessToken) {
      this.setToken(response.data.data.accessToken);
      if (response.data.data.refreshToken) {
        this.setRefreshToken(response.data.data.refreshToken);
      }
    }

    return response;
  },

  // Token management
  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setRefreshToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
