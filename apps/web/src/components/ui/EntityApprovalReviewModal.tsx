/**
 * EntityApprovalReviewModal
 * Review pending or rejected changes with comparison table and approve/reject actions.
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

function ApprovalRequestDetails({ approval }: { approval: EntityApprovalInfo }) {
  return (
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
          {approval.submittedAt ? new Date(approval.submittedAt).toLocaleString() : '—'}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase text-slate-500">Fields changed</p>
        <p className="text-slate-900">
          {approval.changedFields?.length ? approval.changedFields.join(', ') : '—'}
        </p>
      </div>
    </div>
  );
}

function RejectedApprovalDetails({ approval }: { approval: EntityApprovalInfo }) {
  return (
    <>
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
            {approval.submittedAt ? new Date(approval.submittedAt).toLocaleString() : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Rejected by</p>
          <p className="text-slate-900">{approval.actionBy?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Rejected at</p>
          <p className="text-slate-900">
            {approval.actionBy?.actedAt
              ? new Date(approval.actionBy.actedAt).toLocaleString()
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

      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
        <p className="text-xs font-medium uppercase text-rose-700">Rejection reason</p>
        <p className="mt-1 text-slate-900">
          {approval.rejectionReason ?? approval.actionBy?.comment ?? '—'}
        </p>
      </div>
    </>
  );
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
          <ApprovalRequestDetails approval={approval} />

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
      ) : approval?.hasRejected ? (
        <div className="space-y-4 text-sm">
          <RejectedApprovalDetails approval={approval} />

          <EntityApprovalCompare
            previousData={approval.previousData}
            proposedData={approval.proposedData}
            changedFields={approval.changedFields}
          />
        </div>
      ) : (
        <p className="text-sm text-slate-600">{emptyMessage}</p>
      )}
    </Modal>
  );
}
