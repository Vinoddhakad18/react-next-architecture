import { NextRequest, NextResponse } from 'next/server';

import { BACKEND_API_URL } from '@/lib/api/backendConfig';
import { backendFetch } from '@/lib/api/backendProxy';
import {
  cookieMaxAgeSeconds,
  normalizeAuthTokens,
} from '@/lib/auth/normalizeAuthTokens';

const secureCookie = process.env.NODE_ENV === 'production';

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

    const backendUrl = `${BACKEND_API_URL}/api/v1/auth/login`;

    let response: Response;
    try {
      response = await backendFetch(backendUrl, {
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

    const responseText = await response.text();
    let data: unknown = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { message: responseText || 'Login failed' };
    }

    const tokens = normalizeAuthTokens(
      isRecord(data) && isRecord(data.data) ? data.data : data
    );

    if (!response.ok || !tokens) {
      const message =
        isRecord(data) && typeof data.message === 'string'
          ? data.message
          : 'Login failed';

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
            : 'Login successful',
        data: tokens,
      },
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
