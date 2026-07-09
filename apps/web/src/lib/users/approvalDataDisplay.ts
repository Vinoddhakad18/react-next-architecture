/**
 * Format user approval previousData / proposedData for the review modal.
 */

import { formatUserStatus } from './approvalLabels';

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  mobile: 'Mobile',
  roleId: 'Role ID',
  roleName: 'Role',
  status: 'Status',
  branchId: 'Branch ID',
  branchName: 'Branch',
  branchIds: 'Branches',
};

const FIELD_ORDER = [
  'name',
  'email',
  'mobile',
  'roleName',
  'roleId',
  'status',
  'branchName',
  'branchId',
  'branchIds',
];

export interface ApprovalDataRow {
  key: string;
  label: string;
  current: string;
  requested: string;
  changed: boolean;
}

function formatFieldValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (key === 'status') return formatUserStatus(String(value));
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function sortKeys(keys: Iterable<string>): string[] {
  return [...keys].sort((a, b) => {
    const ai = FIELD_ORDER.indexOf(a);
    const bi = FIELD_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

/** Build rows for the approval review table from API previousData / proposedData. */
export function buildApprovalDataRows(
  previousData?: Record<string, unknown>,
  proposedData?: Record<string, unknown>,
  changedFields?: string[]
): ApprovalDataRow[] {
  const previous = previousData ?? {};
  const proposed = proposedData ?? {};
  const changedSet = new Set(changedFields ?? []);

  const keys = sortKeys(
    new Set([
      ...Object.keys(previous),
      ...Object.keys(proposed),
      ...changedSet,
    ])
  );

  return keys.map((key) => {
    const hasPrevious = Object.prototype.hasOwnProperty.call(previous, key);
    const hasProposed = Object.prototype.hasOwnProperty.call(proposed, key);
    const current = hasPrevious ? formatFieldValue(key, previous[key]) : '—';
    const requested = hasProposed ? formatFieldValue(key, proposed[key]) : '—';
    const changed =
      changedSet.has(key) ||
      (hasPrevious && hasProposed && current !== requested);

    return {
      key,
      label: FIELD_LABELS[key] ?? key,
      current,
      requested,
      changed,
    };
  });
}
