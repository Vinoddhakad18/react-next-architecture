/**
 * Normalizes branch API records (snake_case or camelCase).
 */

import { resolveApprovalStatus } from '@/lib/approval';
import { normalizeApprovalObject, resolveEntityApprovalStatus } from '@/lib/approval/entityApproval';
import { pickField, toBooleanFlag } from '@/lib/api/fieldAccess';
import type { Branch } from '@/types/api/branch';

export function normalizeBranch(branch: Record<string, unknown>): Branch {
  const approval = normalizeApprovalObject(branch.approval);
  return {
    id: Number(branch.id),
    branchName: String(branch.branch_name ?? branch.branchName ?? branch.name ?? ''),
    branchCode: String(branch.branch_code ?? branch.branchCode ?? branch.code ?? ''),
    address: String(branch.address ?? ''),
    status: String(branch.status ?? ''),
    approval,
    isPendingCreate:
      toBooleanFlag(pickField(branch, 'isPendingCreate', 'is_pending_create')),
    approvalStatus: approval
      ? resolveEntityApprovalStatus(approval)
      : resolveApprovalStatus(
          branch.approval_status ?? branch.approvalStatus,
          branch.status
        ),
  };
}
