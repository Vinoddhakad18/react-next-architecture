import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';

import {
  CUSTOM_REQUEST_DATA_FIELD,
  CUSTOM_RESPONSE_DATA_FIELD,
  decryptBackendResponse,
  decryptCustomPayload,
  decryptCustomTokenValue,
  encryptCustomPayload,
  encryptCustomToken,
  encodeString,
  decodeString,
} from '../customEncrypt';

const ENCRYPT_KEY = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

describe('customEncrypt', () => {
  beforeEach(() => {
    process.env.ENCRYPT_DECRYPT_KEY = ENCRYPT_KEY;
  });

  afterEach(() => {
    delete process.env.ENCRYPT_DECRYPT_KEY;
  });

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
});
