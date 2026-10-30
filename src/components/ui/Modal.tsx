'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'modal' | 'drawer';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hasUnsavedChanges?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  variant = 'modal',
  size = 'md',
  hasUnsavedChanges = false,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
}: ModalProps) {
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);
  const titleId = useId();
  const descId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Gérer la demande de fermeture avec garde anti-perte de données
  const handleRequestClose = React.useCallback(() => {
    if (hasUnsavedChanges) {
      setShowDiscardPrompt(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleConfirmDiscard = () => {
    setShowDiscardPrompt(false);
    onClose();
  };

  const handleCancelDiscard = () => {
    setShowDiscardPrompt(false);
  };

  // Focus trap & navigation clavier
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        e.preventDefault();
        if (showDiscardPrompt) {
          setShowDiscardPrompt(false);
        } else {
          handleRequestClose();
        }
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Verrouillage du scroll sur le body
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus sur le modal
    const timer = setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), textarea:not([disabled])'
      );
      firstFocusable?.focus();
    }, 60);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, closeOnEscape, showDiscardPrompt, handleRequestClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitle ? descId : undefined}
      className={[
        'fixed inset-0 z-[var(--z-modal)] flex',
        variant === 'drawer' ? 'justify-end' : 'items-center justify-center p-3 sm:p-5',
        'bg-black/60 backdrop-blur-sm transition-opacity duration-200 animate-fadeIn',
      ].join(' ')}
      onClick={closeOnBackdropClick ? handleRequestClose : undefined}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={[
          'bg-[var(--surface-raised)] border border-[var(--border-strong)] text-[var(--text)]',
          'flex flex-col shadow-2xl overflow-hidden focus:outline-none transition-transform',
          variant === 'drawer'
            ? 'h-full w-full max-w-2xl border-l border-y-0 border-r-0 shadow-[-12px_0_35px_rgba(0,0,0,0.45)] animate-slideInRight'
            : `w-full ${sizeClasses[size]} max-h-[92dvh] rounded-[var(--r-md)] animate-popIn`,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* En-tête de la modale */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--border)] bg-[var(--surface)] select-none">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-8 h-8 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--brand)] flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 id={titleId} className="text-sm font-bold uppercase tracking-wider text-[var(--text)] truncate">
                {title}
              </h2>
              {subtitle && (
                <p id={descId} className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestClose}
            aria-label="Fermer la boîte de dialogue"
            className="p-1.5 rounded-[var(--r-xs)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {children}
        </div>

        {/* Pied d'actions */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>

      {/* Boîte de confirmation anti-perte de saisie */}
      {showDiscardPrompt && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-[calc(var(--z-modal)+10)] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[var(--surface-raised)] border border-[var(--border-strong)] rounded-[var(--r-md)] p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--button-danger-bg)]/15 border border-[var(--button-danger-bg)]/30 flex items-center justify-center text-[var(--button-danger-bg)] flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide">
                  Modifications non enregistrées
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                  Vous avez effectué des modifications. Êtes-vous sûr de vouloir fermer sans enregistrer vos données ?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-[var(--border)]">
              <Button variant="secondary" size="sm" onClick={handleCancelDiscard}>
                Continuer la saisie
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmDiscard}>
                Abandonner
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
