'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getPendingMutations, flushSyncQueue } from '@/lib/sync/offlineSync';

export function SyncStatusBadge() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    const updateCount = () => {
      setPendingCount(getPendingMutations().length);
    };

    updateCount();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const interval = setInterval(updateCount, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);

    try {
      await flushSyncQueue(async () => {
        // Simulation d'application réseau réussie
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
  };

  return (
    <div className="flex items-center gap-2">
      {!isOnline ? (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
          title="Vos modifications sont conservées localement et seront synchronisées à la reconnexion."
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Hors ligne ({pendingCount} en attente)</span>
        </span>
      ) : isSyncing ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          <span>Synchronisation...</span>
        </span>
      ) : justSynced ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>À jour</span>
        </span>
      ) : (
        <button
          onClick={triggerSync}
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50 transition-colors"
          title="Cliquez pour forcer la synchronisation avec le stockage distant"
        >
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>En ligne</span>
          {pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px]">
              {pendingCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
