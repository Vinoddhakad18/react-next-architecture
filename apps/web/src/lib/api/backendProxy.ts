/**
 * Backend proxy helper for server-side route handlers.
 *
 * Centralizes the auth-header construction (X-API-Key + Authorization) that was
 * previously duplicated across every API route. Callers still build the URL and
 * own their response normalization; this only standardizes the outgoing request.
 */

import { getBackendApiKey } from './backendConfig';

export interface BackendFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Bearer token forwarded to the backend. */
  authToken: string;
  /** JSON request body. When provided, a `Content-Type: application/json` header is added. */
  body?: unknown;
  /** Adds `Cache-Control`/`Pragma` no-cache headers (used by read endpoints). */
  noCache?: boolean;
}

export async function backendFetch(
  url: string,
  { method = 'GET', authToken, body, noCache = false }: BackendFetchOptions
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-API-Key': getBackendApiKey(),
    Authorization: `Bearer ${authToken}`,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (noCache) {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    headers['Pragma'] = 'no-cache';
  }

  return fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}
