'use client';

import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-[#000000] p-6">
      <div className="max-w-lg w-full p-8 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/10 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.12)] text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-[#FF3B30] flex items-center justify-center mx-auto border border-red-500/20">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Une interruption inattendue est survenue
          </h1>
          <p className="text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
            {error.message || "Impossible de charger la section demandée dans l'espace de travail."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="apple-btn-primary w-full sm:w-auto touch-target-44"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Réessayer</span>
          </button>
          
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.location.href = '/';
            }}
            className="apple-btn-secondary w-full sm:w-auto touch-target-44"
          >
            <Home className="w-4 h-4" />
            <span>Vue d'ensemble</span>
          </button>
        </div>
      </div>
    </main>
  );
}
