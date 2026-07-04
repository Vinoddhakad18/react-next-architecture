/**
 * Encrypted backend proxy for public endpoints (e.g. login) that require
 * x-api-token header and request_data / response_data wrapping.
 */

import { getBackendApiKey } from './backendConfig';
import {
  buildEncryptedRequestBody,
  CUSTOM_REQUEST_DATA_FIELD,
  decryptBackendResponse,
  encryptCustomToken,
  isEncryptedRequestBody,
  type DecryptedBackendResponse,
} from './customEncrypt';

export interface EncryptedBackendFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Plain payload — encrypted into request_data before sending. */
  body?: unknown;
  /** Pre-encrypted body, e.g. { request_data: "..." }. Sent as-is. */
  encryptedBody?: Record<string, string>;
}

export interface EncryptedBackendFetchResult {
  ok: boolean;
  status: number;
  decrypted: DecryptedBackendResponse;
  raw: unknown;
}

function createApiToken(): string {
  return encryptCustomToken(getBackendApiKey());
}

function resolveRequestBody(
  body?: unknown,
  encryptedBody?: Record<string, string>
): Record<string, string> | undefined {
  if (encryptedBody?.[CUSTOM_REQUEST_DATA_FIELD]?.trim()) {
    return encryptedBody;
  }

  if (isEncryptedRequestBody(body)) {
    return { [CUSTOM_REQUEST_DATA_FIELD]: body[CUSTOM_REQUEST_DATA_FIELD].trim() };
  }

  if (body !== undefined) {
    return buildEncryptedRequestBody(body);
  }

  return undefined;
}

export async function encryptedBackendFetch(
  url: string,
  { method = 'POST', body, encryptedBody }: EncryptedBackendFetchOptions = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-API-Key': getBackendApiKey(),
    'x-api-token': createApiToken(),
  };

  const requestBody = resolveRequestBody(body, encryptedBody);

  return fetch(url, {
    method,
    headers,
    body: requestBody !== undefined ? JSON.stringify(requestBody) : undefined,
    cache: 'no-store',
  });
}

export async function encryptedBackendFetchJson(
  url: string,
  options: EncryptedBackendFetchOptions = {}
): Promise<EncryptedBackendFetchResult> {
  const response = await encryptedBackendFetch(url, options);
  const responseText = await response.text();

  let raw: unknown = {};
  try {
    raw = responseText ? JSON.parse(responseText) : {};
  } catch {
    raw = { message: responseText || 'Request failed' };
  }

  let decrypted: DecryptedBackendResponse;
  try {
    decrypted = decryptBackendResponse(raw);
  } catch {
    decrypted = {
      success: false,
      message:
        typeof raw === 'object' &&
        raw !== null &&
        'message' in raw &&
        typeof (raw as Record<string, unknown>).message === 'string'
          ? ((raw as Record<string, unknown>).message as string)
          : 'Failed to decrypt backend response',
    };
  }

  return {
    ok: response.ok,
    status: response.status,
    decrypted,
    raw,
  };
}
