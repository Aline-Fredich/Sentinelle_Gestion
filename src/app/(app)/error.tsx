'use client';

import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#FF1E27] flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Une interruption inattendue est survenue
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {error.message || "Impossible de charger la section demandée dans l'espace de travail."}
          </p>
        </div>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066FF] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-md transition"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Réessayer</span>
        </button>
      </div>
    </div>
  );
}
