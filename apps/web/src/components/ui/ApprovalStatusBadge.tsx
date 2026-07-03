/**
 * ApprovalStatusBadge
 * Displays the maker-checker approval state for a list row.
 */

import type { ApprovalStatus } from '@/types/api';
import { getApprovalStatusClassName, getApprovalStatusLabel } from '@/lib/approval';

export interface ApprovalStatusBadgeProps {
  status?: ApprovalStatus;
}

export function ApprovalStatusBadge({ status = 'approved' }: ApprovalStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getApprovalStatusClassName(status)}`}
    >
      {getApprovalStatusLabel(status)}
    </span>
  );
}
