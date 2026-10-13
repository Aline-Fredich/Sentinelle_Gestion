'use client';

import React, { useState } from 'react';
import { 
  Users, AlertTriangle, CheckCircle2, 
  UserPlus, Mail 
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { formatShortDateFrench, isDateOverdue } from '@/lib/dateUtils';
import { Task, User, WorkspaceRole } from '@/types/sentinel';
import { InviteMemberModal } from './InviteMemberModal';
import { RemoveMemberModal } from './RemoveMemberModal';

interface TeamViewProps {
  onOpenTaskModal: (task?: Task) => void;
}

export function TeamView({ onOpenTaskModal }: TeamViewProps) {
  const { 
    workload, users, invitations, revokeInvitation, 
    updateUserRole, quotas 
  } = useSentinel();

  const [activeTab, setActiveTab] = useState<'workload' | 'members' | 'invitations'>('workload');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<User | null>(null);

  const roleLabels: Record<WorkspaceRole, string> = {
    owner: 'Propriétaire',
    admin: 'Administrateur',
    project_manager: 'Chef de projet',
    member: 'Membre',
    viewer: 'Lecteur seul',
  };

  return (
    <div className="space-y-6">
      {/* En-tête de vue avec actions */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0066FF] dark:text-blue-400 mb-1 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            Collaboration & Équipe
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Gestion de l’équipe & Rôles
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gérez les collaborateurs, attribuez les permissions et suivez la charge sur 35h/semaine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-slate-600 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            Membres : <strong className="text-slate-900 dark:text-white">{quotas.members.used} / {quotas.members.max}</strong>
          </div>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0066FF] hover:bg-blue-600 active:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Inviter un membre</span>
          </button>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="flex items-center gap-2 border-b border-[#E4E7EC] dark:border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('workload')}
          className={`px-3.5 py-1.5 rounded-xl transition ${
            activeTab === 'workload'
              ? 'bg-[#202733] text-white dark:bg-slate-800'
              : 'text-[#667085] hover:bg-[#F6F7F9] dark:hover:bg-slate-800'
          }`}
        >
          Capacité & Charge (35h)
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`px-3.5 py-1.5 rounded-xl transition ${
            activeTab === 'members'
              ? 'bg-[#202733] text-white dark:bg-slate-800'
              : 'text-[#667085] hover:bg-[#F6F7F9] dark:hover:bg-slate-800'
          }`}
        >
          Rôles & Permissions ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-3.5 py-1.5 rounded-xl transition ${
            activeTab === 'invitations'
              ? 'bg-[#202733] text-white dark:bg-slate-800'
              : 'text-[#667085] hover:bg-[#F6F7F9] dark:hover:bg-slate-800'
          }`}
        >
          Invitations en attente ({invitations.filter(i => i.status === 'pending').length})
        </button>
      </div>

      {/* Onglet 1 : Charge de travail (35h) */}
      {activeTab === 'workload' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workload.map(item => {
            const { user, assignedTasks, loadPercentage, isOverloaded, overdueCount, totalMinutes } = item;
            const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

            return (
              <div
                key={user.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-[#E4E7EC] dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
              >
                {/* En-tête membre */}
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#202733] dark:text-white truncate">
                        {user.name}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F6F7F9] dark:bg-slate-800 text-[#667085] dark:text-slate-300">
                        {roleLabels[user.role] || user.role}
                      </span>
                    </div>
                    <p className="text-xs text-[#667085] truncate mt-0.5">
                      {user.jobTitle}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Jauge de charge */}
                <div className="space-y-1.5 p-3 rounded-xl bg-[#F6F7F9] dark:bg-slate-800/50 border border-[#E4E7EC] dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#667085] dark:text-slate-400">
                      Taux d’occupation
                    </span>
                    <span className={isOverloaded ? 'text-[#C83B42] font-bold' : 'text-[#202733] dark:text-white font-bold'}>
                      {loadPercentage}% ({totalHours}h / 35h)
                    </span>
                  </div>

                  <div className="w-full bg-[#EEF1F4] dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverloaded 
                          ? 'bg-[#C83B42]' 
                          : loadPercentage > 75 
                          ? 'bg-[#D69A24]' 
                          : 'bg-[#23845B]'
                      }`}
                      style={{ width: `${Math.min(100, loadPercentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#667085] pt-1">
                    <span>{assignedTasks.length} tâche(s) en cours</span>
                    {overdueCount > 0 ? (
                      <span className="text-[#C83B42] font-bold flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> {overdueCount} retard(s)
                      </span>
                    ) : (
                      <span className="text-[#23845B] flex items-center gap-0.5 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> À jour
                      </span>
                    )}
                  </div>
                </div>

                {/* Liste des tâches attribuées */}
                <div className="space-y-1.5 flex-1">
                  <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block">
                    Tâches actives
                  </span>
                  {assignedTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      Aucune tâche actuellement assignée.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {assignedTasks.map(task => {
                        const isLate = isDateOverdue(task.dueDate, task.status);
                        return (
                          <div
                            key={task.id}
                            onClick={() => onOpenTaskModal(task)}
                            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-[#E4E7EC] dark:border-slate-700 text-xs hover:border-[#C83B42] cursor-pointer transition flex items-center justify-between"
                          >
                            <span className="truncate pr-2 font-medium text-[#202733] dark:text-slate-200">
                              {task.title}
                            </span>
                            <span className={`text-[10px] flex-shrink-0 ${isLate ? 'text-[#C83B42] font-bold' : 'text-[#667085]'}`}>
                              {task.dueDate ? formatShortDateFrench(task.dueDate) : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Onglet 2 : Membres & Rôles (Section 10.2) */}
      {activeTab === 'members' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E4E7EC] dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F7F9] dark:bg-slate-800/60 border-b border-[#E4E7EC] dark:border-slate-800 text-[11px] font-semibold text-[#667085] uppercase">
                <tr>
                  <th className="py-3 px-4">Collaborateur</th>
                  <th className="py-3 px-4">Poste & Fonction</th>
                  <th className="py-3 px-4">Rôle attribué</th>
                  <th className="py-3 px-4">Capacité hebdo</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] dark:divide-slate-800">
                {users.map(u => {
                  const isOwner = u.role === 'owner';
                  return (
                    <tr key={u.id} className="hover:bg-[#F6F7F9] dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-semibold text-[#202733] dark:text-white">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <div className="font-bold">{u.name}</div>
                            <div className="text-[11px] text-[#667085] font-normal">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#667085]">
                        {u.jobTitle}
                      </td>
                      <td className="py-3.5 px-4">
                        {isOwner ? (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-[#C83B42] dark:bg-rose-950/40">
                            Propriétaire
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value as WorkspaceRole)}
                            className="px-2 py-1 bg-[#F6F7F9] dark:bg-slate-800 border border-[#E4E7EC] dark:border-slate-700 rounded-lg text-xs font-medium text-[#202733] dark:text-white"
                          >
                            <option value="admin">Administrateur</option>
                            <option value="project_manager">Chef de projet</option>
                            <option value="member">Membre</option>
                            <option value="viewer">Lecteur seul</option>
                          </select>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#667085]">
                        35h / semaine (2100 min)
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isOwner && (
                          <button
                            onClick={() => setMemberToRemove(u)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#C83B42] hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                          >
                            Retirer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onglet 3 : Invitations envoyées (Section 10.1) */}
      {activeTab === 'invitations' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E4E7EC] dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F7F9] dark:bg-slate-800/60 border-b border-[#E4E7EC] dark:border-slate-800 text-[11px] font-semibold text-[#667085] uppercase">
                <tr>
                  <th className="py-3 px-4">Email invité</th>
                  <th className="py-3 px-4">Rôle proposé</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Expiration</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] dark:divide-slate-800">
                {invitations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      Aucune invitation en cours.
                    </td>
                  </tr>
                ) : (
                  invitations.map(inv => {
                    const statusBadge: Record<string, { label: string; cls: string }> = {
                      pending: { label: 'En attente', cls: 'bg-amber-50 text-[#D69A24] dark:bg-amber-950/40' },
                      accepted: { label: 'Acceptée', cls: 'bg-emerald-50 text-[#23845B] dark:bg-emerald-950/40' },
                      revoked: { label: 'Révoquée', cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800' },
                      expired: { label: 'Expirée', cls: 'bg-rose-50 text-[#C83B42] dark:bg-rose-950/40' },
                    };
                    const badge = statusBadge[inv.status] || { label: inv.status, cls: 'bg-slate-100 text-slate-500' };

                    return (
                      <tr key={inv.id} className="hover:bg-[#F6F7F9] dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-semibold text-[#202733] dark:text-white">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span>{inv.email}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#667085]">
                          {roleLabels[inv.role] || inv.role}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#667085]">
                          {formatShortDateFrench(inv.expiresAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {inv.status === 'pending' && (
                            <button
                              onClick={() => revokeInvitation(inv.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#C83B42] hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                            >
                              Révoquer
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      <RemoveMemberModal
        member={memberToRemove}
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
      />
    </div>
  );
}
