/**
 * API Client
 * A type-safe fetch wrapper with error handling and automatic token refresh
 */

import { apiConfig, getAuthHeader } from './config';
import { API_ENDPOINTS } from './endpoints';
import { readJsonResponse } from './parseResponse';
import { tokenManager } from '@/lib/auth/TokenManager';
import { extractAuthTokensFromApiResponse } from '@/lib/auth/normalizeAuthTokens';
import { getCsrfTokenFromCookie } from '@/lib/utils/csrf';
import { toSnakeCaseKeys } from './snakeCase';
import type { ApiResponse, ApiError } from '@/types/api';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions<TBody = unknown> {
  method?: RequestMethod;
  body?: TBody;
  headers?: Record<string, string>;
  auth?: boolean;
  timeout?: number;
  _skipRefresh?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
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
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      tokenManager.clearTokens();
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: {
          ...apiConfig.headers,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        tokenManager.clearTokens();
        return false;
      }

      const data = await readJsonResponse(response);

      const tokens = extractAuthTokensFromApiResponse(data);
      if (tokens?.accessToken) {
        tokenManager.setToken(tokens.accessToken);
        if (tokens.refreshToken) {
          tokenManager.setRefreshToken(tokens.refreshToken);
        }
        return true;
      }

      tokenManager.clearTokens();
      return false;
    } catch {
      tokenManager.clearTokens();
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
      headers = apiConfig.headers,
      auth = false,
      timeout = apiConfig.timeout,
      _skipRefresh = false,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Get CSRF token for state-changing requests
    const csrfToken = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
      ? getCsrfTokenFromCookie()
      : null;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...apiConfig.headers,
          ...headers,
          ...(auth ? getAuthHeader() : {}),
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: body ? JSON.stringify(toSnakeCaseKeys(body)) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await readJsonResponse(response);

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
          message:
            (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
              ? data.message
              : null) || 'An error occurred',
          status: response.status,
          errors:
            data && typeof data === 'object' && 'errors' in data
              ? (data.errors as ApiError['errors'])
              : undefined,
        };
        return { data: null as unknown as TResponse, error, success: false };
      }

      return { data: data as TResponse, error: null, success: true };
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
