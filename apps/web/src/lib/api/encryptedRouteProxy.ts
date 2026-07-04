/**
 * Shared helpers for BFF routes that proxy encrypted backend APIs.
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { CUSTOM_RESPONSE_DATA_FIELD } from './customEncrypt';
import { resolveRouteAuthToken } from './backendProxy';
import {
  encryptedBackendFetchJson,
  type EncryptedBackendFetchOptions,
  type EncryptedBackendFetchResult,
} from './encryptedBackendProxy';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function resolveAuthTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('authToken')?.value ?? null;
}

/** Resolve bearer token from httpOnly cookie or incoming Authorization header. */
export async function resolveAuthTokenFromRequest(
  request: NextRequest
): Promise<string | null> {
  return (await resolveRouteAuthToken(request)) ?? null;
}

export function unauthorizedJsonResponse() {
  return NextResponse.json(
    {
      success: false,
      message: 'Unauthorized',
      error: 'Authentication token is required',
    },
    { status: 401 }
  );
}

export function backendUnavailableJsonResponse(error: unknown) {
  return NextResponse.json(
    {
      success: false,
      message: 'Failed to connect to backend API',
      error: error instanceof Error ? error.message : 'Network error',
    },
    { status: 503 }
  );
}

export function buildEncryptedClientResponse(
  raw: unknown,
  options: {
    success: boolean;
    message: string;
    data?: unknown;
    extra?: Record<string, unknown>;
  }
): Record<string, unknown> {
  if (
    isRecord(raw) &&
    typeof raw[CUSTOM_RESPONSE_DATA_FIELD] === 'string' &&
    raw[CUSTOM_RESPONSE_DATA_FIELD].trim()
  ) {
    return {
      success: options.success,
      message: options.message,
      [CUSTOM_RESPONSE_DATA_FIELD]: raw[CUSTOM_RESPONSE_DATA_FIELD],
      ...options.extra,
    };
  }

  const response: Record<string, unknown> = {
    success: options.success,
    message: options.message,
    ...options.extra,
  };

  if (options.data !== undefined) {
    response.data = options.data;
  }

  return response;
}

export function encryptedBackendErrorResponse(
  result: EncryptedBackendFetchResult,
  fallbackMessage: string
) {
  const message = result.decrypted.message ?? fallbackMessage;

  return NextResponse.json(
    buildEncryptedClientResponse(result.raw, { success: false, message }),
    { status: result.ok ? 502 : result.status }
  );
}

export async function proxyEncryptedBackendJson(
  backendUrl: string,
  options: EncryptedBackendFetchOptions & { authToken: string }
): Promise<EncryptedBackendFetchResult> {
  return encryptedBackendFetchJson(backendUrl, options);
}

export function encryptedSuccessResponse(
  result: EncryptedBackendFetchResult,
  data: unknown,
  options?: { message?: string; extra?: Record<string, unknown> }
) {
  const message = options?.message ?? result.decrypted.message ?? 'Success';

  return NextResponse.json(
    buildEncryptedClientResponse(result.raw, {
      success: true,
      message,
      data,
      extra: options?.extra,
    }),
    { status: 200 }
  );
}
