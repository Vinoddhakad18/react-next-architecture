/**
 * Shared approve/reject API calls for module approval workflows.
 */

import { apiClient } from './client';

type ActionResult = { success: boolean; error?: { message: string; status?: number } | null };

export async function postApprovalApprove(
  endpoint: string,
  comment: string
): Promise<ActionResult> {
  const result = await apiClient.post<{ success?: boolean; message?: string }>(
    endpoint,
    { comment: comment.trim() },
    { auth: true }
  );
  return { success: result.success, error: result.error };
}

export async function postApprovalReject(
  endpoint: string,
  reason: string
): Promise<ActionResult> {
  const result = await apiClient.post<{ success?: boolean; message?: string }>(
    endpoint,
    { reason: reason.trim() },
    { auth: true }
  );
  return { success: result.success, error: result.error };
}
