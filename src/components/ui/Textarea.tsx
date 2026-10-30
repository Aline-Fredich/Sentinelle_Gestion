'use client';

import React, { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      hint,
      error,
      required,
      id,
      className = '',
      wrapperClassName = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;

    return (
      <div className={`form-group flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="form-label text-xs font-semibold uppercase tracking-wider text-[var(--text)] select-none flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="req text-[var(--button-danger-bg)] ml-1 font-bold">*</span>}
            </span>
          </label>
        )}

        <div className="relative w-full">
          <textarea
            ref={ref}
            id={textareaId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : hintId}
            required={required}
            className={[
              'form-textarea w-full min-h-[90px] px-3 py-2 text-sm rounded-[var(--r-sm)]',
              'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]',
              'transition-all duration-150 resize-y',
              'placeholder:text-[var(--text-muted)]',
              'hover:border-[var(--border-strong)]',
              'focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error ? 'border-[var(--button-danger-bg)] focus:border-[var(--button-danger-bg)] focus:ring-[var(--button-danger-bg)]/20' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />
        </div>

        {error && (
          <p id={errorId} role="alert" className="form-error text-xs text-[var(--button-danger-bg)] flex items-center gap-1.5 mt-0.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
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

Textarea.displayName = 'Textarea';
