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
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

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
    super_admin: 'Super Administrateur',
    owner: 'Propriétaire',
    admin: 'Administrateur',
    project_manager: 'Chef de projet',
    member: 'Membre',
    viewer: 'Lecteur seul',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* En-tête de vue avec actions */}
      <div className="panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[var(--border)] bg-[var(--surface)] p-5 rounded-[var(--r-md)]">
        <div>
          <div className="flex items-center gap-2 text-micro font-bold text-[var(--brand)] mb-1 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-[var(--brand)]" />
            COLLABORATION & ÉQUIPE
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand)] shadow-[var(--glow-sm)]" />
            <h1 className="text-base font-bold text-[var(--text)] uppercase tracking-wider">
              <span>Gestion de l’équipe & Rôles</span>
              <span className="sr-only">Gestion de l'équipe & Rôles</span>
            </h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Gérez les collaborateurs, attribuez les permissions et suivez la charge sur 35h/semaine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="tag-mono border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 rounded-[var(--r-xs)] text-xs text-[var(--text-muted)] font-mono">
            MEMBRES : <strong className="text-[var(--text)] font-mono">{quotas.members.used} / {quotas.members.max}</strong>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
            icon={<UserPlus className="w-4 h-4" />}
          >
            INVITER UN MEMBRE
          </Button>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="tabs border border-[var(--border)] bg-[var(--surface)] p-1 rounded-[var(--r-sm)] inline-flex gap-1">
        <button
          onClick={() => setActiveTab('workload')}
          aria-selected={activeTab === 'workload'}
          className={`tab px-3 py-1.5 rounded-[var(--r-xs)] text-xs font-bold uppercase transition ${
            activeTab === 'workload' ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          CAPACITÉ & CHARGE (35H)
        </button>

        <button
          data-testid="tab-team-roles"
          onClick={() => setActiveTab('members')}
          aria-selected={activeTab === 'members'}
          className={`tab px-3 py-1.5 rounded-[var(--r-xs)] text-xs font-bold uppercase transition ${
            activeTab === 'members' ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          RÔLES & PERMISSIONS ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          aria-selected={activeTab === 'invitations'}
          className={`tab px-3 py-1.5 rounded-[var(--r-xs)] text-xs font-bold uppercase transition ${
            activeTab === 'invitations' ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          INVITATIONS EN ATTENTE ({invitations.filter(i => i.status === 'pending').length})
        </button>
      </div>

      {/* Onglet 1 : Charge de travail (35h) */}
      {activeTab === 'workload' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workload.map(item => {
            const { user, assignedTasks, loadPercentage, isOverloaded, overdueCount, totalMinutes } = item;
            const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

            return (
              <div
                key={user.id}
                className="panel flex flex-col justify-between space-y-4 border border-[var(--border)] bg-[var(--surface)] p-4 rounded-[var(--r-md)]"
              >
                {/* En-tête membre */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-[var(--r-sm)] border border-[var(--brand)]/40 bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] font-mono font-bold text-base flex-none">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wide truncate">
                        {user.name}
                      </h3>
                      <Badge variant="default" size="xs">
                        {roleLabels[user.role] || user.role}
                      </Badge>
                    </div>
                    <p className="text-micro text-[var(--text-muted)] truncate mt-0.5">
                      {user.jobTitle}
                    </p>
                    <p className="text-micro font-mono text-[var(--text-muted)] truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Jauge de charge */}
                <div className="card-inner space-y-2 p-3 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)] uppercase tracking-wider font-bold text-micro">
                      Taux d’occupation
                    </span>
                    <span className={`font-mono font-bold ${isOverloaded ? 'text-[var(--button-danger-bg)]' : 'text-[var(--text)]'}`}>
                      {loadPercentage}% ({totalHours}h / 35h)
                    </span>
                  </div>

                  <div className="w-full bg-[var(--surface)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
                    <div 
                      className={`h-full transition-all duration-300 ${isOverloaded ? 'bg-[var(--button-danger-bg)]' : 'bg-[var(--brand)]'}`} 
                      style={{ width: `${Math.min(100, loadPercentage)}%` }} 
                    />
                  </div>

                  <div className="flex items-center justify-between text-micro text-[var(--text-muted)] pt-1">
                    <span>{assignedTasks.length} tâche(s) en cours</span>
                    {overdueCount > 0 ? (
                      <span className="text-[var(--button-danger-bg)] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-[var(--button-danger-bg)]" /> {overdueCount} retard(s)
                      </span>
                    ) : (
                      <span className="text-[var(--text)] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[var(--brand)]" /> À jour
                      </span>
                    )}
                  </div>
                </div>

                {/* Liste des tâches attribuées */}
                <div className="space-y-1.5 flex-1">
                  <span className="text-micro font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                    Tâches actives
                  </span>
                  {assignedTasks.length === 0 ? (
                    <p className="text-micro text-[var(--text-muted)] italic py-2">
                      Aucune tâche actuellement assignée.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {assignedTasks.map(task => {
                        const isLate = isDateOverdue(task.dueDate, task.status);
                        return (
                          <div
                            key={task.id}
                            onClick={() => onOpenTaskModal(task)}
                            className="p-2 rounded-[var(--r-xs)] bg-[var(--surface-2)] border border-[var(--border)] text-xs hover:border-[var(--brand)] cursor-pointer transition flex items-center justify-between"
                          >
                            <span className="truncate pr-2 font-bold text-[var(--text)] uppercase tracking-wide text-micro">
                              {task.title}
                            </span>
                            <span className={`text-micro font-mono flex-shrink-0 ${isLate ? 'text-[var(--button-danger-bg)] font-bold' : 'text-[var(--text-muted)]'}`}>
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

      {/* Onglet 2 : Membres & Rôles */}
      {activeTab === 'members' && (
        <div className="panel space-y-4">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>COLLABORATEUR</th>
                  <th>POSTE & FONCTION</th>
                  <th>RÔLE ATTRIBUÉ</th>
                  <th>CAPACITÉ HEBDO</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isOwner = u.role === 'owner';
                  return (
                    <tr key={u.id}>
                      <td className="font-bold text-[var(--text)]">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded border border-[var(--border)] bg-[var(--surface-2)] text-[var(--brand)] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                            {u.name.charAt(0)}
                          </span>
                          <div>
                            <div className="uppercase tracking-wide">{u.name}</div>
                            <div className="text-[11px] text-[var(--text-muted)] font-mono font-normal">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-[var(--text-muted)]">
                        {u.jobTitle}
                      </td>
                      <td className="text-center">
                        {isOwner ? (
                          <Badge variant="danger" label="PROPRIÉTAIRE" size="xs" />
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value as WorkspaceRole)}
                            aria-label={`Rôle de ${u.name}`}
                            className="w-auto px-2 py-1 text-xs bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text)] font-bold uppercase focus:outline-none focus:border-[var(--brand)]"
                          >
                            <option value="admin">ADMINISTRATEUR</option>
                            <option value="project_manager">CHEF DE PROJET</option>
                            <option value="member">MEMBRE</option>
                            <option value="viewer">LECTEUR SEUL</option>
                          </select>
                        )}
                      </td>
                      <td className="font-mono text-xs text-[var(--text-muted)] text-center">
                        35h / semaine (2100 min)
                      </td>
                      <td className="text-right">
                        {!isOwner && (
                          <Button
                            variant="danger"
                            size="xs"
                            onClick={() => setMemberToRemove(u)}
                          >
                            RETIRER
                          </Button>
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

      {/* Onglet 3 : Invitations envoyées */}
      {activeTab === 'invitations' && (
        <div className="panel space-y-4">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>EMAIL INVITÉ</th>
                  <th>RÔLE PROPOSÉ</th>
                  <th>STATUT</th>
                  <th>EXPIRATION</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {invitations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-empty py-10 text-center text-xs text-[var(--text-muted)]">
                      Aucune invitation en cours.
                    </td>
                  </tr>
                ) : (
                  invitations.map(inv => {
                    const statusVariantMap: Record<string, 'warning' | 'success' | 'danger' | 'default'> = {
                      pending: 'warning',
                      accepted: 'success',
                      expired: 'danger',
                      revoked: 'default',
                    };
                    const statusLabelMap: Record<string, string> = {
                      pending: 'EN ATTENTE',
                      accepted: 'ACCEPTÉE',
                      expired: 'EXPIRÉE',
                      revoked: 'RÉVOQUÉE',
                    };

                    return (
                      <tr key={inv.id}>
                        <td className="font-bold text-[var(--text)]">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-[var(--brand)]" />
                            <span className="font-mono">{inv.email}</span>
                          </div>
                        </td>
                        <td className="text-[var(--text-muted)]">
                          {roleLabels[inv.role] || inv.role}
                        </td>
                        <td className="text-center">
                          <Badge 
                            variant={statusVariantMap[inv.status] || 'default'} 
                            label={statusLabelMap[inv.status] || inv.status.toUpperCase()} 
                            size="xs" 
                          />
                        </td>
                        <td className="font-mono text-xs text-[var(--text-muted)] text-center">
                          {formatShortDateFrench(inv.expiresAt)}
                        </td>
                        <td className="text-right">
                          {inv.status === 'pending' && (
                            <Button
                              variant="danger"
                              size="xs"
                              onClick={() => revokeInvitation(inv.id)}
                            >
                              RÉVOQUER
                            </Button>
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
