/**
 * Normalizes category API records (snake_case or camelCase).
 */

import { resolveApprovalStatus } from '@/lib/approval';
import { normalizeApprovalObject, resolveEntityApprovalStatus } from '@/lib/approval/entityApproval';
import { pickField, toBooleanFlag } from '@/lib/api/fieldAccess';
import type { Category } from '@/types/api/category';

export function normalizeCategory(category: Record<string, unknown>): Category {
  const isActive = Boolean(category.status ?? category.is_active ?? category.isActive ?? true);
  const approval = normalizeApprovalObject(category.approval);
  const parentIdRaw = category.parent_id ?? category.parentId;

  return {
    id: Number(category.id),
    name: String(category.name ?? ''),
    code: String(category.code ?? ''),
    description: category.description ? String(category.description) : undefined,
    parentId:
      parentIdRaw === null || parentIdRaw === undefined || parentIdRaw === ''
        ? null
        : Number(parentIdRaw),
    parentName: category.parent_name
      ? String(category.parent_name)
      : category.parentName
        ? String(category.parentName)
        : undefined,
    isActive,
    approval,
    isPendingCreate:
      toBooleanFlag(pickField(category, 'isPendingCreate', 'is_pending_create')),
    approvalStatus: approval
      ? resolveEntityApprovalStatus(approval)
      : resolveApprovalStatus(
          category.approval_status ?? category.approvalStatus,
          category.status ?? category.is_active
        ),
    createdAt: String(category.created_at ?? category.createdAt ?? new Date().toISOString()),
    updatedAt: String(category.updated_at ?? category.updatedAt ?? new Date().toISOString()),
  };
}

export function normalizeCategoryRecord(category: Record<string, unknown>) {
  const parentIdRaw = category.parent_id ?? category.parentId;

  return {
    id: category.id,
    name: category.name,
    code: category.code,
    description: category.description,
    parentId:
      parentIdRaw === null || parentIdRaw === undefined || parentIdRaw === ''
        ? null
        : Number(parentIdRaw),
    parentName: category.parent_name ?? category.parentName,
    isActive: category.is_active ?? category.isActive ?? true,
    createdAt: category.created_at || category.createdAt || new Date().toISOString(),
    updatedAt: category.updated_at || category.updatedAt || new Date().toISOString(),
  };
}
