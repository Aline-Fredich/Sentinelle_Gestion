'use client';

import React, { useState } from 'react';
import { X, Mail, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { WorkspaceRole } from '@/types/sentinel';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteMemberModal({ isOpen, onClose }: InviteMemberModalProps) {
  const { createInvitation, projects, quotas, activeProjectId } = useSentinel();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('member');
  const [projectId, setProjectId] = useState<string>(activeProjectId !== 'all' ? activeProjectId : 'all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = createInvitation(
      email, 
      role, 
      projectId !== 'all' ? projectId : undefined
    );

    if (!res.success) {
      setError(res.error || 'Erreur lors de l’envoi de l’invitation.');
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setEmail('');
        onClose();
      }, 1500);
    }
  };

  const isQuotaFull = quotas.members.used >= quotas.members.max;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal modal--sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#242424] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] border border-red bg-red/10 flex items-center justify-center text-red">
              <UserPlus className="w-4 h-4 text-red" />
            </div>
            <div>
              <h2 className="modal-title mb-0">
                INVITER UN COLLABORATEUR
              </h2>
              <p className="text-micro text-white/45">
                Générez un accès sécurisé dans SENTINELLE DE GESTION
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-sm p-1"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Quota indication */}
        <div className="card-inner text-xs flex items-center justify-between mb-3">
          <span className="text-white/45 uppercase tracking-wider font-bold text-micro">Quota d’équipe :</span>
          <span className="tag-mono text-white">
            {quotas.members.used} / {quotas.members.max} MEMBRES
          </span>
        </div>

        {isQuotaFull && (
          <div className="alert alert--error mb-3 text-xs">
            <AlertCircle className="w-4 h-4 text-red inline mr-1" />
            <span>Limite de collaborateurs atteinte. Passez à l’offre supérieure pour inviter plus de membres.</span>
          </div>
        )}

        {error && (
          <div className="alert alert--error mb-3 text-xs">
            <AlertCircle className="w-4 h-4 text-red inline mr-1" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-2 text-white">
            <CheckCircle2 className="w-8 h-8 text-white" />
            <h4 className="text-sm font-bold uppercase tracking-wider">Invitation envoyée avec succès !</h4>
            <p className="text-micro text-white/45">Un lien d’accès sécurisé a été généré.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group mb-0">
              <label className="form-label">
                Adresse email professionnelle <span className="req">*</span>
              </label>
              <div className="input-group">
                <Mail className="w-4 h-4 text-red" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collaborateur@entreprise.cg"
                  className="form-input font-mono"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group mb-0">
                <label className="form-label">
                  Rôle attribué
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as WorkspaceRole)}
                  className="form-select uppercase font-bold"
                >
                  <option value="member">MEMBRE (STANDARD)</option>
                  <option value="project_manager">CHEF DE PROJET</option>
                  <option value="admin">ADMINISTRATEUR</option>
                  <option value="viewer">LECTEUR SEUL</option>
                </select>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">
                  Périmètre projet
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="form-select uppercase font-bold"
                >
                  <option value="all">TOUT L'ESPACE</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-micro text-white/45 leading-relaxed">
              L’invitation génère un lien d’embarquement révocable à tout moment, valable 7 jours.
            </p>

            <div className="modal-actions pt-2 border-t border-[#242424]">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary btn-sm"
              >
                ANNULER
              </button>
              <button
                type="submit"
                disabled={isQuotaFull}
                className="btn btn-primary btn-sm"
              >
                ENVOYER L'INVITATION
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
