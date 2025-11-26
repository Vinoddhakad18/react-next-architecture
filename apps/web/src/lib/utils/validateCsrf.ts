/**
 * Server-side CSRF Validation Utility
 * Validates CSRF tokens from incoming requests
 */

import { NextRequest } from 'next/server';
import { validateCsrfToken } from './csrf';

export interface CsrfValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate CSRF token from a Next.js request
 * This function should be called in API routes that perform state-changing operations
 */
export async function validateCsrfFromRequest(request: NextRequest): Promise<CsrfValidationResult> {
  // Get CSRF token from request header
  const csrfTokenHeader = request.headers.get('X-CSRF-Token');

  // Get hashed token and secret from cookies
  const hashedToken = request.cookies.get('csrf-token-hash')?.value;
  const secret = request.cookies.get('csrf-secret')?.value;

  // Validate the token
  const isValid = await validateCsrfToken(csrfTokenHeader, hashedToken, secret);

  if (!isValid) {
    return {
      isValid: false,
      error: 'Invalid or missing CSRF token',
    };
  }

  return { isValid: true };
}

/**
 * Validate CSRF token from standard Request object
 * Use this for API routes using the standard Request API
 */
export async function validateCsrfFromStandardRequest(request: Request): Promise<CsrfValidationResult> {
  // Get CSRF token from request header
  const csrfTokenHeader = request.headers.get('X-CSRF-Token');

  // Parse cookies manually from the Cookie header
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = parseCookies(cookieHeader);

  const hashedToken = cookies['csrf-token-hash'];
  const secret = cookies['csrf-secret'];

  // Validate the token
  const isValid = await validateCsrfToken(csrfTokenHeader, hashedToken, secret);

  if (!isValid) {
    return {
      isValid: false,
      error: 'Invalid or missing CSRF token',
    };
  }

  return { isValid: true };
}

/**
 * Parse cookies from Cookie header string
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) {
    return cookies;
  }

  const cookiePairs = cookieHeader.split(';');

  for (const pair of cookiePairs) {
    const [name, value] = pair.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  }

  return cookies;
}

/**
 * Helper function to create a CSRF error response
 */
export function createCsrfErrorResponse() {
  return Response.json(
    {
      success: false,
      message: 'CSRF validation failed',
      error: 'Invalid or missing CSRF token',
    },
    { status: 403 }
  );
}
