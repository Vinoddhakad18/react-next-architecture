/**
 * Shared approval normalization and display helpers for all modules.
 */

import {
  pickField,
  pickNumber,
  pickRecord,
  pickString,
  pickStringArray,
  toBooleanFlag,
} from '@/lib/api/fieldAccess';
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

  const hasPending =
    toBooleanFlag(pickField(raw, 'hasPending', 'has_pending')) ||
    String(pickString(raw, 'status') ?? '').toUpperCase() === 'PENDING';

  return {
    hasPending,
    requestId: pickNumber(raw, 'requestId', 'request_id'),
    requestNo: pickString(raw, 'requestNo', 'request_no'),
    action: pickString(raw, 'action'),
    status: pickString(raw, 'status'),
    makerId: pickNumber(raw, 'makerId', 'maker_id'),
    makerName: pickString(raw, 'makerName', 'maker_name'),
    makerEmail: pickString(raw, 'makerEmail', 'maker_email'),
    submittedAt: pickString(raw, 'submittedAt', 'submitted_at'),
    changedFields: pickStringArray(raw, 'changedFields', 'changed_fields'),
    proposedData: pickRecord(raw, 'proposedData', 'proposed_data'),
    previousData: pickRecord(raw, 'previousData', 'previous_data'),
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
