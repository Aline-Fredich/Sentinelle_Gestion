'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function ServiceWorkerRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Enregistrement du Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.debug('Service Worker non actif:', err);
        });
      });
    }

    // Écoute de l'événement d'installation PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Vérifier si l'utilisateur n'a pas déjà rejeté la bannière
      const dismissed = localStorage.getItem('sentinel_pwa_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('sentinel_pwa_dismissed', 'true');
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm p-4 bg-[#050505] border border-[var(--red-soft)] rounded-[var(--r-md)] shadow-[var(--glow-card)] animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--r-xs)] bg-black border border-[var(--red)] flex items-center justify-center text-[var(--red)] shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">INSTALLER SENTINEL GESTION</h4>
            <p className="text-[11px] text-[var(--white-70)] mt-0.5">Accédez à vos projets directement depuis votre écran d’accueil et hors-ligne.</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Fermer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-[var(--line)]">
        <button
          onClick={handleDismiss}
          className="btn btn-ghost btn-sm text-[11px]"
        >
          PLUS TARD
        </button>
        <button
          onClick={handleInstallClick}
          className="btn btn-primary btn-sm"
        >
          INSTALLER L’APPLICATION
        </button>
      </div>
    </div>
  );
}
