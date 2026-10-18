'use client';

import React from 'react';

export function ViewLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* En-tête skeleton */}
      <div className="p-6 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-black/5 dark:border-white/5 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-6 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* Cartes KPI skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-black/5 dark:border-white/5 space-y-3">
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Zone centrale skeleton */}
      <div className="p-6 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-black/5 dark:border-white/5 min-h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#0071E3] border-t-transparent animate-spin" />
          <span className="text-xs font-medium text-slate-400">Chargement du module...</span>
        </div>
      </div>
    </div>
  );
}
