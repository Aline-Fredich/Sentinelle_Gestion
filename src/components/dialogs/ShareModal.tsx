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
      className="modal-overlay"
      onClick={onClose}
    >
      <div 
        className="modal max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-4">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-[var(--red)]" />
            <div>
              <h3 id="share-modal-title" className="modal-title mb-0">
                PARTAGER LE PROJET
              </h3>
              <p className="text-xs text-[var(--white-70)] font-mono">
                {currentProject?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Fermer la modale"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulaire d'invitation sécurisée */}
        <form onSubmit={handleAddShare} className="space-y-3">
          <label className="form-label">
            Inviter un collaborateur externe ou auditeur
          </label>
          <div className="flex gap-2">
            <div className="input-group flex-1">
              <Mail className="w-4 h-4 text-[var(--red)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="auditeur@cabinet-partenaire.com"
                className="form-input"
              />
            </div>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
              className="form-select w-auto font-mono text-xs"
            >
              <option value="view">LECTURE SEULE</option>
              <option value="edit">MODIFICATION</option>
            </select>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
          >
            <span>ACCORDER L’ACCÈS</span>
          </button>
        </form>

        {/* Liste des partages persistés avec révocation */}
        <div className="space-y-2 pt-3 border-t border-[var(--line)] mt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--white-70)] block">
            Accès actifs ({projectShares.length})
          </span>
          {projectShares.length === 0 ? (
            <p className="text-xs text-[var(--white-45)] py-3 text-center border border-[var(--line)] rounded-[var(--r-xs)]">
              Aucun accès externe actif pour ce projet
            </p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {projectShares.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-[var(--r-xs)] bg-black border border-[var(--line)] text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[var(--red)] flex-none" />
                    <div>
                      <span className="font-bold text-white block truncate max-w-[200px]">
                        {s.sharedWithEmail}
                      </span>
                      <span className="text-[11px] text-[var(--white-45)] font-mono">
                        {s.permission === 'edit' ? 'DROIT D’ÉDITION' : 'CONSULTATION SEULE'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => revokeProjectShare(s.id)}
                    className="btn btn-ghost btn-icon btn-sm text-[var(--red)] hover:bg-[var(--red-tint)]"
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
        <div className="pt-3 border-t border-[var(--line)] mt-4">
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn btn-secondary w-full"
          >
            {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-[var(--red)]" />}
            <span>{copiedLink ? 'LIEN COPIÉ !' : 'COPIER LE LIEN DU PROJET'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
