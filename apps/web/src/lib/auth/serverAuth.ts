/**
 * Server-Side Authentication Utilities
 * For use in Server Components and Server Actions
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { STORAGE_KEYS } from '@/constants';

/**
 * Get authentication token from server-side cookies
 * Use this in Server Components
 */
export async function getServerAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STORAGE_KEYS.AUTH_TOKEN);
  return token?.value || null;
}

/**
 * Check if user is authenticated on server-side
 * Use this in Server Components
 */
export async function isServerAuthenticated(): Promise<boolean> {
  const token = await getServerAuthToken();
  return !!token;
}

/**
 * Require authentication in Server Components
 * Redirects to login if not authenticated
 *
 * @param redirectTo - Optional path to redirect to after login
 */
export async function requireServerAuth(redirectTo?: string): Promise<string> {
  const token = await getServerAuthToken();

  if (!token) {
    const loginPath = redirectTo
      ? `/admin/login?redirect=${encodeURIComponent(redirectTo)}`
      : '/admin/login';
    redirect(loginPath);
  }

  return token;
}

/**
 * Get user info from token (client would need to decode JWT)
 * This is a placeholder - implement based on your JWT structure
 */
export async function getServerUser(): Promise<{ token: string } | null> {
  const token = await getServerAuthToken();

  if (!token) {
    return null;
  }

  // TODO: Decode JWT and return user info
  // For now, just return the token
  return { token };
}
