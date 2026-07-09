/**
 * UserApprovalCell
 * Compact approval status for the users table.
 */

import type { User } from '@/types/api/user';
import { getUserApprovalDisplay } from '@/lib/users/approvalLabels';
import { getApprovalStatusClassName } from '@/lib/approval';

export interface UserApprovalCellProps {
  user: User;
}

const TONE_CLASS: Record<ReturnType<typeof getUserApprovalDisplay>['tone'], string> = {
  pending: getApprovalStatusClassName('pending'),
  approved: getApprovalStatusClassName('approved'),
  rejected: getApprovalStatusClassName('rejected'),
  draft: getApprovalStatusClassName('draft'),
};

export function UserApprovalCell({ user }: UserApprovalCellProps) {
  const display = getUserApprovalDisplay(user.approval);

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
      {user.isPendingCreate && !user.approval?.hasPending ? (
        <p className="text-xs text-purple-700 pl-0.5">Awaiting approval</p>
      ) : null}
    </div>
  );
}
