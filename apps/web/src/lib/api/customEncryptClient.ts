/**
 * Client-safe custom encrypt/decrypt helpers for auth API communication.
 */

import {
  appendEncryptedQueryToUrl as appendEncryptedQueryToUrlCore,
  buildEncryptedRequestBody as buildEncryptedRequestBodyCore,
  buildEncryptedQueryString as buildEncryptedQueryStringCore,
  CUSTOM_REQUEST_DATA_FIELD,
  CUSTOM_RESPONSE_DATA_FIELD,
  decryptCustomPayload as decryptCustomPayloadCore,
  decryptQueryPayload as decryptQueryPayloadCore,
  encryptCustomPayload as encryptCustomPayloadCore,
  isEncryptedQueryParams as isEncryptedQueryParamsCore,
} from './customEncryptCore';

const DEFAULT_ENCRYPT_DECRYPT_KEY =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function getClientEncryptKey(): string {
  return process.env.NEXT_PUBLIC_ENCRYPT_DECRYPT_KEY?.trim() || DEFAULT_ENCRYPT_DECRYPT_KEY;
}

export { CUSTOM_REQUEST_DATA_FIELD, CUSTOM_RESPONSE_DATA_FIELD };

export function encryptCustomPayload(data: unknown, slug?: string): string {
  return encryptCustomPayloadCore(getClientEncryptKey(), data, slug);
}

export function decryptCustomPayload(token: string): unknown {
  return decryptCustomPayloadCore(getClientEncryptKey(), token);
}

export function buildEncryptedLoginBody(credentials: { email: string; password: string }) {
  return buildEncryptedRequestBodyCore(getClientEncryptKey(), credentials);
}

export function buildEncryptedRequestBody(payload: unknown) {
  return buildEncryptedRequestBodyCore(getClientEncryptKey(), payload);
}

export function buildEncryptedQueryString(payload: unknown) {
  return buildEncryptedQueryStringCore(getClientEncryptKey(), payload);
}

export function appendEncryptedQueryToUrl(url: string, payload: unknown) {
  return appendEncryptedQueryToUrlCore(getClientEncryptKey(), url, payload);
}

export function decryptQueryPayload(searchParams: URLSearchParams) {
  return decryptQueryPayloadCore(getClientEncryptKey(), searchParams);
}

export function isEncryptedQueryParams(searchParams: URLSearchParams) {
  return isEncryptedQueryParamsCore(searchParams);
}

export interface DecryptedApiResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  errors?: unknown;
  permissions?: unknown;
  meta?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Unwrap API responses that use encrypted response_data.
 */
export function decryptApiResponse(body: unknown): DecryptedApiResponse {
  if (!isRecord(body)) {
    return { success: false, message: 'Invalid response' };
  }

  const success = body.success !== false;
  const message = typeof body.message === 'string' ? body.message : undefined;
  const encrypted = body[CUSTOM_RESPONSE_DATA_FIELD];

  if (typeof encrypted !== 'string' || !encrypted.trim()) {
    return {
      success,
      message,
      data: body.data,
      errors: body.errors,
    };
  }

  const decrypted = decryptCustomPayload(encrypted.trim());

  if (!isRecord(decrypted)) {
    return { success, message, data: decrypted };
  }

  return {
    success,
    message: typeof decrypted.message === 'string' ? decrypted.message : message,
    data: decrypted.data,
    errors: decrypted.errors,
    permissions: decrypted.permissions,
    meta: decrypted.meta,
  };
}

/**
 * Normalize apiClient response — handles plain or response_data payloads.
 */
export function unwrapApiResponse(responseData: unknown): DecryptedApiResponse {
  if (!isRecord(responseData)) {
    return { success: false };
  }

  if (typeof responseData[CUSTOM_RESPONSE_DATA_FIELD] === 'string') {
    return decryptApiResponse(responseData);
  }

  return {
    success: responseData.success !== false,
    message: typeof responseData.message === 'string' ? responseData.message : undefined,
    data: responseData.data ?? responseData,
    errors: responseData.errors,
  };
}

/** @deprecated Use unwrapApiResponse */
export const unwrapAuthApiResponse = unwrapApiResponse;

/** @deprecated Use decryptApiResponse */
export const decryptAuthResponse = decryptApiResponse;
