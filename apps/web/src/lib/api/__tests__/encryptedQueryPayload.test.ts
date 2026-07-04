import { describe, expect, it } from '@jest/globals';

import {
  parseEncryptedQueryPayload,
  serializeEncryptedQueryPayload,
} from '../encryptedQueryPayload';

describe('encryptedQueryPayload', () => {
  it('serializes list params as query-string', () => {
    expect(
      serializeEncryptedQueryPayload({
        page: '1',
        per_page: '10',
        sort_by: 'name',
        sort_order: 'ASC',
      })
    ).toBe('page=1&per_page=10&sort_by=name&sort_order=ASC');
  });

  it('serializes role_id as query-string', () => {
    expect(serializeEncryptedQueryPayload('role_id=2')).toBe('role_id=2');
  });

  it('keeps empty object as {} for backend token', () => {
    expect(serializeEncryptedQueryPayload({})).toBe('{}');
  });

  it('parses query-string decrypted payload', () => {
    expect(parseEncryptedQueryPayload('role_id=2&sort_by=menu_id')).toEqual({
      role_id: '2',
      sort_by: 'menu_id',
    });
  });

  it('parses legacy JSON decrypted payload', () => {
    expect(parseEncryptedQueryPayload({ role_id: '2', sort_by: 'menu_id' })).toEqual({
      role_id: '2',
      sort_by: 'menu_id',
    });
  });
});
