/**
 * Format approval previousData / proposedData for review modals.
 */

import { formatRecordStatus } from './entityApproval';

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
  description: 'Description',
  route: 'Route',
  sortOrder: 'Sort order',
  sort_order: 'Sort order',
  isActive: 'Active',
  is_active: 'Active',
  branch_name: 'Branch name',
  branch_code: 'Branch code',
  address: 'Address',
  parentId: 'Parent ID',
  parent_id: 'Parent ID',
};

const FIELD_ORDER = [
  'name',
  'email',
  'mobile',
  'description',
  'route',
  'roleName',
  'roleId',
  'status',
  'branchName',
  'branch_name',
  'branch_code',
  'branchId',
  'branchIds',
  'address',
  'sortOrder',
  'sort_order',
  'isActive',
  'is_active',
  'parentId',
  'parent_id',
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
  if (key === 'status') return formatRecordStatus(String(value));
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
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
