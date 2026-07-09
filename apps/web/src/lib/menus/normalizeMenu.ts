import { resolveApprovalStatus } from '@/lib/approval';
import { normalizeApprovalObject, resolveEntityApprovalStatus } from '@/lib/approval/entityApproval';
import { pickField, toBooleanFlag } from '@/lib/api/fieldAccess';
import type { Menu } from '@/types/api';

export function normalizeMenu(menu: Record<string, unknown>): Menu {
  const isActive = Boolean(menu.is_active ?? menu.isActive ?? true);
  const approval = normalizeApprovalObject(menu.approval);
  return {
    id: Number(menu.id),
    name: String(menu.name ?? ''),
    slug: menu.slug ? String(menu.slug) : undefined,
    route: menu.route ? String(menu.route) : undefined,
    description: menu.description ? String(menu.description) : undefined,
    sortOrder: Number(menu.sort_order ?? menu.sortOrder ?? 0),
    isActive,
    approval,
    isPendingCreate: toBooleanFlag(pickField(menu, 'isPendingCreate', 'is_pending_create')),
    approvalStatus: approval
      ? resolveEntityApprovalStatus(approval)
      : resolveApprovalStatus(
          menu.approval_status ?? menu.approvalStatus,
          menu.is_active ?? menu.isActive
        ),
    parentId:
      menu.parent_id !== undefined
        ? Number(menu.parent_id)
        : menu.parentId !== undefined
          ? Number(menu.parentId)
          : null,
    createdAt: String(menu.created_at ?? menu.createdAt ?? new Date().toISOString()),
    updatedAt: String(menu.updated_at ?? menu.updatedAt ?? new Date().toISOString()),
  };
}
