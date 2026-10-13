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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-[#E4E7EC] dark:border-slate-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC] dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-[#C83B42] dark:bg-rose-950/40">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#202733] dark:text-white">
                Inviter un collaborateur
              </h2>
              <p className="text-xs text-[#667085]">
                Générez un accès sécurisé dans SENTINEL GESTION
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quota indication */}
        <div className="p-3 rounded-xl bg-[#F6F7F9] dark:bg-slate-800/60 border border-[#E4E7EC] dark:border-slate-700 text-xs flex items-center justify-between">
          <span className="text-[#667085]">Quota d’équipe :</span>
          <span className="font-bold text-[#202733] dark:text-white">
            {quotas.members.used} / {quotas.members.max} membres utilisés
          </span>
        </div>

        {isQuotaFull && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-[#C83B42] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Limite de collaborateurs atteinte. Passez à l’offre Pro pour inviter plus de membres.</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-xs text-[#C83B42] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-2 text-[#23845B]">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
            <h4 className="text-sm font-bold">Invitation envoyée avec succès !</h4>
            <p className="text-xs text-[#667085]">Un lien d’accès sécurisé a été généré.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#202733] dark:text-slate-300 mb-1">
                Adresse email professionnelle *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collaborateur@entreprise.fr"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F6F7F9] dark:bg-slate-800 border border-[#E4E7EC] dark:border-slate-700 rounded-xl text-[#202733] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C83B42]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#202733] dark:text-slate-300 mb-1">
                  Rôle attribué
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as WorkspaceRole)}
                  className="w-full px-2.5 py-2 text-xs bg-[#F6F7F9] dark:bg-slate-800 border border-[#E4E7EC] dark:border-slate-700 rounded-xl text-[#202733] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C83B42]"
                >
                  <option value="member">Membre (standard)</option>
                  <option value="project_manager">Chef de projet</option>
                  <option value="admin">Administrateur</option>
                  <option value="viewer">Lecteur seul</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202733] dark:text-slate-300 mb-1">
                  Périmètre projet
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-[#F6F7F9] dark:bg-slate-800 border border-[#E4E7EC] dark:border-slate-700 rounded-xl text-[#202733] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C83B42]"
                >
                  <option value="all">Tout l’espace</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-[11px] text-[#667085] leading-relaxed">
              L’invitation génère un lien d’embarquement révocable à tout moment, valable 7 jours.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-[#667085] hover:bg-[#F6F7F9] dark:hover:bg-slate-800 rounded-xl transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isQuotaFull}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#C83B42] hover:bg-[#b03037] active:bg-[#99252c] rounded-xl transition shadow-sm disabled:opacity-50"
              >
                Envoyer l’invitation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
