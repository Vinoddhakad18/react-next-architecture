/**
 * Shared maker-checker approval types for all admin modules.
 */

import type { ApprovalStatus } from './common';

export interface EntityApprovalInfo {
  hasPending: boolean;
  requestId?: number;
  requestNo?: string;
  action?: string;
  status?: string;
  makerId?: number;
  makerName?: string;
  makerEmail?: string;
  submittedAt?: string;
  changedFields?: string[];
  proposedData?: Record<string, unknown>;
  previousData?: Record<string, unknown>;
}

export interface ApprovableRecord {
  approvalStatus?: ApprovalStatus;
  approval?: EntityApprovalInfo;
  isPendingCreate?: boolean;
}

export interface ApprovalApproveRequest {
  comment: string;
}

export interface ApprovalRejectRequest {
  reason: string;
}
