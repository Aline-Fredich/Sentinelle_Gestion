'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, X, CheckCircle } from 'lucide-react';
import { useSentinel } from '@/lib/store';

export function OnboardingBanner() {
  const { resetToFactoryData, projects, tasks } = useSentinel();
  const [isDismissed, setIsDismissed] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('sentinel_onboarding_dismissed');
      setIsDismissed(dismissed === 'true');
    } catch {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('sentinel_onboarding_dismissed', 'true');
    } catch {
      // Ignore
    }
  };

  const handleRestoreDemo = () => {
    resetToFactoryData();
    setFeedbackMsg('Données de démonstration rétablies avec succès.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  if (isDismissed) return null;

  return (
    <div className="panel border-[var(--red-soft)] shadow-[var(--glow-sm)] animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-[var(--r-xs)] border border-[var(--red)] bg-[var(--red-tint)] text-[var(--red)] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--red)] font-mono">
                BIENVENUE SUR SENTINEL GESTION
              </span>
              <span className="badge badge-role text-[9px]">
                GUIDE DE DÉMARRAGE
              </span>
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-0.5">
              Votre espace de travail est prêt pour vos projets d’équipe
            </h3>
            <p className="text-xs text-[var(--white-70)] mt-1 max-w-2xl">
              Vous explorez actuellement le projet exemple (<strong className="text-white font-mono">{projects.length} projet</strong>, <strong className="text-white font-mono">{tasks.length} tâches</strong>). Vous pouvez manipuler librement ces données ou les réinitialiser à tout moment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleRestoreDemo}
            className="btn btn-secondary btn-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[var(--red)]" />
            <span>RÉINITIALISER LA DÉMO</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Masquer le message de bienvenue"
            className="btn btn-ghost btn-icon btn-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="mt-3 flex items-center gap-2 text-xs text-white font-mono">
          <CheckCircle className="w-3.5 h-3.5 text-[var(--red)]" />
          <span>{feedbackMsg}</span>
        </div>
      )}
    </div>
  );
}
