import { describe, expect, it } from '@jest/globals';

import {
  PERMISSION_BACKEND_REQUEST_DATA_PAYLOAD,
  buildPermissionBackendExportUrl,
  buildPermissionBackendGetUrl,
  buildPermissionExportEncryptedQueryClient,
  buildPermissionListEncryptedQueryClient,
  readPermissionExportQueryFromRequest,
  readPermissionQueryFromRequest,
} from '../permissionEncryptedQuery';
import { decryptQueryPayload } from '../customEncryptClient';
import { decryptQueryPayload as decryptServerQueryPayload } from '../customEncrypt';

describe('permissionEncryptedQuery', () => {
  it('builds encrypted list query with role_id as query-string inside request_data', () => {
    const url = buildPermissionListEncryptedQueryClient(2);
    const params = new URLSearchParams(url.slice(1));

    expect(params.get('role_id')).toBeNull();
    expect(params.get('request_data')).toBeTruthy();
    expect(decryptQueryPayload(params)).toEqual({ role_id: '2' });
  });

  it('reads role_id from encrypted query-string request_data', () => {
    const url = buildPermissionListEncryptedQueryClient(3);
    const searchParams = new URLSearchParams(url.slice(1));

    expect(readPermissionQueryFromRequest(searchParams)).toEqual({ roleId: 3 });
  });

  it('reads role_id from plain query params (fallback)', () => {
    expect(readPermissionQueryFromRequest(new URLSearchParams('role_id=2'))).toEqual({
      roleId: 2,
    });
  });

  it('builds encrypted export query with query-string params inside request_data', () => {
    const url = buildPermissionExportEncryptedQueryClient({ roleId: 2, sortOrder: 'DESC' });
    const params = new URLSearchParams(url.slice(1));

    expect(params.get('role_id')).toBeNull();
    expect(decryptQueryPayload(params)).toEqual({
      role_id: '2',
      sort_by: 'menu_id',
      sort_order: 'DESC',
    });
  });

  it('reads export params from encrypted query string', () => {
    const url = buildPermissionExportEncryptedQueryClient({
      roleId: 2,
      sortBy: 'menu_id',
      sortOrder: 'DESC',
    });
    const searchParams = new URLSearchParams(url.slice(1));

    expect(readPermissionExportQueryFromRequest(searchParams)).toEqual({
      role_id: '2',
      sort_by: 'menu_id',
      sort_order: 'DESC',
    });
  });

  it('reads role_id from legacy JSON request_data (backward compatible)', () => {
    const token = '0m0r0m0m0n0r1z0Y1q1n1k1d1X1h1c0Y0w0Y0o0Y211a1r0o0r0r1M';
    expect(readPermissionQueryFromRequest(new URLSearchParams(`request_data=${token}`))).toEqual({
      roleId: 2,
    });
  });

  it('builds backend GET URL with plain role_id and empty request_data token', () => {
    const url = buildPermissionBackendGetUrl('http://localhost/api/v1/permissions', 2);
    const parsed = new URL(url);

    expect(parsed.searchParams.get('role_id')).toBe('2');
    expect(parsed.searchParams.get('request_data')).toBeTruthy();
    expect(decryptServerQueryPayload(parsed.searchParams)).toEqual({});
  });

  it('builds backend export URL with plain sort params and empty request_data token', () => {
    const url = buildPermissionBackendExportUrl('http://localhost/api/v1/permissions/export/excel', {
      role_id: '2',
      sort_by: 'menu_id',
      sort_order: 'DESC',
    });
    const parsed = new URL(url);

    expect(parsed.searchParams.get('role_id')).toBe('2');
    expect(parsed.searchParams.get('sort_order')).toBe('DESC');
    expect(decryptServerQueryPayload(parsed.searchParams)).toEqual({});
  });

  it('round-trips client encrypted query through BFF to backend plain role_id URL', () => {
    const clientUrl = buildPermissionListEncryptedQueryClient(2);
    const clientParams = new URLSearchParams(clientUrl.slice(1));
    const { roleId } = readPermissionQueryFromRequest(clientParams);

    expect(roleId).toBe(2);

    const backendUrl = buildPermissionBackendGetUrl('http://localhost/api/v1/permissions', roleId!);
    const backendParsed = new URL(backendUrl);

    expect(backendParsed.searchParams.get('role_id')).toBe('2');
    expect(decryptServerQueryPayload(backendParsed.searchParams)).toEqual({});
  });

  it('uses empty object for backend request_data payload', () => {
    expect(PERMISSION_BACKEND_REQUEST_DATA_PAYLOAD).toEqual({});
  });
});
