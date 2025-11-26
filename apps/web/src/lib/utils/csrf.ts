/**
 * CSRF Token Utility
 * Provides functions for generating and validating CSRF tokens
 * Uses Web Crypto API for Edge runtime compatibility
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_SECRET_LENGTH = 64;

/**
 * Convert Uint8Array to base64url string
 */
function toBase64Url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generate a random CSRF token
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

/**
 * Generate a CSRF secret (for server-side storage)
 */
export function generateCsrfSecret(): string {
  const bytes = new Uint8Array(CSRF_SECRET_LENGTH);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

/**
 * Hash a token with a secret for validation
 */
export async function hashToken(token: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${token}.${secret}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return toBase64Url(new Uint8Array(hashBuffer));
}

/**
 * Validate a CSRF token against a hashed token
 */
export async function validateCsrfToken(
  token: string | undefined,
  hashedToken: string | undefined,
  secret: string | undefined
): Promise<boolean> {
  if (!token || !hashedToken || !secret) {
    return false;
  }

  try {
    const expectedHash = await hashToken(token, secret);

    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(expectedHash, hashedToken);
  } catch {
    return false;
  }
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Get CSRF token from cookies (client-side)
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return decodeURIComponent(value);
    }
  }

  return null;
}
