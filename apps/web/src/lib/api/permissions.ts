/**
 * Page permission helpers
 *
 * Extracts the per-menu action permissions that the backend returns alongside
 * list/detail payloads. Defaults are deny-by-default so the UI never exposes an
 * action the API did not explicitly grant.
 */

import type { PagePermissions } from '@/types/api';

export const DEFAULT_PAGE_PERMISSIONS: PagePermissions = {
  menu: '',
  view: false,
  add: false,
  edit: false,
  delete: false,
  export: false,
  status: false,
};

type RawRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is RawRecord =>
  typeof value === 'object' && value !== null;

/**
 * Locate the `permissions` object regardless of how deeply the backend nests
 * its response (top-level, `data.permissions`, or `data.data.permissions`).
 */
function findPermissions(raw: unknown): RawRecord | null {
  if (!isRecord(raw)) {
    return null;
  }

  if (isRecord(raw.permissions)) {
    return raw.permissions;
  }

  if (isRecord(raw.data)) {
    return findPermissions(raw.data);
  }

  return null;
}

/**
 * Normalize an arbitrary API response into a fully-populated PagePermissions
 * object. Missing flags fall back to `false`.
 */
export function extractPagePermissions(raw: unknown): PagePermissions {
  const source = findPermissions(raw);

  if (!source) {
    return { ...DEFAULT_PAGE_PERMISSIONS };
  }

  return {
    menu: typeof source.menu === 'string' ? source.menu : '',
    view: source.view === true,
    add: source.add === true,
    edit: source.edit === true,
    delete: source.delete === true,
    export: source.export === true,
    status: source.status === true,
  };
}
