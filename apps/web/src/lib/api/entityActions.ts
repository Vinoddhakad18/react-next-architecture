/**
 * Shared entity workflow API helpers (approve, reject, status toggle, export).
 */

import { apiClient } from './client';
import { apiConfig, getAuthHeader } from './config';
import type { ApiError } from '@/types/api';

type ActionResult = { success: boolean; error?: ApiError | null };

export async function approveEntity(endpoint: string): Promise<ActionResult> {
  const result = await apiClient.post<{ success?: boolean; message?: string }>(endpoint, {}, { auth: true });
  return { success: result.success, error: result.error };
}

export async function rejectEntity(endpoint: string, reason?: string): Promise<ActionResult> {
  const result = await apiClient.post<{ success?: boolean; message?: string }>(
    endpoint,
    reason ? { reason } : {},
    { auth: true }
  );
  return { success: result.success, error: result.error };
}

export async function toggleEntityStatus(endpoint: string, active: boolean): Promise<ActionResult> {
  const result = await apiClient.patch<{ success?: boolean; message?: string }>(
    endpoint,
    { status: active ? 'active' : 'inactive' },
    { auth: true }
  );
  return { success: result.success, error: result.error };
}

/**
 * Download a CSV/Excel export from the backend.
 */
export async function downloadEntityExport(endpoint: string, filename: string): Promise<ActionResult> {
  try {
    const response = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        Accept: 'application/octet-stream, text/csv, application/vnd.ms-excel',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      let message = 'Export failed';
      try {
        const data = await response.json();
        message = data.message || message;
      } catch {
        // response may not be JSON
      }
      return { success: false, error: { message, status: response.status } };
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: {
        message: err instanceof Error ? err.message : 'Export failed',
        status: 0,
      },
    };
  }
}
