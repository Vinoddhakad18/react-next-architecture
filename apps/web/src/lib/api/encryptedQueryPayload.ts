/**
 * Shared helpers for encrypted GET query payloads.
 * request_data uses query-string format (page=1&per_page=10), not JSON.
 */

/** Serialize payload for encryption inside request_data. */
export function serializeEncryptedQueryPayload(data: unknown): string {
  if (typeof data === 'string') {
    return data;
  }

  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    if (Object.keys(record).length === 0) {
      return '{}';
    }

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(record)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    }
    return params.toString();
  }

  return String(data);
}

/** Parse decrypted request_data (query-string or legacy JSON object). */
export function parseEncryptedQueryPayload(decrypted: unknown): Record<string, string> | null {
  if (typeof decrypted === 'string') {
    const trimmed = decrypted.trim();
    if (!trimmed || trimmed === '{}') {
      return {};
    }

    const params = new URLSearchParams(trimmed);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  if (decrypted !== null && typeof decrypted === 'object' && !Array.isArray(decrypted)) {
    const record = decrypted as Record<string, unknown>;
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(record)) {
      if (value !== undefined && value !== null && value !== '') {
        result[key] = String(value);
      }
    }
    return result;
  }

  return null;
}

export function pickQueryField(
  record: Record<string, string>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return null;
}

export function parseQueryFlag(value: string | null | undefined): boolean {
  return value === 'true' || value === '1';
}
