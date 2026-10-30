'use client';

import React, { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      required,
      leftIcon,
      rightIcon,
      id,
      className = '',
      wrapperClassName = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className={`form-group flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="form-label text-xs font-semibold uppercase tracking-wider text-[var(--text)] select-none flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="req text-[var(--button-danger-bg)] ml-1 font-bold">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 pointer-events-none text-[var(--text-muted)] flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : hintId}
            required={required}
            className={[
              'form-input w-full min-h-[40px] px-3 py-2 text-sm rounded-[var(--r-sm)]',
              'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]',
              'transition-all duration-150',
              'placeholder:text-[var(--text-muted)]',
              'hover:border-[var(--border-strong)]',
              'focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error ? 'border-[var(--button-danger-bg)] focus:border-[var(--button-danger-bg)] focus:ring-[var(--button-danger-bg)]/20' : '',
              leftIcon ? 'pl-9' : '',
              rightIcon ? 'pr-9' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />

          {rightIcon && !error && (
            <div className="absolute right-3 pointer-events-none text-[var(--text-muted)] flex items-center justify-center">
              {rightIcon}
            </div>
          )}

          {error && (
            <div className="absolute right-3 pointer-events-none text-[var(--button-danger-bg)] flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} role="alert" className="form-error text-xs text-[var(--button-danger-bg)] flex items-center gap-1.5 mt-0.5 font-medium">
            <span>{error}</span>
          </p>
        )}

        {!error && hint && (
          <p id={hintId} className="form-hint text-[11px] text-[var(--text-muted)] mt-0.5">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
