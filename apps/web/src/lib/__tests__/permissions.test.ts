/**
 * extractPagePermissions Tests
 */

import { extractPagePermissions, DEFAULT_PAGE_PERMISSIONS } from '../api/permissions';

const granted = {
  menu: '/admin/roles',
  view: true,
  add: true,
  edit: true,
  delete: true,
  export: true,
  status: true,
};

describe('extractPagePermissions', () => {
  it('reads permissions from a top-level field (raw roles/users/menus body)', () => {
    const raw = { success: true, message: 'ok', data: { data: [], pagination: {} }, permissions: granted };
    expect(extractPagePermissions(raw)).toEqual(granted);
  });

  it('reads permissions nested under data (normalized branch response)', () => {
    const raw = { data: { data: [], meta: {}, permissions: granted } };
    expect(extractPagePermissions(raw)).toEqual(granted);
  });

  it('reads permissions sitting beside an array data field', () => {
    const raw = { data: [], permissions: granted };
    expect(extractPagePermissions(raw)).toEqual(granted);
  });

  it('returns deny-by-default when permissions are absent', () => {
    expect(extractPagePermissions({ data: { data: [], meta: {} } })).toEqual(DEFAULT_PAGE_PERMISSIONS);
  });

  it('returns deny-by-default for null, undefined, or non-objects', () => {
    expect(extractPagePermissions(null)).toEqual(DEFAULT_PAGE_PERMISSIONS);
    expect(extractPagePermissions(undefined)).toEqual(DEFAULT_PAGE_PERMISSIONS);
    expect(extractPagePermissions('nope')).toEqual(DEFAULT_PAGE_PERMISSIONS);
    expect(extractPagePermissions(42)).toEqual(DEFAULT_PAGE_PERMISSIONS);
  });

  it('coerces non-boolean / partial flags to false (no privilege escalation)', () => {
    const raw = { permissions: { menu: '/x', view: true, add: true, edit: 'yes', delete: 1 } };
    expect(extractPagePermissions(raw)).toEqual({
      menu: '/x',
      view: true,
      add: true,
      edit: false,
      delete: false,
      export: false,
      status: false,
    });
  });

  it('defaults menu to empty string when missing or non-string', () => {
    expect(extractPagePermissions({ permissions: { add: true } }).menu).toBe('');
    expect(extractPagePermissions({ permissions: { menu: 123, add: true } }).menu).toBe('');
  });

  it('returns a fresh object so the default is never mutated', () => {
    const first = extractPagePermissions(null);
    first.add = true;
    const second = extractPagePermissions(null);
    expect(second.add).toBe(false);
    expect(DEFAULT_PAGE_PERMISSIONS.add).toBe(false);
  });
});
