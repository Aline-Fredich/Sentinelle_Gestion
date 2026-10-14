'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, RotateCcw, X, CheckCircle, ArrowRight, Shield } from 'lucide-react';
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
    <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/60 dark:from-[#0F172A] dark:via-[#131E36] dark:to-[#0F172A] border border-blue-200/80 dark:border-blue-900/50 shadow-sm animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#0066FF] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0066FF] dark:text-blue-400">
                Bienvenue sur SENTINEL GESTION
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[#0066FF] dark:text-blue-300 text-[10px] font-semibold">
                Guide de démarrage
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              Votre espace de travail est prêt pour vos projets d’équipe
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Vous explorez actuellement le projet exemple (<strong>{projects.length} projet</strong>, <strong>{tasks.length} tâches</strong>). Vous pouvez manipuler librement ces données ou les réinitialiser à tout moment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleRestoreDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>Réinitialiser la démo</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Masquer le message de bienvenue"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{feedbackMsg}</span>
        </div>
      )}
    </div>
  );
}
