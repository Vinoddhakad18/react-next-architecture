/**
 * Encrypted backend proxy for API calls that require
 * x-api-token header and request_data / response_data wrapping.
 */

import { getBackendApiKey } from './backendConfig';
import {
  appendEncryptedQueryToUrl,
  buildEncryptedRequestBody,
  CUSTOM_REQUEST_DATA_FIELD,
  decryptBackendResponse,
  encryptCustomToken,
  isEncryptedQueryParams,
  isEncryptedRequestBody,
  type DecryptedBackendResponse,
} from './customEncrypt';

export interface EncryptedBackendFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Plain payload — encrypted into request_data before sending. */
  body?: unknown;
  /** Pre-encrypted body, e.g. { request_data: "..." }. Sent as-is. */
  encryptedBody?: Record<string, string>;
  /** Plain query params — encrypted into ?request_data= for GET requests. */
  queryParams?: unknown;
  /** Pre-encrypted query, e.g. ?request_data=... */
  encryptedQuery?: string;
  /** Bearer token for authenticated backend routes. */
  authToken?: string;
  /** Adds Cache-Control/Pragma no-cache headers. */
  noCache?: boolean;
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

function resolveRequestUrl(
  url: string,
  method: string,
  queryParams?: unknown,
  encryptedQuery?: string
): string {
  if (encryptedQuery) {
    return encryptedQuery.startsWith('?')
      ? `${url.split('?')[0]}${encryptedQuery}`
      : `${url}${encryptedQuery}`;
  }

  if (method === 'GET' && queryParams !== undefined) {
    if (isEncryptedRequestBody(queryParams)) {
      const token = queryParams[CUSTOM_REQUEST_DATA_FIELD].trim();
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${CUSTOM_REQUEST_DATA_FIELD}=${encodeURIComponent(token)}`;
    }

    return appendEncryptedQueryToUrl(url, queryParams);
  }

  return url;
}

export async function encryptedBackendFetch(
  url: string,
  {
    method = 'POST',
    body,
    encryptedBody,
    queryParams,
    encryptedQuery,
    authToken,
    noCache = false,
  }: EncryptedBackendFetchOptions = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-API-Key': getBackendApiKey(),
    'x-api-token': createApiToken(),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  if (noCache) {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    headers.Pragma = 'no-cache';
  }

  const requestBody = resolveRequestBody(body, encryptedBody);
  const requestUrl = resolveRequestUrl(url, method, queryParams, encryptedQuery);

  if (requestBody !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(requestUrl, {
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

export { isEncryptedQueryParams };
