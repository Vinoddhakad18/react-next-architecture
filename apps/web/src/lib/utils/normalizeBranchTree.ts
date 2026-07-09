/**
 * Normalizes branch tree API payloads (snake_case, camelCase, or `name`/`code`).
 */

import type { BranchTreeNode } from '@/types/api/branch';

function branchNameFrom(node: Record<string, unknown>): string {
  return String(node.branch_name ?? node.branchName ?? node.name ?? '');
}

function branchCodeFrom(node: Record<string, unknown>): string {
  return String(node.branch_code ?? node.branchCode ?? node.code ?? '');
}

export function normalizeBranchTreeNode(node: Record<string, unknown>): BranchTreeNode {
  const children = Array.isArray(node.children)
    ? node.children.map((child) => normalizeBranchTreeNode(child as Record<string, unknown>))
    : [];

  return {
    id: Number(node.id),
    branchName: branchNameFrom(node),
    branchCode: branchCodeFrom(node),
    address: String(node.address ?? ''),
    parentId:
      node.parent_id != null
        ? Number(node.parent_id)
        : node.parentId != null
          ? Number(node.parentId)
          : null,
    status: String(node.status ?? ''),
    children,
  };
}

export function normalizeBranchTree(nodes: unknown): BranchTreeNode[] {
  if (!Array.isArray(nodes)) {
    return [];
  }

  return nodes.map((node) => normalizeBranchTreeNode(node as Record<string, unknown>));
}

export function extractBranchTreePayload(payload: unknown): BranchTreeNode[] {
  if (Array.isArray(payload)) {
    return normalizeBranchTree(payload);
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.data)) {
      return normalizeBranchTree(record.data);
    }

    if (record.data && typeof record.data === 'object') {
      return extractBranchTreePayload(record.data);
    }
  }

  return [];
}
