'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-3 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Chargement de l'espace SENTINEL GESTION...
        </span>
      </div>
    </div>
  );
}
