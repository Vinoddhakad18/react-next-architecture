/**
 * User-module approval display labels.
 */

import type { UserApprovalInfo } from '@/types/api/user';

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'New user',
  UPDATE: 'Update',
  DELETE: 'Delete',
};

/** Human-readable label for approval.action (CREATE, UPDATE, …). */
export function formatApprovalAction(action?: string): string | undefined {
  if (!action) return undefined;
  const key = action.trim().toUpperCase();
  return ACTION_LABELS[key] ?? action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
}

export interface UserApprovalDisplay {
  title: string;
  subtitle?: string;
  tone: 'pending' | 'approved' | 'rejected' | 'draft';
}

/** Compact approval copy for the users table (avoids redundant “Pending Approval” + “UPDATE pending”). */
export function getUserApprovalDisplay(approval?: UserApprovalInfo): UserApprovalDisplay {
  if (!approval?.hasPending) {
    return { title: 'Approved', tone: 'approved' };
  }

  const action = formatApprovalAction(approval.action);
  return {
    title: action ? `${action} pending` : 'Pending review',
    subtitle: approval.requestNo,
    tone: 'pending',
  };
}

/** Title-case user status for display (ACTIVE → Active). */
export function formatUserStatus(status?: string): string {
  if (!status?.trim()) return '—';
  const normalized = status.trim().toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
