/**
 * ExportButton
 * Permission-gated export action for list page toolbars.
 */

import { Button } from './Button';

export interface ExportButtonProps {
  allowed: boolean;
  onExport: () => void;
  isLoading?: boolean;
  label?: string;
  className?: string;
}

export function ExportButton({
  allowed,
  onExport,
  isLoading = false,
  label = 'Export',
  className,
}: ExportButtonProps) {
  if (!allowed) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onExport}
      isLoading={isLoading}
      disabled={isLoading}
      className={className}
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
        />
      </svg>
      {label}
    </Button>
  );
}
