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
  const key = process.env.API_KEY ?? process.env.NEXT_PUBLIC_API_KEY;

  if (!key) {
    throw new Error(
      'API_KEY environment variable is not set. Configure a server-only API_KEY ' +
        '(or NEXT_PUBLIC_API_KEY for local development).'
    );
  }

  return key;
}

const DEFAULT_ENCRYPT_DECRYPT_KEY =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Base62 alphabet used by custom encrypt/decrypt token encoding.
 * Must match the backend ENCRYPT_DECRYPT_KEY value.
 */
export function getEncryptDecryptKey(): string {
  const key = process.env.ENCRYPT_DECRYPT_KEY ?? DEFAULT_ENCRYPT_DECRYPT_KEY;

  if (key.length !== 62) {
    throw new Error(
      'ENCRYPT_DECRYPT_KEY must be exactly 62 characters (base62 alphabet).'
    );
  }

  return key;
}
