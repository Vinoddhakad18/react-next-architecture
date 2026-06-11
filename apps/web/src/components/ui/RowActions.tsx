/**
 * RowActions
 * Permission-gated Edit/Delete actions for a table row.
 *
 * Renders the Edit button only when `permissions.edit` is granted and an
 * `onEdit` handler is provided, the Delete button only when `permissions.delete`
 * is granted, `onDelete` is provided, and the optional `canDelete` guard passes
 * (used e.g. to protect the super_admin role). When no action is available it
 * falls back to a neutral placeholder so the column never collapses.
 */

import type { ReactNode } from 'react';
import { ActionButton } from './ActionButton';
import type { PagePermissions } from '@/types/api';

export interface RowActionsProps {
  permissions: Pick<PagePermissions, 'edit' | 'delete'>;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Extra guard layered on top of `permissions.edit` (default: true). */
  canEdit?: boolean;
  /** Extra guard layered on top of `permissions.delete` (default: true). */
  canDelete?: boolean;
  /** Shows the delete button in a loading + disabled state. */
  deleteLoading?: boolean;
  editLabel?: string;
  deleteLabel?: string;
  /** Rendered when neither action is available (default: an em dash). */
  emptyFallback?: ReactNode;
  className?: string;
}

export function RowActions({
  permissions,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  deleteLoading = false,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  emptyFallback,
  className = 'flex items-center gap-2',
}: RowActionsProps) {
  const showEdit = permissions.edit && canEdit && Boolean(onEdit);
  const showDelete = permissions.delete && canDelete && Boolean(onDelete);

  return (
    <div className={className}>
      {showEdit && (
        <ActionButton type="button" action="edit" size="sm" onClick={onEdit}>
          {editLabel}
        </ActionButton>
      )}
      {showDelete && (
        <ActionButton
          type="button"
          action="delete"
          size="sm"
          onClick={onDelete}
          isLoading={deleteLoading}
          disabled={deleteLoading}
        >
          {deleteLabel}
        </ActionButton>
      )}
      {!showEdit && !showDelete && (emptyFallback ?? <span className="text-sm text-slate-400">—</span>)}
    </div>
  );
}
