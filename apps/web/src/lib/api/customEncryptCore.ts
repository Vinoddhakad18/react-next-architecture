/**
 * Pure custom encrypt/decrypt helpers (no server env dependencies).
 */

import {
  parseEncryptedQueryPayload,
  serializeEncryptedQueryPayload,
} from './encryptedQueryPayload';

export const CUSTOM_REQUEST_DATA_FIELD = 'request_data';
export const CUSTOM_RESPONSE_DATA_FIELD = 'response_data';

const TOKEN_DAY_LENGTH = 2;
const TOKEN_PAYLOAD_LENGTH_WIDTH = 4;
const TOKEN_HEADER_LENGTH = TOKEN_DAY_LENGTH + TOKEN_PAYLOAD_LENGTH_WIDTH;

function numToChar(chars: string, num: number): string {
  return chars[num % 62];
}

function charToNum(chars: string, char: string): number {
  return chars.indexOf(char);
}

export function encodeString(chars: string, str: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    const high = Math.floor(code / 62);
    const low = code % 62;
    result += numToChar(chars, high) + numToChar(chars, low);
  }

  return result;
}

export function decodeString(chars: string, token: string): string {
  if (!token || token.length % 2 !== 0) {
    throw new Error('Invalid token');
  }

  let result = '';

  for (let i = 0; i < token.length; i += 2) {
    const high = charToNum(chars, token[i]);
    const low = charToNum(chars, token[i + 1]);

    if (high < 0 || low < 0) {
      throw new Error('Invalid token');
    }

    const code = high * 62 + low;
    result += String.fromCharCode(code);
  }
  return result;
}

export function encryptCustomToken(
  chars: string,
  inputString: string,
  slug: string = 'bs255T'
): string {
  const dd = String(new Date().getDate()).padStart(TOKEN_DAY_LENGTH, '0');
  const inputLength = inputString.length.toString().padStart(TOKEN_PAYLOAD_LENGTH_WIDTH, '0');
  const base = `${dd}${inputLength}${inputString}${slug}`;
  return encodeString(chars, base);
}

export function decryptCustomTokenValue(chars: string, token: string): string {
  if (!token || !token.trim()) {
    throw new Error('Invalid token');
  }

  const decoded = decodeString(chars, token.trim());

  if (decoded.length < TOKEN_HEADER_LENGTH) {
    throw new Error('Invalid token');
  }

  const inputLength = parseInt(
    decoded.slice(TOKEN_DAY_LENGTH, TOKEN_HEADER_LENGTH),
    10
  );

  if (!Number.isFinite(inputLength) || inputLength < 0) {
    throw new Error('Invalid token');
  }

  const payload = decoded.slice(TOKEN_HEADER_LENGTH, TOKEN_HEADER_LENGTH + inputLength);

  if (payload.length !== inputLength) {
    throw new Error('Invalid token');
  }

  return payload;
}

export function encryptCustomPayload(chars: string, data: unknown, slug?: string): string {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  return encryptCustomToken(chars, serialized, slug);
}

export function decryptCustomPayload(chars: string, token: string): unknown {
  const decrypted = decryptCustomTokenValue(chars, token);

  try {
    return JSON.parse(decrypted) as unknown;
  } catch {
    return decrypted;
  }
}

export function buildEncryptedRequestBody(chars: string, payload: unknown): Record<string, string> {
  return {
    [CUSTOM_REQUEST_DATA_FIELD]: encryptCustomPayload(chars, payload),
  };
}

export function buildEncryptedQueryString(chars: string, payload: unknown): string {
  const serialized = serializeEncryptedQueryPayload(payload);
  const encrypted = encryptCustomPayload(chars, serialized);
  return `?${CUSTOM_REQUEST_DATA_FIELD}=${encodeURIComponent(encrypted)}`;
}

export function appendEncryptedQueryToUrl(
  chars: string,
  url: string,
  payload: unknown
): string {
  const serialized = serializeEncryptedQueryPayload(payload);
  const encrypted = encryptCustomPayload(chars, serialized);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${CUSTOM_REQUEST_DATA_FIELD}=${encodeURIComponent(encrypted)}`;
}

export function decryptQueryPayload(
  chars: string,
  searchParams: URLSearchParams
): unknown | null {
  const encrypted = searchParams.get(CUSTOM_REQUEST_DATA_FIELD);
  if (!encrypted?.trim()) {
    return null;
  }

  const decrypted = decryptCustomPayload(chars, encrypted.trim());
  const parsed = parseEncryptedQueryPayload(decrypted);
  if (parsed !== null) {
    return parsed;
  }

  return decrypted;
}

export function isEncryptedQueryParams(
  searchParams: URLSearchParams
): boolean {
  const encrypted = searchParams.get(CUSTOM_REQUEST_DATA_FIELD);
  return typeof encrypted === 'string' && encrypted.trim().length > 0;
}
