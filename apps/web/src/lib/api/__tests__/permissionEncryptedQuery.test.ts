import { describe, expect, it } from '@jest/globals';

import {
  PERMISSION_REQUEST_DATA_PAYLOAD,
  buildPermissionExportEncryptedQueryClient,
  buildPermissionExportQueryString,
  buildPermissionListQueryString,
  readPermissionExportQueryFromRequest,
  readPermissionQueryFromRequest,
} from '../permissionEncryptedQuery';

describe('permissionEncryptedQuery', () => {
  it('builds plain role_id query string for list GET', () => {
    expect(buildPermissionListQueryString(2)).toBe('?role_id=2');
  });

  it('reads role_id from plain query params', () => {
    expect(readPermissionQueryFromRequest(new URLSearchParams('role_id=2'))).toEqual({
      roleId: 2,
    });
  });

  it('builds plain export query string', () => {
    expect(buildPermissionExportQueryString({ roleId: 2 })).toBe(
      '?role_id=2&sort_by=menu_id&sort_order=ASC'
    );
  });

  it('export URL has plain role_id/sort params plus request_data (menus-style token)', () => {
    const url = buildPermissionExportEncryptedQueryClient({ roleId: 2 });
    const params = new URLSearchParams(url.slice(1));

    expect(params.get('role_id')).toBe('2');
    expect(params.get('sort_by')).toBe('menu_id');
    expect(params.get('sort_order')).toBe('ASC');
    expect(params.get('request_data')).toBeTruthy();
  });

  it('reads export params from plain query string', () => {
    expect(
      readPermissionExportQueryFromRequest(
        new URLSearchParams('role_id=2&sort_by=menu_id&sort_order=DESC&request_data=abc')
      )
    ).toEqual({
      role_id: '2',
      sort_by: 'menu_id',
      sort_order: 'DESC',
    });
  });

  it('uses empty object for request_data payload', () => {
    expect(PERMISSION_REQUEST_DATA_PAYLOAD).toEqual({});
  });
});
