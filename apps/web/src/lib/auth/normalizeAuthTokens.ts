/**
 * Normalize auth token payloads from backend responses (snake_case or camelCase).
 */

import { pickNumber, pickString } from '@/lib/api/fieldAccess';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Unwrap `{ data: { access_token } }` or return the object itself. */
export function unwrapAuthPayload(raw: unknown): Record<string, unknown> | null {
  if (!isRecord(raw)) {
    return null;
  }

  if (isRecord(raw.data) && !Array.isArray(raw.data)) {
    return raw.data;
  }

  return raw;
}

export function normalizeAuthTokens(raw: unknown): AuthTokens | null {
  const payload = unwrapAuthPayload(raw);
  if (!payload) {
    return null;
  }

  const accessToken = pickString(payload, 'accessToken', 'access_token');
  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: pickString(payload, 'refreshToken', 'refresh_token'),
    expiresAt: pickNumber(payload, 'expiresAt', 'expires_at'),
  };
}

/** Extract tokens from an apiClient response body. */
export function extractAuthTokensFromApiResponse(responseData: unknown): AuthTokens | null {
  if (!isRecord(responseData)) {
    return null;
  }

  return (
    normalizeAuthTokens(responseData) ??
    (isRecord(responseData.data) ? normalizeAuthTokens(responseData.data) : null)
  );
}

export function cookieMaxAgeSeconds(expiresAt?: number): number {
  if (!expiresAt) {
    return 60 * 60 * 24;
  }

  const now = Math.floor(Date.now() / 1000);
  return Math.max(60, expiresAt - now);
}
