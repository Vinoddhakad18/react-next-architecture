/**
 * API Client
 * A type-safe fetch wrapper with error handling and automatic token refresh
 */

import { apiConfig, getAuthHeader } from './config';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse, ApiError, RefreshTokenResponse } from '@/types/api';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions<TBody = unknown> {
  method?: RequestMethod;
  body?: TBody;
  headers?: Record<string, string>;
  auth?: boolean;
  timeout?: number;
  _skipRefresh?: boolean;
}

const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  private setRefreshToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  }

  private clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  private isAuthEndpoint(endpoint: string): boolean {
    return (
      endpoint === API_ENDPOINTS.AUTH.LOGIN ||
      endpoint === API_ENDPOINTS.AUTH.REFRESH ||
      endpoint === API_ENDPOINTS.AUTH.REGISTER
    );
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearTokens();
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: {
          ...apiConfig.headers,
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json() as { success: boolean; data: RefreshTokenResponse };

      if (data.success && data.data?.accessToken) {
        this.setToken(data.data.accessToken);
        if (data.data.refreshToken) {
          this.setRefreshToken(data.data.refreshToken);
        }
        return true;
      }

      this.clearTokens();
      return false;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  private async request<TResponse, TBody = unknown>(
    endpoint: string,
    options: RequestOptions<TBody> = {}
  ): Promise<ApiResponse<TResponse>> {
    const {
      method = 'GET',
      body,
      headers = {},
      auth = false,
      timeout = apiConfig.timeout,
      _skipRefresh = false,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...apiConfig.headers,
          ...headers,
          ...(auth ? getAuthHeader() : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        if (
          response.status === 401 &&
          auth &&
          !_skipRefresh &&
          !this.isAuthEndpoint(endpoint)
        ) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            return this.request<TResponse, TBody>(endpoint, {
              ...options,
              _skipRefresh: true,
            });
          }
        }

        const error: ApiError = {
          message: data.message || 'An error occurred',
          status: response.status,
          errors: data.errors,
        };
        return { data: null as unknown as TResponse, error, success: false };
      }

      return { data, error: null, success: true };
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.name === 'AbortError') {
        return {
          data: null as unknown as TResponse,
          error: { message: 'Request timeout', status: 408 },
          success: false,
        };
      }

      return {
        data: null as unknown as TResponse,
        error: {
          message: err instanceof Error ? err.message : 'Network error',
          status: 0,
        },
        success: false,
      };
    }
  }

  async get<TResponse>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<TResponse>(endpoint, { ...options, method: 'GET' });
  }

  async post<TResponse, TBody = unknown>(
    endpoint: string,
    body: TBody,
    options?: Omit<RequestOptions<TBody>, 'method' | 'body'>
  ) {
    return this.request<TResponse, TBody>(endpoint, { ...options, method: 'POST', body });
  }

  async put<TResponse, TBody = unknown>(
    endpoint: string,
    body: TBody,
    options?: Omit<RequestOptions<TBody>, 'method' | 'body'>
  ) {
    return this.request<TResponse, TBody>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<TResponse, TBody = unknown>(
    endpoint: string,
    body: TBody,
    options?: Omit<RequestOptions<TBody>, 'method' | 'body'>
  ) {
    return this.request<TResponse, TBody>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<TResponse>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<TResponse>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(apiConfig.baseUrl);
