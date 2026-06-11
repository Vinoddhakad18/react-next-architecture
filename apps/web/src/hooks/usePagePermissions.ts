/**
 * usePagePermissions Hook
 *
 * Holds the current page's per-action permissions (view/add/edit/delete/
 * export/status). Permissions are returned by list/detail endpoints, so a page
 * typically calls `setPermissions(extractPagePermissions(response.data))` after
 * fetching its data.
 *
 * Defaults to deny-by-default: every action is hidden until the API grants it.
 */

import { useCallback, useState } from 'react';
import { DEFAULT_PAGE_PERMISSIONS, extractPagePermissions } from '@/lib/api';
import type { PagePermissions } from '@/types/api';

interface UsePagePermissionsReturn {
  permissions: PagePermissions;
  setPermissions: (permissions: PagePermissions) => void;
  /** Convenience: derive permissions straight from a raw API response. */
  setFromResponse: (raw: unknown) => void;
  resetPermissions: () => void;
}

export function usePagePermissions(
  initial?: Partial<PagePermissions>
): UsePagePermissionsReturn {
  const [permissions, setPermissions] = useState<PagePermissions>({
    ...DEFAULT_PAGE_PERMISSIONS,
    ...initial,
  });

  const setFromResponse = useCallback((raw: unknown) => {
    setPermissions(extractPagePermissions(raw));
  }, []);

  const resetPermissions = useCallback(() => {
    setPermissions({ ...DEFAULT_PAGE_PERMISSIONS, ...initial });
  }, [initial]);

  return { permissions, setPermissions, setFromResponse, resetPermissions };
}
