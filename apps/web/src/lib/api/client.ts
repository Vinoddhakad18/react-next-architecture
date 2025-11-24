/**
 * API Client
 * A type-safe fetch wrapper with error handling
 */

import { apiConfig, getAuthHeader } from './config';
import type { ApiResponse, ApiError } from '@/types/api';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions<TBody = unknown> {
  method?: RequestMethod;
  body?: TBody;
  headers?: Record<string, string>;
  auth?: boolean;
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
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
