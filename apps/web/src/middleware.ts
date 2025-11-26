import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateCsrfToken, generateCsrfSecret, hashToken } from '@/lib/utils/csrf';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken');
  const csrfToken = request.cookies.get('csrf-token');
  const { pathname } = request.nextUrl;

  // Allow access to login page without authentication
  const isLoginPage = pathname === '/admin/login';

  // Redirect authenticated users away from login page
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Redirect unauthenticated users from protected admin routes (except login page)
  if (!token && pathname.startsWith('/admin') && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Generate CSRF token if not present and user is authenticated
  if (token && !csrfToken) {
    const response = NextResponse.next();

    const newCsrfToken = generateCsrfToken();
    const secret = generateCsrfSecret();
    const hashedToken = await hashToken(newCsrfToken, secret);

    // Set CSRF token (accessible to client)
    response.cookies.set('csrf-token', newCsrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Set hashed token (httpOnly)
    response.cookies.set('csrf-token-hash', hashedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    // Set secret (httpOnly)
    response.cookies.set('csrf-secret', secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
