/**
 * usePagePermissions Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { usePagePermissions } from '../usePagePermissions';
import { DEFAULT_PAGE_PERMISSIONS } from '@/lib/api';

describe('usePagePermissions', () => {
  it('defaults to deny-by-default', () => {
    const { result } = renderHook(() => usePagePermissions());
    expect(result.current.permissions).toEqual(DEFAULT_PAGE_PERMISSIONS);
  });

  it('merges initial overrides', () => {
    const { result } = renderHook(() => usePagePermissions({ view: true, add: true }));
    expect(result.current.permissions.view).toBe(true);
    expect(result.current.permissions.add).toBe(true);
    expect(result.current.permissions.delete).toBe(false);
  });

  it('setFromResponse extracts granted permissions from a raw API response', () => {
    const { result } = renderHook(() => usePagePermissions());

    act(() => {
      result.current.setFromResponse({
        data: { data: [], meta: {} },
        permissions: {
          menu: '/admin/roles',
          view: true,
          add: true,
          edit: true,
          delete: false,
          export: false,
          status: false,
        },
      });
    });

    expect(result.current.permissions.add).toBe(true);
    expect(result.current.permissions.edit).toBe(true);
    expect(result.current.permissions.delete).toBe(false);
  });

  it('setFromResponse falls back to deny-by-default when permissions are missing', () => {
    const { result } = renderHook(() => usePagePermissions({ add: true }));

    act(() => {
      result.current.setFromResponse({ data: { data: [] } });
    });

    expect(result.current.permissions).toEqual(DEFAULT_PAGE_PERMISSIONS);
  });

  it('setPermissions replaces state', () => {
    const { result } = renderHook(() => usePagePermissions());

    act(() => {
      result.current.setPermissions({ ...DEFAULT_PAGE_PERMISSIONS, edit: true });
    });

    expect(result.current.permissions.edit).toBe(true);
  });

  it('keeps a stable setFromResponse identity across renders (no refetch loop)', () => {
    const { result, rerender } = renderHook(() => usePagePermissions());
    const first = result.current.setFromResponse;
    rerender();
    expect(result.current.setFromResponse).toBe(first);
  });

  it('resetPermissions restores the initial state', () => {
    const { result } = renderHook(() => usePagePermissions({ add: true }));

    act(() => {
      result.current.setPermissions({ ...DEFAULT_PAGE_PERMISSIONS, add: true, edit: true });
    });
    act(() => {
      result.current.resetPermissions();
    });

    expect(result.current.permissions.add).toBe(true);
    expect(result.current.permissions.edit).toBe(false);
  });
});
