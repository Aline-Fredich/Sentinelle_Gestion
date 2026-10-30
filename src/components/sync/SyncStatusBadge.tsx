'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, WifiOff, Wifi } from 'lucide-react';
import { getPendingMutations, flushSyncQueue } from '@/lib/sync/offlineSync';
import { Badge } from '@/components/ui/Badge';

export function SyncStatusBadge() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  const triggerSync = useCallback(async (_isSilent = false) => {
    if (typeof window === 'undefined') return;
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);

    try {
      await flushSyncQueue(async () => {
        // Envoi au backend ou stockage distant
        await new Promise(r => setTimeout(r, 200));
        return true;
      });
      setPendingCount(getPendingMutations().length);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
    } catch (err) {
      console.error('Erreur de synchronisation:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    const updateCount = () => {
      setPendingCount(getPendingMutations().length);
    };

    updateCount();

    const handleOnline = () => {
      setIsOnline(true);
      // Reconnexion : synchronisation automatique silencieuse en arrière-plan avec confirmation
      triggerSync(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const interval = setInterval(updateCount, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [triggerSync]);

  return (
    <div className="flex items-center gap-2">
      {!isOnline ? (
        <Badge
          variant="danger"
          size="sm"
          pulse
          className="cursor-help"
          title="Mode hors-ligne : modifications conservées localement et synchronisées à la reconnexion"
        >
          <span className="flex items-center gap-1.5">
            <WifiOff className="w-3 h-3 text-red-400" />
            <span>HORS LIGNE{pendingCount > 0 ? ` (${pendingCount})` : ''}</span>
          </span>
        </Badge>
      ) : isSyncing ? (
        <Badge
          variant="info"
          size="sm"
          pulse
          title="Synchronisation en cours avec le stockage distant"
        >
          <span className="flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 animate-spin text-[var(--brand)]" />
            <span>SYNCHRONISATION...</span>
          </span>
        </Badge>
      ) : justSynced ? (
        <Badge
          variant="success"
          size="sm"
          title="Toutes vos données sont synchronisées"
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>À JOUR</span>
          </span>
        </Badge>
      ) : (
        <button
          onClick={() => triggerSync(false)}
          type="button"
          className="focus:outline-none focus:ring-2 focus:ring-[var(--brand)] rounded-full transition-transform active:scale-95 cursor-pointer"
          title="Cliquez pour forcer la synchronisation avec le stockage distant"
        >
          <Badge
            variant={pendingCount > 0 ? 'warning' : 'success'}
            size="sm"
          >
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>EN LIGNE{pendingCount > 0 ? ` (${pendingCount})` : ''}</span>
            </span>
          </Badge>
        </button>
      )}
    </div>
  );
}
