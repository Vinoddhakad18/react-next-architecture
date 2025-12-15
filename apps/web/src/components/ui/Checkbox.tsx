/**
 * Checkbox Component
 * Base checkbox component
 */

import { cn } from '@/lib/utils/cn';
import { InputHTMLAttributes, forwardRef, useEffect, useRef } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, helperText, id, indeterminate, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const internalRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const input = (ref && typeof ref !== 'function' && ref.current) || internalRef.current;
      if (input) {
        input.indeterminate = indeterminate || false;
      }
    }, [indeterminate, ref]);

    const setRefs = (element: HTMLInputElement | null) => {
      internalRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = element;
      }
    };

    return (
      <div className="w-full">
        <div className="flex items-center">
          <input
            ref={setRefs}
            type="checkbox"
            id={checkboxId}
            className={cn(
              'w-4 h-4 text-purple-600 border-slate-300 rounded',
              'focus:ring-purple-500 focus:ring-2',
              error ? 'border-red-500' : '',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${checkboxId}-error` : helperText ? `${checkboxId}-helper` : undefined}
            {...props}
          />
          {label && (
            <label
              htmlFor={checkboxId}
              className="ml-2 text-sm font-medium text-slate-700"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p id={`${checkboxId}-error`} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${checkboxId}-helper`} className="mt-1 text-sm text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';



