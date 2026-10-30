'use client';

import React, { useEffect, useRef } from 'react';
import { Palette, X, Check, Laptop, Sparkles, Shield } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { THEMES, THEME_ORDER } from '@/lib/theme';

interface AppearancePopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppearancePopover({ isOpen, onClose }: AppearancePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { preference, theme: activeTheme, setTheme, themeData, appearance, setAppearance } = useTheme();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Sélection de l'apparence et du thème de fond"
      className="absolute right-0 top-12 w-80 sm:w-92 rounded-lg p-4 z-50 animate-in fade-in zoom-in-95 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-[var(--shadow)] max-h-[85vh] overflow-y-auto"
      style={{
        boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 20px var(--brand)`,
      }}
    >
      {/* En-tête */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[var(--brand)]" />
          <span className="text-xs font-bold uppercase font-mono tracking-wider">
            Apparence & Thèmes
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded hover:bg-[var(--surface-2)] transition"
          aria-label="Fermer le panneau des thèmes"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* SECTION 1 : STYLE D'APPARENCE GLOBALE (« Noir · Rouge · Blanc » vs Standard) */}
      <div className="mb-4 pb-3 border-b border-[var(--border)]">
        <div className="text-[11px] font-bold uppercase font-mono tracking-wider text-[var(--brand)] mb-1 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>Style d’apparence globale</span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] mb-2.5">
          Sélectionnez l’univers visuel complet du logiciel :
        </p>
        <div className="grid grid-cols-2 gap-2">
          {/* Option A : Standard */}
          <button
            type="button"
            data-testid="btn-appearance-default"
            onClick={() => setAppearance('default')}
            className={`p-2.5 rounded-md border text-left transition flex flex-col justify-between ${
              appearance === 'default'
                ? 'border-[var(--brand)] bg-[var(--surface-2)] shadow-sm'
                : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/60 hover:bg-[var(--surface-2)]'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-xs font-bold leading-tight">Standard</span>
              {appearance === 'default' && <Check className="w-3.5 h-3.5 text-[var(--brand)] stroke-[3]" />}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] leading-tight">
              Classique cobalt & saphir
            </div>
          </button>

          {/* Option B : Noir · Rouge · Blanc */}
          <button
            type="button"
            data-testid="btn-appearance-sentinel-rouge"
            onClick={() => setAppearance('sentinel_rouge')}
            className={`p-2.5 rounded-md border text-left transition flex flex-col justify-between relative overflow-hidden ${
              appearance === 'sentinel_rouge'
                ? 'border-[#FF0000] bg-[#050505] shadow-[0_0_16px_rgba(255,0,0,0.35)]'
                : 'border-[var(--border)] bg-[var(--surface)] hover:border-[#FF0000]/60 hover:bg-[var(--surface-2)]'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-xs font-bold leading-tight text-[#FF2A2A]">Noir · Rouge</span>
              {appearance === 'sentinel_rouge' && <Check className="w-3.5 h-3.5 text-[#FF0000] stroke-[3]" />}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] leading-tight">
              Design Sentinelle technique
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 2 : THÈMES DE FOND */}
      <div className="text-[11px] font-bold uppercase font-mono tracking-wider text-[var(--text)] mb-1 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" />
        <span>Thème de fond</span>
      </div>
      <p className="text-[11px] text-[var(--text-muted)] mb-2.5">
        Ajustez la tonalité de fond du logiciel :
      </p>

      {/* Liste des 4 thèmes avec pastille de couleur, libellé et coche */}
      <div className="space-y-2 mb-3" role="radiogroup" aria-label="Thèmes de fond">
        {THEME_ORDER.map((id) => {
          const item = THEMES[id];
          const isSelected = preference === id || (preference === 'auto' && activeTheme === id);

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-testid={`btn-theme-${id}`}
              onClick={() => {
                setTheme(id);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-md border transition-all text-left ${
                isSelected
                  ? 'border-[var(--brand)] bg-[var(--surface-2)] shadow-sm'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/60 hover:bg-[var(--surface-2)]'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Pastille de couleur (Fond + Surface + Accent) */}
                <div
                  className="w-7 h-7 rounded-full border border-black/20 flex items-center justify-center shadow-inner relative overflow-hidden shrink-0"
                  style={{ backgroundColor: item.colors.bg }}
                  title={item.label}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/20"
                    style={{ backgroundColor: item.colors.brand }}
                  />
                </div>

                <div>
                  <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                    <span>{item.label}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] font-normal">
                      ({item.shortLabel})
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {item.description}
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-[var(--brand)] text-[var(--brand-contrast)] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}

        {/* Option 5 : Automatique (système) */}
        <button
          type="button"
          role="radio"
          aria-checked={preference === 'auto'}
          data-testid="btn-theme-auto"
          onClick={() => setTheme('auto')}
          className={`w-full flex items-center justify-between p-2.5 rounded-md border transition-all text-left ${
            preference === 'auto'
              ? 'border-[var(--brand)] bg-[var(--surface-2)] shadow-sm'
              : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/60 hover:bg-[var(--surface-2)]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--brand)] shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">
                Automatique (système)
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Aligne Blanc le jour ou Bleu de nuit selon vos réglages système.
              </div>
            </div>
          </div>
          {preference === 'auto' && (
            <div className="w-5 h-5 rounded-full bg-[var(--brand)] text-[var(--brand-contrast)] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}
        </button>
      </div>

      {/* Raccourci clavier et état mémorisé */}
      <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[10px] font-bold">
            Alt+T
          </kbd>
          <span>Thème suivant</span>
        </span>
        <span className="text-[10px] text-[var(--brand)] font-bold uppercase">
          {themeData.label} actif
        </span>
      </div>
    </div>
  );
}
