/**
 * Shared maker-checker approval types for all admin modules.
 */

import type { ApprovalStatus } from './common';

export interface ApprovalActionBy {
  userId?: number;
  name?: string;
  email?: string;
  action?: string;
  actedAt?: string;
  comment?: string;
}

export interface EntityApprovalInfo {
  hasPending: boolean;
  hasRejected?: boolean;
  requestId?: number;
  requestNo?: string;
  action?: string;
  status?: string;
  rejectionReason?: string;
  actionBy?: ApprovalActionBy;
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
