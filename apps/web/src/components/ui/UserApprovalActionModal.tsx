/**
 * UserApprovalActionModal
 * Prompt for comment (approve) or reason (reject) before submitting.
 */

import { Button, Input, Modal } from '@/components/ui';

export interface UserApprovalActionModalProps {
  isOpen: boolean;
  type: 'approve' | 'reject' | null;
  comment: string;
  reason: string;
  error?: string | null;
  isSubmitting?: boolean;
  onCommentChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function UserApprovalActionModal({
  isOpen,
  type,
  comment,
  reason,
  error,
  isSubmitting = false,
  onCommentChange,
  onReasonChange,
  onClose,
  onSubmit,
}: UserApprovalActionModalProps) {
  const isApprove = type === 'approve';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isApprove ? 'Approve request' : 'Reject request'}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          {isApprove
            ? 'Add a comment before approving this request.'
            : 'Provide a reason for rejecting this request.'}
        </p>

        {isApprove ? (
          <Input
            label="Comment"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Approved"
            autoFocus
          />
        ) : (
          <Input
            label="Reason"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Enter rejection reason"
            autoFocus
          />
        )}

        {error ? <p className="text-sm text-rose-500">{error}</p> : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={isApprove ? 'primary' : 'outline'}
            className={!isApprove ? 'border-rose-300 text-rose-700 hover:bg-rose-50' : undefined}
            isLoading={isSubmitting}
            disabled={isSubmitting}
            onClick={onSubmit}
          >
            {isApprove ? 'Confirm approve' : 'Confirm reject'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
