/**
 * EntityApprovalCell
 * Compact approval status for admin module tables.
 */

import type { EntityApprovalInfo } from '@/types/api/approval';
import { getEntityApprovalDisplay } from '@/lib/approval/entityApproval';
import { getApprovalStatusClassName } from '@/lib/approval';

export interface EntityApprovalCellProps {
  approval?: EntityApprovalInfo;
  isPendingCreate?: boolean;
}

const TONE_CLASS: Record<ReturnType<typeof getEntityApprovalDisplay>['tone'], string> = {
  pending: getApprovalStatusClassName('pending'),
  approved: getApprovalStatusClassName('approved'),
  rejected: getApprovalStatusClassName('rejected'),
  draft: getApprovalStatusClassName('draft'),
};

export function EntityApprovalCell({ approval, isPendingCreate }: EntityApprovalCellProps) {
  const display = getEntityApprovalDisplay(approval);

  return (
    <div className="space-y-0.5">
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${TONE_CLASS[display.tone]}`}
      >
        {display.title}
      </span>
      {display.subtitle ? (
        <p className="text-xs text-slate-500 font-mono pl-0.5">{display.subtitle}</p>
      ) : null}
      {isPendingCreate && !approval?.hasPending ? (
        <p className="text-xs text-purple-700 pl-0.5">Awaiting approval</p>
      ) : null}
    </div>
  );
}
