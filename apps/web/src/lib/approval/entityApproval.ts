/**
 * Shared approval normalization and display helpers for all modules.
 */

import type { ApprovalStatus } from '@/types/api';
import type { EntityApprovalInfo } from '@/types/api/approval';

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'New record',
  UPDATE: 'Update',
  DELETE: 'Delete',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeApprovalObject(raw: unknown): EntityApprovalInfo | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  return {
    hasPending: raw.hasPending === true,
    requestId: raw.requestId !== undefined ? Number(raw.requestId) : undefined,
    requestNo: raw.requestNo ? String(raw.requestNo) : undefined,
    action: raw.action ? String(raw.action) : undefined,
    status: raw.status ? String(raw.status) : undefined,
    makerId: raw.makerId !== undefined ? Number(raw.makerId) : undefined,
    makerName: raw.makerName ? String(raw.makerName) : undefined,
    makerEmail: raw.makerEmail ? String(raw.makerEmail) : undefined,
    submittedAt: raw.submittedAt ? String(raw.submittedAt) : undefined,
    changedFields: Array.isArray(raw.changedFields)
      ? raw.changedFields.map(String)
      : undefined,
    proposedData: isRecord(raw.proposedData) ? raw.proposedData : undefined,
    previousData: isRecord(raw.previousData) ? raw.previousData : undefined,
  };
}

export function resolveEntityApprovalStatus(approval?: EntityApprovalInfo): ApprovalStatus {
  if (!approval) {
    return 'approved';
  }
  if (approval.hasPending) {
    return 'pending';
  }
  const status = (approval.status ?? '').toUpperCase();
  if (status === 'PENDING') return 'pending';
  if (status === 'REJECTED') return 'rejected';
  if (status === 'APPROVED') return 'approved';
  return 'approved';
}

export function formatApprovalAction(action?: string): string | undefined {
  if (!action) return undefined;
  const key = action.trim().toUpperCase();
  return ACTION_LABELS[key] ?? action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
}

export interface EntityApprovalDisplay {
  title: string;
  subtitle?: string;
  tone: 'pending' | 'approved' | 'rejected' | 'draft';
}

export function getEntityApprovalDisplay(approval?: EntityApprovalInfo): EntityApprovalDisplay {
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

export function formatRecordStatus(status?: string): string {
  if (!status?.trim()) return '—';
  const normalized = status.trim().toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
