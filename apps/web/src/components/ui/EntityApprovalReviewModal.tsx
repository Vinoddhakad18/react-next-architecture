/**
 * EntityApprovalReviewModal
 * Review pending changes with comparison table and approve/reject actions.
 */

import type { EntityApprovalInfo } from '@/types/api/approval';
import type { PagePermissions } from '@/types/api';
import { formatApprovalAction } from '@/lib/approval/entityApproval';
import { Button, Modal } from '@/components/ui';
import { EntityApprovalCompare } from './EntityApprovalCompare';

export interface EntityApprovalReviewModalProps {
  isOpen: boolean;
  approval?: EntityApprovalInfo;
  permissions: PagePermissions;
  emptyMessage?: string;
  onClose: () => void;
  onApprove: (requestId: number) => void;
  onReject: (requestId: number) => void;
}

export function EntityApprovalReviewModal({
  isOpen,
  approval,
  permissions,
  emptyMessage = 'No pending approval for this record.',
  onClose,
  onApprove,
  onReject,
}: EntityApprovalReviewModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={approval?.requestNo ? `Review ${approval.requestNo}` : 'Review changes'}
      size="lg"
    >
      {approval?.hasPending ? (
        <div className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Request type</p>
              <p className="text-slate-900">{formatApprovalAction(approval.action) ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Requested by</p>
              <p className="text-slate-900">{approval.makerName ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Submitted</p>
              <p className="text-slate-900">
                {approval.submittedAt
                  ? new Date(approval.submittedAt).toLocaleString()
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Fields changed</p>
              <p className="text-slate-900">
                {approval.changedFields?.length ? approval.changedFields.join(', ') : '—'}
              </p>
            </div>
          </div>

          <EntityApprovalCompare
            previousData={approval.previousData}
            proposedData={approval.proposedData}
            changedFields={approval.changedFields}
          />

          {approval.requestId && permissions.approval ? (
            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
              <Button
                variant="outline"
                className="border-rose-300 text-rose-700 hover:bg-rose-50"
                onClick={() => onReject(approval.requestId!)}
              >
                Reject
              </Button>
              <Button variant="primary" onClick={() => onApprove(approval.requestId!)}>
                Approve
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-slate-600">{emptyMessage}</p>
      )}
    </Modal>
  );
}
