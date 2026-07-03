/**
 * Approval workflow helpers
 *
 * Normalizes backend approval/status fields into a consistent ApprovalStatus
 * so UI components can gate approve/reject actions uniformly.
 */

import type { ApprovalStatus } from '@/types/api';

const PENDING_VALUES = new Set([
  'pending',
  'pending_approval',
  'awaiting_approval',
  'unapproved',
  'not_approved',
]);
const REJECTED_VALUES = new Set(['rejected', 'declined']);
const APPROVED_VALUES = new Set(['approved', 'active', 'enabled']);
const DRAFT_VALUES = new Set(['draft', 'inactive', 'disabled']);

function normalizeToken(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().toLowerCase();
}

function isExplicitlyApproved(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

function isExplicitlyUnapproved(value: unknown): boolean {
  return value === false || value === 0 || value === '0';
}

/**
 * Whether approve/reject actions should be offered for this row.
 */
export function needsApprovalAction(status: ApprovalStatus): boolean {
  return status === 'pending' || status === 'draft' || status === 'rejected';
}

/**
 * @deprecated Use needsApprovalAction for button visibility.
 */
export function isPendingApproval(status: ApprovalStatus): boolean {
  return needsApprovalAction(status);
}

/**
 * Resolve an entity's approval state from explicit or implicit backend fields.
 */
export function resolveApprovalStatus(
  raw: unknown,
  fallbackStatus?: unknown,
  options?: { isApproved?: unknown }
): ApprovalStatus {
  if (isExplicitlyUnapproved(raw) || isExplicitlyUnapproved(options?.isApproved)) {
    return 'pending';
  }
  if (isExplicitlyApproved(raw) || isExplicitlyApproved(options?.isApproved)) {
    return 'approved';
  }

  const token = normalizeToken(raw);
  if (token) {
    if (PENDING_VALUES.has(token)) return 'pending';
    if (REJECTED_VALUES.has(token)) return 'rejected';
    if (APPROVED_VALUES.has(token)) return 'approved';
    if (DRAFT_VALUES.has(token)) return 'draft';
  }

  const fallback = normalizeToken(fallbackStatus);
  if (!token) {
    // No explicit approval_status — derive from record status
    if (!fallback) return 'pending';
    if (PENDING_VALUES.has(fallback)) return 'pending';
    if (REJECTED_VALUES.has(fallback)) return 'rejected';
    if (APPROVED_VALUES.has(fallback)) return 'approved';
    if (DRAFT_VALUES.has(fallback)) return 'draft';
    return 'pending';
  }

  return 'approved';
}

export function getApprovalStatusLabel(status: ApprovalStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending Approval';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'draft':
    default:
      return 'Draft';
  }
}

export function getApprovalStatusClassName(status: ApprovalStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'draft':
    default:
      return 'bg-slate-100 text-slate-700';
  }
}
