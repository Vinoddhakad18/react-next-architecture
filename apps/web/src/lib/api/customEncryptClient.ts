/**
 * Client-safe custom encrypt/decrypt helpers for auth API communication.
 */

import {
  buildEncryptedRequestBody as buildEncryptedRequestBodyCore,
  CUSTOM_REQUEST_DATA_FIELD,
  CUSTOM_RESPONSE_DATA_FIELD,
  decryptCustomPayload as decryptCustomPayloadCore,
  encryptCustomPayload as encryptCustomPayloadCore,
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

export interface DecryptedAuthResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  errors?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Unwrap login/auth API responses that use encrypted response_data.
 */
export function decryptAuthResponse(body: unknown): DecryptedAuthResponse {
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
  };
}

/**
 * Normalize apiClient login response — handles plain or response_data payloads.
 */
export function unwrapAuthApiResponse(responseData: unknown): DecryptedAuthResponse {
  if (!isRecord(responseData)) {
    return { success: false };
  }

  if (typeof responseData[CUSTOM_RESPONSE_DATA_FIELD] === 'string') {
    return decryptAuthResponse(responseData);
  }

  return {
    success: responseData.success !== false,
    message: typeof responseData.message === 'string' ? responseData.message : undefined,
    data: responseData.data,
    errors: responseData.errors,
  };
}
