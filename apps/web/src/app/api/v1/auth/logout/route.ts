/**
 * Logout API Route
 * Demonstrates CSRF protection for state-changing operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfValidation = await validateCsrfFromRequest(request);

    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    // Get cookies
    const cookieStore = await cookies();

    // Clear authentication cookies
    cookieStore.delete('authToken');
    cookieStore.delete('refreshToken');

    // Clear CSRF cookies
    cookieStore.delete('csrf-token');
    cookieStore.delete('csrf-token-hash');
    cookieStore.delete('csrf-secret');

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
