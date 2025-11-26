/**
 * CSRF Token API Route
 * Generates and provides CSRF tokens to clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, generateCsrfSecret, hashToken } from '@/lib/utils/csrf';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Generate a new CSRF token and secret
    const token = generateCsrfToken();
    const secret = generateCsrfSecret();
    const hashedToken = await hashToken(token, secret);

    // Set cookies with secure options
    const cookieStore = await cookies();

    // Store the token (accessible to client JavaScript)
    cookieStore.set('csrf-token', token, {
      httpOnly: false, // Client needs to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Store the hashed token (httpOnly, not accessible to client)
    cookieStore.set('csrf-token-hash', hashedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Store the secret (httpOnly, not accessible to client)
    cookieStore.set('csrf-secret', secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'CSRF token generated',
        data: { token },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate CSRF token',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
