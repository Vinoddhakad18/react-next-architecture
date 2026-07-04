/**
 * Custom token encoding/decoding for encrypted backend API communication.
 *
 * Server-only: uses ENCRYPT_DECRYPT_KEY from environment.
 */

import { getEncryptDecryptKey } from './backendConfig';
import {
  buildEncryptedRequestBody as buildEncryptedRequestBodyCore,
  CUSTOM_REQUEST_DATA_FIELD,
  CUSTOM_RESPONSE_DATA_FIELD,
  decodeString as decodeStringCore,
  decryptCustomPayload as decryptCustomPayloadCore,
  decryptCustomTokenValue as decryptCustomTokenValueCore,
  encodeString as encodeStringCore,
  encryptCustomPayload as encryptCustomPayloadCore,
  encryptCustomToken as encryptCustomTokenCore,
} from './customEncryptCore';

export { CUSTOM_REQUEST_DATA_FIELD, CUSTOM_RESPONSE_DATA_FIELD };

export const encodeString = (str: string): string =>
  encodeStringCore(getEncryptDecryptKey(), str);

export const decodeString = (token: string): string =>
  decodeStringCore(getEncryptDecryptKey(), token);

export const encryptCustomToken = (inputString: string, slug: string = 'bs255T'): string =>
  encryptCustomTokenCore(getEncryptDecryptKey(), inputString, slug);

export const decryptCustomTokenValue = (token: string): string =>
  decryptCustomTokenValueCore(getEncryptDecryptKey(), token);

export const encryptCustomPayload = (data: unknown, slug?: string): string =>
  encryptCustomPayloadCore(getEncryptDecryptKey(), data, slug);

export const decryptCustomPayload = (token: string): unknown =>
  decryptCustomPayloadCore(getEncryptDecryptKey(), token);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export interface DecryptedBackendResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  errors?: unknown;
  permissions?: unknown;
  meta?: unknown;
}

/**
 * Decrypt a backend response shaped by encryptCustomResponseBody middleware.
 */
export function decryptBackendResponse(body: unknown): DecryptedBackendResponse {
  if (!isRecord(body)) {
    throw new Error('Invalid response body');
  }

  const success = body.success !== false;
  const message = typeof body.message === 'string' ? body.message : undefined;
  const encrypted = body[CUSTOM_RESPONSE_DATA_FIELD];

  if (typeof encrypted !== 'string' || !encrypted.trim()) {
    return { success, message, data: body.data, errors: body.errors };
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
 * Build an encrypted request body for the backend API.
 * Payload is encrypted as-is (camelCase for login credentials).
 */
export function buildEncryptedRequestBody(payload: unknown): Record<string, string> {
  return buildEncryptedRequestBodyCore(getEncryptDecryptKey(), payload);
}

export function isEncryptedRequestBody(body: unknown): body is Record<string, string> {
  return (
    isRecord(body) &&
    typeof body[CUSTOM_REQUEST_DATA_FIELD] === 'string' &&
    body[CUSTOM_REQUEST_DATA_FIELD].trim().length > 0
  );
}
