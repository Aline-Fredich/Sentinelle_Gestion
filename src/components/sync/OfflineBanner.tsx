'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CloudUpload, X } from 'lucide-react';
import { getPendingMutations } from '@/lib/sync/offlineSync';
import { Badge } from '@/components/ui/Badge';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    setPendingCount(getPendingMutations().length);

    let toastTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setDismissed(false);
      setShowReconnectedToast(true);
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        setShowReconnectedToast(false);
      }, 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setDismissed(false);
      setPendingCount(getPendingMutations().length);
    };

    const interval = setInterval(() => {
      setPendingCount(getPendingMutations().length);
    }, 3000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      if (toastTimer) clearTimeout(toastTimer);
    };
  }, []);

  // Notification temporaire de reconnexion réussie
  if (showReconnectedToast) {
    return (
      <aside
        aria-live="polite"
        role="status"
        className="w-full bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-xs text-emerald-400 transition-all duration-300 animate-in fade-in"
      >
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">
            Connexion internet rétablie — Vos données ont été synchronisées automatiquement avec succès.
          </span>
          <Badge variant="success" size="xs" label="RÉTABLI" className="ml-2" />
        </div>
        <button
          onClick={() => setShowReconnectedToast(false)}
          className="text-emerald-400/70 hover:text-emerald-400 p-1"
          aria-label="Fermer la notification de reconnexion"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  // Si en ligne ou banni dismissée par l'utilisateur pour cette session déconnectée
  if (isOnline || dismissed) {
    return null;
  }

  return (
    <aside
      role="alert"
      aria-live="assertive"
      className="w-full bg-[var(--surface-2)] border-b border-amber-500/40 px-4 py-2 flex items-center justify-between text-xs text-[var(--text)] shadow-sm transition-all duration-300 animate-in slide-in-from-top-1"
    >
      <div className="flex items-center gap-3 max-w-7xl mx-auto w-full">
        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
          <WifiOff className="w-3.5 h-3.5" />
        </div>

        <div className="flex-1 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-amber-400 uppercase tracking-wide text-[11px]">
            Mode Hors-Ligne Actif
          </span>
          <span className="text-[var(--text-muted)] text-[11px] hidden sm:inline">
            — Vos modifications sont stockées localement en toute sécurité et seront synchronisées automatiquement dès le retour du réseau.
          </span>
          {pendingCount > 0 && (
            <Badge
              variant="warning"
              size="xs"
              pulse
              label={`${pendingCount} modification${pendingCount > 1 ? 's' : ''} en attente`}
              className="ml-auto sm:ml-2"
            />
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setDismissed(true)}
            className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded transition-colors"
            title="Masquer le bandeau hors-ligne"
            aria-label="Masquer le bandeau"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
