'use client';

import React from 'react';
import { Check, Laptop } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { THEMES, THEME_ORDER, type ThemePreference } from '@/lib/theme';

interface AppearanceSelectorProps {
  layout?: 'grid' | 'stack';
  onSelect?: (themeId: ThemePreference) => void;
  showDescriptions?: boolean;
}

export function AppearanceSelector({
  layout = 'grid',
  onSelect,
  showDescriptions = true,
}: AppearanceSelectorProps) {
  const { preference, theme: activeTheme, setTheme } = useTheme();

  const handleSelect = (pref: ThemePreference) => {
    setTheme(pref);
    if (onSelect) {
      onSelect(pref);
    }
  };

  return (
    <div className="space-y-4">
      <div
        role="radiogroup"
        aria-label="Sélection du thème de fond de l'application"
        className={
          layout === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
            : 'flex flex-col gap-3'
        }
      >
        {THEME_ORDER.map((id) => {
          const item = THEMES[id];
          const isSelected = preference === id || (preference === 'auto' && activeTheme === id);

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-testid={`card-theme-${id}`}
              onClick={() => handleSelect(id)}
              className={`group relative text-left p-4 rounded-xl transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] select-none flex flex-col justify-between ${
                isSelected
                  ? 'border-2 border-[var(--brand)] shadow-lg bg-[var(--surface)]'
                  : 'border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--brand)]/60'
              }`}
            >
              {/* Mini-maquette représentative de l'interface dans ce thème */}
              <div
                className="w-full h-24 rounded-lg p-2.5 mb-3 flex flex-col justify-between overflow-hidden shadow-inner border border-black/15 relative"
                style={{ backgroundColor: item.colors.bg }}
              >
                {/* Mini Topbar */}
                <div
                  className="w-full h-4 rounded px-2 flex items-center justify-between"
                  style={{ backgroundColor: item.colors.surface, borderBottom: `1px solid ${item.colors.border}` }}
                >
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.colors.brand }} />
                    <span className="w-8 h-1 rounded" style={{ backgroundColor: item.colors.textMuted }} />
                  </div>
                  <div
                    className="w-8 h-2.5 rounded text-[7px] font-bold flex items-center justify-center font-ui"
                    style={{
                      backgroundColor: item.colors.buttonPrimaryBg,
                      color: item.colors.buttonPrimaryText,
                    }}
                  >
                    Action
                  </div>
                </div>

                {/* Mini Panneaux / Cartes */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div
                    className="h-9 rounded p-1 flex flex-col justify-between"
                    style={{
                      backgroundColor: item.colors.surface,
                      border: `1px solid ${item.colors.border}`,
                    }}
                  >
                    <span className="w-10 h-1.5 rounded" style={{ backgroundColor: item.colors.text }} />
                    <span className="w-6 h-1 rounded" style={{ backgroundColor: item.colors.textMuted }} />
                  </div>
                  <div
                    className="h-9 rounded p-1 flex flex-col justify-between"
                    style={{
                      backgroundColor: item.colors.surface2,
                      border: `1px solid ${item.colors.border}`,
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.colors.brand }} />
                      <span className="w-6 h-1.5 rounded" style={{ backgroundColor: item.colors.text }} />
                    </div>
                    <span className="w-8 h-1 rounded" style={{ backgroundColor: item.colors.textMuted }} />
                  </div>
                </div>
              </div>

              {/* Titre et statut */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold font-ui text-[var(--text)]">
                    {item.label}
                  </span>
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-[var(--brand)]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Actif
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      Choisir
                    </span>
                  )}
                </div>

                {showDescriptions && (
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Option Automatique (Système) */}
      <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--brand)]">
            <Laptop className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--text)]">
              Option Système : Bascule automatique selon l’heure et vos préférences
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              Aligne automatiquement le thème Blanc le jour ou Bleu de nuit le soir selon `prefers-color-scheme`.
            </div>
          </div>
        </div>
        <button
          type="button"
          data-testid="btn-system-auto"
          onClick={() => handleSelect('auto')}
          className={`btn btn-sm ${
            preference === 'auto'
              ? 'btn-primary'
              : 'btn-secondary'
          }`}
        >
          {preference === 'auto' ? 'Automatique activé' : 'Activer l’Automatique'}
        </button>
      </div>
    </div>
  );
}
