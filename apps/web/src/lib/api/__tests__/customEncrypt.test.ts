import { describe, expect, it } from '@jest/globals';

import {
  CUSTOM_REQUEST_DATA_FIELD,
  CUSTOM_RESPONSE_DATA_FIELD,
  appendEncryptedQueryToUrl,
  buildEncryptedQueryString,
  decryptBackendResponse,
  decryptCustomPayload,
  decryptCustomTokenValue,
  decryptQueryPayload,
  encryptCustomPayload,
  encryptCustomToken,
  encodeString,
  decodeString,
  isEncryptedQueryParams,
} from '../customEncrypt';

describe('customEncrypt', () => {
  describe('encodeString / decodeString', () => {
    it('round-trips ASCII strings', () => {
      const input = 'hello world';
      expect(decodeString(encodeString(input))).toBe(input);
    });
  });

  describe('encryptCustomToken / decryptCustomTokenValue', () => {
    it('round-trips payload with default slug', () => {
      const input = 'test-payload';
      const token = encryptCustomToken(input);
      expect(decryptCustomTokenValue(token)).toBe(input);
    });

    it('throws on invalid token', () => {
      expect(() => decryptCustomTokenValue('')).toThrow('Invalid token');
      expect(() => decryptCustomTokenValue('abc')).toThrow('Invalid token');
    });
  });

  describe('encryptCustomPayload / decryptCustomPayload', () => {
    it('round-trips JSON objects', () => {
      const payload = { email: 'user@example.com', password: 'secret' };
      const encrypted = encryptCustomPayload(payload);
      expect(decryptCustomPayload(encrypted)).toEqual(payload);
    });
  });

  describe('decryptBackendResponse', () => {
    it('decrypts response_data field', () => {
      const inner = {
        message: 'Login successful',
        data: { access_token: 'abc123' },
      };
      const body = {
        success: true,
        message: 'Login successful',
        [CUSTOM_RESPONSE_DATA_FIELD]: encryptCustomPayload(inner),
      };

      const result = decryptBackendResponse(body);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(result.data).toEqual({ access_token: 'abc123' });
    });

    it('passes through unencrypted responses', () => {
      const body = {
        success: false,
        message: 'Invalid credentials',
        data: null,
      };

      const result = decryptBackendResponse(body);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
    });
  });

  describe('request/response field names', () => {
    it('uses expected field constants', () => {
      expect(CUSTOM_REQUEST_DATA_FIELD).toBe('request_data');
      expect(CUSTOM_RESPONSE_DATA_FIELD).toBe('response_data');
    });
  });

  describe('encrypted query parameters', () => {
    it('round-trips query params via request_data', () => {
      const payload = { page: '1', per_page: '10', sort_by: 'sort_order', sort_order: 'ASC' };
      const queryString = buildEncryptedQueryString(payload);

      expect(queryString.startsWith('?request_data=')).toBe(true);

      const searchParams = new URLSearchParams(queryString.slice(1));
      expect(isEncryptedQueryParams(searchParams)).toBe(true);
      expect(decryptQueryPayload(searchParams)).toEqual(payload);
    });

    it('appends encrypted query to backend URL', () => {
      const url = appendEncryptedQueryToUrl('http://localhost:3000/api/v1/menus', {
        page: '2',
        per_page: '20',
      });

      expect(url).toContain('request_data=');
      expect(url.startsWith('http://localhost:3000/api/v1/menus?')).toBe(true);

      const searchParams = new URL(url).searchParams;
      expect(decryptQueryPayload(searchParams)).toEqual({ page: '2', per_page: '20' });
    });

    it('appends encrypted query to URL that already has plain params', () => {
      const url = appendEncryptedQueryToUrl('http://localhost:3000/api/v1/permissions?role_id=2', {});

      expect(url).toContain('role_id=2');
      expect(url).toContain('request_data=');

      const parsed = new URL(url);
      expect(parsed.searchParams.get('role_id')).toBe('2');
      expect(parsed.searchParams.get('request_data')).toBeTruthy();
    });
  });
});
