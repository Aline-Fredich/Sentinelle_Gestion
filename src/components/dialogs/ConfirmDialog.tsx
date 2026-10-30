'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'CONFIRMER',
  cancelLabel = 'ANNULER',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap & navigation clavier (Escape pour fermer)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timeout = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="modal-overlay"
      onClick={onCancel}
    >
      <div 
        className="modal max-w-md w-full border border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--text)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)] mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-[var(--r-sm)] border flex items-center justify-center ${
              variant === 'danger'
                ? 'border-[var(--button-danger-bg)]/40 bg-[var(--button-danger-bg)]/15 text-[var(--button-danger-bg)]'
                : 'border-[var(--brand)]/40 bg-[var(--brand)]/15 text-[var(--brand)]'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="modal-title mb-0">
                {title.toUpperCase()}
              </h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            aria-label="Fermer la boîte de dialogue"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p id="confirm-dialog-desc" className="text-xs text-[var(--text-muted)] leading-relaxed">
          {message}
        </p>

        <div className="modal-actions pt-4 border-t border-[var(--border)] mt-4">
          <Button
            ref={cancelBtnRef}
            variant="secondary"
            size="sm"
            onClick={onCancel}
          >
            {cancelLabel.toUpperCase()}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel.toUpperCase()}
          </Button>
        </div>
      </div>
    </div>
  );
}
