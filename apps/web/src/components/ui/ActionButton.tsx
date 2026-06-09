import { forwardRef } from 'react';
import { Button, type ButtonProps } from './Button';

export interface ActionButtonProps extends Omit<ButtonProps, 'variant'> {
  action: 'add' | 'edit' | 'delete';
  label?: string;
}

const actionConfig = {
  add: {
    variant: 'primary' as const,
    defaultLabel: 'Add',
    icon: (
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  edit: {
    variant: 'secondary' as const,
    defaultLabel: 'Edit',
    icon: (
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  delete: {
    variant: 'danger' as const,
    defaultLabel: 'Delete',
    icon: (
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
};

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ action, label, size = 'sm', className, children, ...props }, ref) => {
    const config = actionConfig[action];
    return (
      <Button
        ref={ref}
        variant={config.variant}
        size={size}
        className={className}
        {...props}
      >
        {config.icon}
        {children ?? label ?? config.defaultLabel}
      </Button>
    );
  }
);

ActionButton.displayName = 'ActionButton';
