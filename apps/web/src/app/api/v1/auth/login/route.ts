import { NextRequest, NextResponse } from 'next/server';

import { BACKEND_API_URL } from '@/lib/api/backendConfig';
import { CUSTOM_RESPONSE_DATA_FIELD } from '@/lib/api/customEncrypt';
import { encryptedBackendFetchJson } from '@/lib/api/encryptedBackendProxy';
import {
  cookieMaxAgeSeconds,
  normalizeAuthTokens,
} from '@/lib/auth/normalizeAuthTokens';

const secureCookie = process.env.NODE_ENV === 'production';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function applyAuthCookies(response: NextResponse, tokens: ReturnType<typeof normalizeAuthTokens>) {
  if (!tokens) return;

  const maxAge = cookieMaxAgeSeconds(tokens.expiresAt);

  response.cookies.set('authToken', tokens.accessToken, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'lax',
    maxAge,
    path: '/',
  });

  if (tokens.refreshToken) {
    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
  }
}

function buildClientLoginResponse(
  success: boolean,
  message: string,
  raw: unknown,
  tokens?: ReturnType<typeof normalizeAuthTokens>
): Record<string, unknown> {
  if (
    isRecord(raw) &&
    typeof raw[CUSTOM_RESPONSE_DATA_FIELD] === 'string' &&
    raw[CUSTOM_RESPONSE_DATA_FIELD].trim()
  ) {
    return {
      success,
      message,
      [CUSTOM_RESPONSE_DATA_FIELD]: raw[CUSTOM_RESPONSE_DATA_FIELD],
    };
  }

  return {
    success,
    message,
    data: tokens,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const backendUrl = `${BACKEND_API_URL}/api/v1/auth/login`;

    let result: Awaited<ReturnType<typeof encryptedBackendFetchJson>>;
    try {
      result = await encryptedBackendFetchJson(backendUrl, {
        method: 'POST',
        body,
      });
    } catch (fetchError) {
      console.error('[Auth Login API] Fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to connect to backend API',
          error: fetchError instanceof Error ? fetchError.message : 'Network error',
        },
        { status: 503 }
      );
    }

    const { ok, status, decrypted, raw } = result;
    const tokens = normalizeAuthTokens(decrypted.data);
    const message = decrypted.message ?? (ok ? 'Login successful' : 'Login failed');

    if (!ok || !tokens) {
      return NextResponse.json(
        buildClientLoginResponse(false, message, raw),
        { status: ok ? 502 : status }
      );
    }

    const nextResponse = NextResponse.json(
      buildClientLoginResponse(true, message, raw, tokens),
      { status: 200 }
    );

    applyAuthCookies(nextResponse, tokens);
    return nextResponse;
  } catch (error) {
    console.error('[Auth Login API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
