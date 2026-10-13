'use client';

import React, { useState } from 'react';
import { X, Share2, Copy, Check, Trash2, Mail, ShieldCheck } from 'lucide-react';
import { useSentinel } from '@/lib/store';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { currentProject, shares, addProjectShare, revokeProjectShare } = useSentinel();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const projectShares = currentProject ? shares.filter(s => s.projectId === currentProject.id) : [];

  const handleAddShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !currentProject) return;
    addProjectShare(currentProject.id, email.trim(), permission);
    setEmail('');
  };

  const handleCopyLink = () => {
    if (!currentProject) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}?view=project_sheet&projectId=${currentProject.id}&shareToken=token-${currentProject.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0066FF]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 id="share-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Partager le projet
              </h3>
              <p className="text-xs text-slate-500">
                {currentProject?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Fermer la modale"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire d'invitation sécurisée */}
        <form onSubmit={handleAddShare} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Inviter un collaborateur externe ou auditeur
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="auditeur@cabinet-partenaire.fr"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
              className="px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="view">Lecture seule</option>
              <option value="edit">Modification</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-blue-600 rounded-xl transition shadow-md shadow-blue-500/20"
          >
            Accorder l’accès sécurisé
          </button>
        </form>

        {/* Liste des partages persistés avec révocation */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Accès actifs ({projectShares.length})
          </span>
          {projectShares.length === 0 ? (
            <p className="text-xs text-slate-400 py-2 text-center">Aucun accès externe actif pour ce projet</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {projectShares.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0066FF]" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[200px]">
                        {s.sharedWithEmail}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {s.permission === 'edit' ? 'Droit d’édition' : 'Consultation seule'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => revokeProjectShare(s.id)}
                    className="text-[#FF1E27] hover:text-red-700 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    title="Révoquer l’accès"
                    aria-label={`Révoquer l’accès pour ${s.sharedWithEmail}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Copier le lien sécurisé */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 w-full py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Lien copié dans le presse-papier !' : 'Copier le lien sécurisé du projet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
