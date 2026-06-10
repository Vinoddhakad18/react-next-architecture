/**
 * Server-only backend API configuration.
 *
 * SECURITY: Import this ONLY from server code (route handlers, server utils).
 * `API_KEY` is a server-only secret and must NEVER be exposed via a
 * `NEXT_PUBLIC_*` variable, which Next.js inlines into the client bundle.
 */

export const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

/**
 * Resolve the backend API key from a server-only environment variable.
 * Throws if it is missing so misconfiguration fails fast instead of
 * silently falling back to an insecure hardcoded default.
 */
export function getBackendApiKey(): string {
  const key = process.env.API_KEY;

  if (!key) {
    throw new Error(
      'API_KEY environment variable is not set. Configure a server-only API_KEY ' +
        '(do not use NEXT_PUBLIC_API_KEY, which is exposed to the browser).'
    );
  }

  return key;
}
