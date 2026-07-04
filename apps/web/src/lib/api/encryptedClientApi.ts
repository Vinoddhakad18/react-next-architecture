/**
 * Client-side encrypted API helpers for BFF communication.
 */

import { apiClient } from './client';
import {
  appendEncryptedQueryToUrl,
  buildEncryptedRequestBody,
  decryptApiResponse,
  unwrapApiResponse,
} from './customEncryptClient';
import type { ApiError, ApiResponse } from '@/types/api';

interface EncryptedCallOptions {
  auth?: boolean;
  /** Plain query params encrypted into ?request_data= for GET requests. */
  queryParams?: unknown;
}

function withEncryptedDefaults(options: EncryptedCallOptions = {}): EncryptedCallOptions {
  return { auth: true, ...options };
}

function buildEncryptedGetUrl(endpoint: string, queryParams?: unknown): string {
  if (queryParams === undefined) {
    return endpoint;
  }
  return appendEncryptedQueryToUrl(endpoint, queryParams);
}

async function unwrapResponse<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> {
  if (!response.success || response.data === null || response.data === undefined) {
    return response;
  }

  const unwrapped = unwrapApiResponse(response.data);

  const payload =
    unwrapped.permissions !== undefined
      ? { data: unwrapped.data, permissions: unwrapped.permissions }
      : (unwrapped.data ?? response.data);

  return {
    ...response,
    data: payload as T,
    error: unwrapped.success === false && !payload
      ? ({
          message: unwrapped.message ?? 'Request failed',
          status: response.error?.status ?? 502,
        } satisfies ApiError)
      : response.error,
    success: response.success && unwrapped.success !== false,
  };
}

export async function encryptedGet<T>(
  endpoint: string,
  options: EncryptedCallOptions = {}
): Promise<ApiResponse<T>> {
  const resolvedOptions = withEncryptedDefaults(options);
  const url = buildEncryptedGetUrl(endpoint, resolvedOptions.queryParams);
  const response = await apiClient.get<T>(url, resolvedOptions);
  return unwrapResponse(response);
}

export async function encryptedPost<T, TBody = unknown>(
  endpoint: string,
  body: TBody,
  options: EncryptedCallOptions = {}
): Promise<ApiResponse<T>> {
  const resolvedOptions = withEncryptedDefaults(options);
  const response = await apiClient.post<T, Record<string, string>>(
    endpoint,
    buildEncryptedRequestBody(body),
    resolvedOptions
  );
  return unwrapResponse(response);
}

export async function encryptedPut<T, TBody = unknown>(
  endpoint: string,
  body: TBody,
  options: EncryptedCallOptions = {}
): Promise<ApiResponse<T>> {
  const resolvedOptions = withEncryptedDefaults(options);
  const response = await apiClient.put<T, Record<string, string>>(
    endpoint,
    buildEncryptedRequestBody(body),
    resolvedOptions
  );
  return unwrapResponse(response);
}

export async function encryptedPatch<T, TBody = unknown>(
  endpoint: string,
  body: TBody,
  options: EncryptedCallOptions = {}
): Promise<ApiResponse<T>> {
  const resolvedOptions = withEncryptedDefaults(options);
  const response = await apiClient.patch<T, Record<string, string>>(
    endpoint,
    buildEncryptedRequestBody(body),
    resolvedOptions
  );
  return unwrapResponse(response);
}

export async function encryptedDelete<T>(
  endpoint: string,
  options: EncryptedCallOptions = {}
): Promise<ApiResponse<T>> {
  const resolvedOptions = withEncryptedDefaults(options);
  const response = await apiClient.delete<T>(endpoint, resolvedOptions);
  return unwrapResponse(response);
}

export { decryptApiResponse, unwrapApiResponse, buildEncryptedRequestBody, appendEncryptedQueryToUrl };
