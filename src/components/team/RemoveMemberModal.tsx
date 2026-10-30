'use client';

import React, { useState } from 'react';
import { X, UserX, AlertTriangle } from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { User } from '@/types/sentinel';

interface RemoveMemberModalProps {
  member: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RemoveMemberModal({ member, isOpen, onClose }: RemoveMemberModalProps) {
  const { users, removeMember, tasks } = useSentinel();
  const [reassignToUserId, setReassignToUserId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const assignedTasks = tasks.filter(t => t.assigneeId === member.id && t.status !== 'done');
  const otherUsers = users.filter(u => u.id !== member.id);

  const handleConfirm = () => {
    setError(null);
    const res = removeMember(member.id, reassignToUserId || undefined);
    if (!res.success) {
      setError(res.error || 'Erreur lors du retrait du membre.');
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal modal--sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#242424] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] border border-red bg-red/10 flex items-center justify-center text-red">
              <UserX className="w-4 h-4 text-red" />
            </div>
            <div>
              <h2 className="modal-title mb-0">
                RETIRER UN COLLABORATEUR
              </h2>
              <p className="text-micro text-white/45">
                Révocation d’accès et préservation de l’historique
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

        {error && (
          <div className="alert alert--error mb-3 text-xs">
            <AlertTriangle className="w-4 h-4 text-red inline mr-1" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <p className="text-white/70">
            Vous êtes sur le point de retirer <strong className="text-white uppercase">{member.name}</strong> ({member.email}) de l’espace de travail.
          </p>

          <div className="card-inner space-y-1.5">
            <div className="font-bold text-red uppercase tracking-wider flex items-center gap-1.5 text-micro">
              <AlertTriangle className="w-3.5 h-3.5 text-red" />
              {assignedTasks.length} TÂCHE(S) ACTIVE(S) ASSIGNÉE(S)
            </div>
            <p className="text-micro text-white/45">
              Toutes ses contributions historiques seront conservées. Vous pouvez réattribuer ses tâches actives à un autre collaborateur pour éviter toute rupture.
            </p>
          </div>

          {assignedTasks.length > 0 && (
            <div className="form-group mb-0">
              <label className="form-label">
                Réattribuer ses tâches à :
              </label>
              <select
                value={reassignToUserId}
                onChange={(e) => setReassignToUserId(e.target.value)}
                className="form-select uppercase font-bold"
              >
                <option value="">LAISSER NON ASSIGNÉES</option>
                {otherUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name.toUpperCase()} ({u.jobTitle})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="modal-actions pt-4 border-t border-[#242424]">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            ANNULER
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-danger btn-sm"
          >
            RETIRER LE MEMBRE
          </button>
        </div>
      </div>
    </div>
  );
}
