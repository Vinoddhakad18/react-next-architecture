import { NextRequest, NextResponse } from 'next/server';

import { BACKEND_API_URL } from '@/lib/api/backendConfig';
import { backendFetch } from '@/lib/api/backendProxy';
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const refreshToken =
      typeof body?.refresh_token === 'string'
        ? body.refresh_token
        : typeof body?.refreshToken === 'string'
        ? body.refreshToken
        : '';

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'refresh_token is required', error: 'Missing refresh token' },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_API_URL}/api/v1/auth/refresh-token`;

    let response: Response;
    try {
      response = await backendFetch(backendUrl, {
        method: 'POST',
        body: { refresh_token: refreshToken },
      });
    } catch (fetchError) {
      console.error('[Auth Refresh API] Fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to connect to backend API',
          error: fetchError instanceof Error ? fetchError.message : 'Network error',
        },
        { status: 503 }
      );
    }

    const responseText = await response.text();
    let data: unknown = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { message: responseText || 'Token refresh failed' };
    }

    const tokens = normalizeAuthTokens(
      isRecord(data) && isRecord(data.data) ? data.data : data
    );

    if (!response.ok || !tokens) {
      const message =
        isRecord(data) && typeof data.message === 'string'
          ? data.message
          : 'Token refresh failed';

      return NextResponse.json(
        { success: false, message, error: data },
        { status: response.ok ? 502 : response.status }
      );
    }

    const nextResponse = NextResponse.json(
      {
        success: true,
        message:
          isRecord(data) && typeof data.message === 'string'
            ? data.message
            : 'Token refreshed',
        data: tokens,
      },
      { status: 200 }
    );

    applyAuthCookies(nextResponse, tokens);
    return nextResponse;
  } catch (error) {
    console.error('[Auth Refresh API] Error:', error);
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
