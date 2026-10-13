'use client';

import React from 'react';
import { SentinelProvider } from '@/lib/store';
import { AppShell } from '@/components/shell/AppShell';

export default function Page() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#080E1A] text-slate-200">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold tracking-wide">
              Initialisation de SENTINEL GESTION...
            </span>
          </div>
        </div>
      }
    >
      <SentinelProvider>
        <AppShell />
      </SentinelProvider>
    </React.Suspense>
  );
}
