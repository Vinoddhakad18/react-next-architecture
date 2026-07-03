/**
 * RowActions
 * Permission-gated row actions: edit, delete, approve/reject, and status toggle.
 *
 * Approve/Reject buttons appear only when `permissions.approval` is granted and the
 * row's `approvalStatus` is `pending`. Status toggle appears when `permissions.status`
 * is granted and `onToggleStatus` is provided.
 */

import type { ReactNode } from 'react';
import { ActionButton } from './ActionButton';
import { Button } from './Button';
import type { ApprovalStatus, PagePermissions } from '@/types/api';
import { needsApprovalAction } from '@/lib/approval';

export interface RowActionsProps {
  permissions: Pick<PagePermissions, 'edit' | 'delete' | 'approval' | 'status'>;
  onEdit?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onToggleStatus?: () => void;
  /** Current maker-checker state for this row. */
  approvalStatus?: ApprovalStatus;
  /** Whether the entity is currently active (for status toggle label). */
  isActive?: boolean;
  /** Extra guard layered on top of `permissions.edit` (default: true). */
  canEdit?: boolean;
  /** Extra guard layered on top of `permissions.delete` (default: true). */
  canDelete?: boolean;
  /** Extra guard layered on top of `permissions.approval` (default: true). */
  canApprove?: boolean;
  /** Shows action buttons in a loading + disabled state. */
  actionLoading?: boolean;
  /** When true and approval actions are shown, hide edit/delete/status to reduce clutter. */
  approvalOnly?: boolean;
  approveLabel?: string;
  rejectLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  statusToggleLabel?: string;
  /** Rendered when no action is available (default: an em dash). */
  emptyFallback?: ReactNode;
  className?: string;
}

export function RowActions({
  permissions,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onToggleStatus,
  approvalStatus,
  isActive = true,
  canEdit = true,
  canDelete = true,
  canApprove = true,
  actionLoading = false,
  approvalOnly = false,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  approveLabel = 'Approve',
  rejectLabel = 'Reject',
  statusToggleLabel,
  emptyFallback,
  className = 'flex items-center gap-2 flex-wrap',
}: RowActionsProps) {
  const showEdit = permissions.edit && canEdit && Boolean(onEdit);
  const showDelete = permissions.delete && canDelete && Boolean(onDelete);
  const showApproval =
    permissions.approval &&
    canApprove &&
    needsApprovalAction(approvalStatus ?? 'pending') &&
    Boolean(onApprove || onReject);
  const showStatusToggle = permissions.status && Boolean(onToggleStatus) && !(approvalOnly && showApproval);
  const showEditAction = showEdit && !(approvalOnly && showApproval);
  const showDeleteAction = showDelete && !(approvalOnly && showApproval);

  const hasAnyAction = showEditAction || showDeleteAction || showApproval || showStatusToggle;

  return (
    <div className={className}>
      {showEditAction && (
        <ActionButton
          type="button"
          action="edit"
          size="sm"
          onClick={onEdit}
          disabled={actionLoading}
        >
          {editLabel}
        </ActionButton>
      )}
      {showApproval && onApprove && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onApprove}
          isLoading={actionLoading}
          disabled={actionLoading}
        >
          {approveLabel}
        </Button>
      )}
      {showApproval && onReject && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReject}
          disabled={actionLoading}
          className="border-rose-300 text-rose-700 hover:bg-rose-50"
        >
          {rejectLabel}
        </Button>
      )}
      {showStatusToggle && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleStatus}
          isLoading={actionLoading}
          disabled={actionLoading}
        >
          {statusToggleLabel ?? (isActive ? 'Deactivate' : 'Activate')}
        </Button>
      )}
      {showDeleteAction && (
        <ActionButton
          type="button"
          action="delete"
          size="sm"
          onClick={onDelete}
          isLoading={actionLoading}
          disabled={actionLoading}
        >
          {deleteLabel}
        </ActionButton>
      )}
      {!hasAnyAction && (emptyFallback ?? <span className="text-sm text-slate-400">—</span>)}
    </div>
  );
}
