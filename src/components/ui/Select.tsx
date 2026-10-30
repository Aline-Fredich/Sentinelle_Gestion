'use client';

import React, { forwardRef, useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  options?: SelectOption[];
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      hint,
      error,
      required,
      options,
      children,
      id,
      className = '',
      wrapperClassName = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div className={`form-group flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="form-label text-xs font-semibold uppercase tracking-wider text-[var(--text)] select-none flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="req text-[var(--button-danger-bg)] ml-1 font-bold">*</span>}
            </span>
          </label>
        )}

        <div className="relative w-full flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : hintId}
            required={required}
            className={[
              'form-select w-full min-h-[40px] pl-3 pr-10 py-2 text-sm rounded-[var(--r-sm)] appearance-none',
              'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]',
              'transition-all duration-150 cursor-pointer',
              'hover:border-[var(--border-strong)]',
              'focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error ? 'border-[var(--button-danger-bg)] focus:border-[var(--button-danger-bg)] focus:ring-[var(--button-danger-bg)]/20' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="bg-[var(--surface-raised)] text-[var(--text)]"
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute right-3 pointer-events-none text-[var(--text-muted)] flex items-center justify-center">
            <ChevronDown className="w-4 h-4 opacity-75" />
          </div>
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

Select.displayName = 'Select';
