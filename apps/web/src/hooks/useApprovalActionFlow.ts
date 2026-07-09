/**
 * Shared approve/reject dialog flow for all admin modules.
 * Approve sends `{ comment }`, reject sends `{ reason }`.
 */

import { useCallback, useState } from 'react';

type ActionResult = { success: boolean; error?: { message: string } | null };

export interface ApprovalActionHandlers {
  approveRequest: (requestId: number, comment: string) => Promise<ActionResult>;
  rejectRequest: (requestId: number, reason: string) => Promise<ActionResult>;
}

export function useApprovalActionFlow({
  onRefresh,
  onError: _onError,
  approveRequest,
  rejectRequest,
  onComplete,
}: ApprovalActionHandlers & {
  onRefresh: () => Promise<void>;
  onError?: (message: string) => void;
  onComplete?: () => void;
}) {
  const [approvalAction, setApprovalAction] = useState<{
    requestId: number;
    type: 'approve' | 'reject';
  } | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [approvalActionError, setApprovalActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openApprovalAction = useCallback((requestId: number, type: 'approve' | 'reject') => {
    setApprovalAction({ requestId, type });
    setApprovalActionError(null);
    if (type === 'approve') {
      setApprovalComment('');
    } else {
      setRejectReason('');
    }
  }, []);

  const closeApprovalAction = useCallback(() => {
    setApprovalAction(null);
    setApprovalActionError(null);
    setApprovalComment('');
    setRejectReason('');
  }, []);

  const submitApprovalAction = useCallback(async () => {
    if (!approvalAction) return;

    const { requestId, type } = approvalAction;

    if (type === 'approve' && !approvalComment.trim()) {
      setApprovalActionError('Comment is required');
      return;
    }
    if (type === 'reject' && !rejectReason.trim()) {
      setApprovalActionError('Reason is required');
      return;
    }

    setIsSubmitting(true);
    setApprovalActionError(null);

    try {
      const result =
        type === 'approve'
          ? await approveRequest(requestId, approvalComment.trim())
          : await rejectRequest(requestId, rejectReason.trim());

      if (result.success) {
        closeApprovalAction();
        onComplete?.();
        await onRefresh();
      } else {
        setApprovalActionError(result.error?.message || 'Action failed');
      }
    } catch (err) {
      setApprovalActionError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    approvalAction,
    approvalComment,
    rejectReason,
    approveRequest,
    rejectRequest,
    closeApprovalAction,
    onComplete,
    onRefresh,
  ]);

  return {
    approvalAction,
    approvalComment,
    rejectReason,
    approvalActionError,
    isSubmitting,
    openApprovalAction,
    closeApprovalAction,
    submitApprovalAction,
    setApprovalComment,
    setRejectReason,
  };
}

/** Combines review modal state with approve/reject comment/reason flow. */
export function useModuleApprovalUi<T extends { approval?: { requestId?: number; hasPending?: boolean } }>({
  onRefresh,
  onError,
  approveRequest,
  rejectRequest,
}: ApprovalActionHandlers & {
  onRefresh: () => Promise<void>;
  onError?: (message: string) => void;
}) {
  const [reviewItem, setReviewItem] = useState<T | null>(null);

  const flow = useApprovalActionFlow({
    onRefresh,
    onError,
    approveRequest,
    rejectRequest,
    onComplete: () => setReviewItem(null),
  });

  return { reviewItem, setReviewItem, ...flow };
}
