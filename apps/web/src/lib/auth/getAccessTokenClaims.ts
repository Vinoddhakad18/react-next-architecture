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

/** Role claim from the JWT (`role`, `roleName`, or `role_name`). */
export function getAccessTokenRole(): string | undefined {
  const token = tokenManager.getToken();
  if (!token) {
    return undefined;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return undefined;
  }

  const role = payload.role ?? payload.roleName ?? payload.role_name;
  return role != null ? String(role) : undefined;
}
