/**
 * Redirect Validation Utilities
 * Prevents Open Redirect vulnerabilities
 *
 * SECURITY: Only allows internal relative paths, blocks external URLs
 */

import { ROUTES, PROTECTED_ROUTES } from '@/constants/routes';

/**
 * List of allowed redirect paths
 * Only internal application routes are permitted
 */
const ALLOWED_REDIRECTS = [
  ROUTES.ADMIN.DASHBOARD,
  ROUTES.ADMIN.USERS,
  ROUTES.ADMIN.SETTINGS,
  ROUTES.ADMIN.PROFILE,
  ROUTES.HOME,
] as const;

/**
 * Validate if a redirect URL is safe
 *
 * Security checks:
 * 1. Must be a relative path (starts with /)
 * 2. Cannot contain protocol (http://, https://, //)
 * 3. Must be in allowed list OR be a protected route
 *
 * @param url - The URL to validate
 * @param defaultRedirect - Fallback if validation fails
 * @returns Safe redirect URL
 */
export function getSafeRedirect(
  url: string | null | undefined,
  defaultRedirect: string = ROUTES.ADMIN.DASHBOARD
): string {
  // No URL provided
  if (!url) {
    return defaultRedirect;
  }

  // Decode URL to prevent encoded attacks
  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch {
    // Invalid URL encoding
    return defaultRedirect;
  }

  // SECURITY: Block absolute URLs (external redirects)
  // Checks for: http://, https://, //, \\, javascript:, data:, etc.
  if (
    decodedUrl.match(/^https?:\/\//i) ||
    decodedUrl.match(/^\/\//i) ||
    decodedUrl.match(/^\\/i) ||
    decodedUrl.match(/^javascript:/i) ||
    decodedUrl.match(/^data:/i) ||
    decodedUrl.match(/^vbscript:/i) ||
    decodedUrl.match(/^file:/i)
  ) {
    console.warn('Blocked external redirect attempt:', decodedUrl);
    return defaultRedirect;
  }

  // SECURITY: Must start with / (relative path)
  if (!decodedUrl.startsWith('/')) {
    return defaultRedirect;
  }

  // SECURITY: Block double slashes and backslashes
  if (decodedUrl.includes('//') || decodedUrl.includes('\\')) {
    console.warn('Blocked malformed redirect:', decodedUrl);
    return defaultRedirect;
  }

  // Check if URL is in allowed list
  if (ALLOWED_REDIRECTS.includes(decodedUrl as typeof ALLOWED_REDIRECTS[number])) {
    return decodedUrl;
  }

  // Check if URL is a known protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    decodedUrl === route || decodedUrl.startsWith(`${route}/`)
  );

  if (isProtectedRoute) {
    return decodedUrl;
  }

  // URL not in allowed list
  console.warn('Redirect not in allowed list, using default:', decodedUrl);
  return defaultRedirect;
}

/**
 * Validate redirect for non-admin routes
 */
export function getSafePublicRedirect(
  url: string | null | undefined,
  defaultRedirect: string = ROUTES.HOME
): string {
  return getSafeRedirect(url, defaultRedirect);
}

/**
 * Check if a URL is a valid internal path
 */
export function isInternalUrl(url: string): boolean {
  if (!url) return false;

  try {
    const decoded = decodeURIComponent(url);

    // Must start with /
    if (!decoded.startsWith('/')) return false;

    // Must not have protocol
    if (
      decoded.match(/^https?:\/\//i) ||
      decoded.match(/^\/\//i) ||
      decoded.match(/^\\/i) ||
      decoded.match(/^javascript:/i) ||
      decoded.match(/^data:/i)
    ) {
      return false;
    }

    // Must not have double slashes
    if (decoded.includes('//') || decoded.includes('\\')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
