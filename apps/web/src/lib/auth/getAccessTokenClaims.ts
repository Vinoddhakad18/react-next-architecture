/**
 * Read non-sensitive claims from the stored access token (client-side UI gating only).
 */

import { tokenManager } from './TokenManager';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const parsed: unknown = JSON.parse(json);

    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** All decoded claims from the stored access token, or null when absent/invalid. */
export function getAccessTokenClaims(): Record<string, unknown> | null {
  const token = tokenManager.getToken();
  if (!token) {
    return null;
  }
  return decodeJwtPayload(token);
}

/** Role claim from the JWT (`role`, `roleName`, or `role_name`). */
export function getAccessTokenRole(): string | undefined {
  const payload = getAccessTokenClaims();
  if (!payload) {
    return undefined;
  }

  const role = payload.role ?? payload.roleName ?? payload.role_name;
  return role != null ? String(role) : undefined;
}

/** Display name claim from the JWT (`name`, `fullName`, `unique_name`, or `username`). */
export function getAccessTokenName(): string | undefined {
  const payload = getAccessTokenClaims();
  if (!payload) {
    return undefined;
  }

  const name = payload.name ?? payload.fullName ?? payload.unique_name ?? payload.username;
  return name != null ? String(name) : undefined;
}

/** Email claim from the JWT (`email`, `emailAddress`, or `email_address`). */
export function getAccessTokenEmail(): string | undefined {
  const payload = getAccessTokenClaims();
  if (!payload) {
    return undefined;
  }

  const email = payload.email ?? payload.emailAddress ?? payload.email_address ?? payload.sub;
  return email != null ? String(email) : undefined;
}
