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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-[#E4E7EC] dark:border-slate-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC] dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-[#C83B42] dark:bg-rose-950/40">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#202733] dark:text-white">
                Retirer un collaborateur
              </h2>
              <p className="text-[11px] text-[#667085]">
                Révocation d’accès et préservation de l’historique
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-xs text-[#C83B42] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <p className="text-[#202733] dark:text-slate-200">
            Vous êtes sur le point de retirer <strong className="text-[#202733] dark:text-white">{member.name}</strong> ({member.email}) de l’espace de travail.
          </p>

          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[#667085] space-y-1.5">
            <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#D69A24]" />
              {assignedTasks.length} tâche(s) active(s) assignée(s)
            </div>
            <p className="text-[11px]">
              Toutes ses contributions historiques seront conservées. Vous pouvez réattribuer ses tâches actives à un autre collaborateur pour éviter toute rupture.
            </p>
          </div>

          {assignedTasks.length > 0 && (
            <div>
              <label className="block font-semibold text-[#202733] dark:text-slate-300 mb-1">
                Réattribuer ses tâches à :
              </label>
              <select
                value={reassignToUserId}
                onChange={(e) => setReassignToUserId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-[#F6F7F9] dark:bg-slate-800 border border-[#E4E7EC] dark:border-slate-700 rounded-xl text-[#202733] dark:text-white"
              >
                <option value="">Laisser non assignées</option>
                {otherUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.jobTitle})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-[#667085] hover:bg-[#F6F7F9] dark:hover:bg-slate-800 rounded-xl transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#C83B42] hover:bg-[#b03037] active:bg-[#99252c] rounded-xl transition shadow-sm"
          >
            Confirmer le retrait
          </button>
        </div>
      </div>
    </div>
  );
}
