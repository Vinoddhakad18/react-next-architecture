/**
 * useEntityWorkflow Hook
 *
 * Shared approve / reject / status-toggle / export handlers for admin list pages.
 * Each action is only invoked when the corresponding service method is provided.
 */

import { useCallback, useState } from 'react';

type WorkflowResult = { success: boolean; error?: { message: string } | null };

export interface EntityWorkflowConfig {
  onRefresh: () => Promise<void>;
  onError?: (message: string) => void;
  approve?: (id: number | string) => Promise<WorkflowResult>;
  reject?: (id: number | string) => Promise<WorkflowResult>;
  toggleStatus?: (id: number | string, active: boolean) => Promise<WorkflowResult>;
  exportData?: () => Promise<WorkflowResult>;
}

export function useEntityWorkflow({
  onRefresh,
  onError,
  approve,
  reject,
  toggleStatus,
  exportData,
}: EntityWorkflowConfig) {
  const [workflowLoadingId, setWorkflowLoadingId] = useState<number | string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const runAction = useCallback(
    async (id: number | string, action?: (id: number | string) => Promise<WorkflowResult>) => {
      if (!action) return;

      setWorkflowLoadingId(id);
      try {
        const result = await action(id);
        if (result.success) {
          await onRefresh();
        } else {
          onError?.(result.error?.message || 'Action failed');
        }
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setWorkflowLoadingId(null);
      }
    },
    [onRefresh, onError]
  );

  const handleApprove = useCallback(
    (id: number | string) => runAction(id, approve),
    [runAction, approve]
  );

  const handleReject = useCallback(
    (id: number | string) => runAction(id, reject),
    [runAction, reject]
  );

  const handleToggleStatus = useCallback(
    async (id: number | string, active: boolean) => {
      if (!toggleStatus) return;

      setWorkflowLoadingId(id);
      try {
        const result = await toggleStatus(id, active);
        if (result.success) {
          await onRefresh();
        } else {
          onError?.(result.error?.message || 'Failed to update status');
        }
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setWorkflowLoadingId(null);
      }
    },
    [toggleStatus, onRefresh, onError]
  );

  const handleExport = useCallback(async () => {
    if (!exportData) return;

    setIsExporting(true);
    try {
      const result = await exportData();
      if (!result.success) {
        onError?.(result.error?.message || 'Export failed');
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [exportData, onError]);

  return {
    workflowLoadingId,
    isExporting,
    handleApprove,
    handleReject,
    handleToggleStatus,
    handleExport,
  };
}
