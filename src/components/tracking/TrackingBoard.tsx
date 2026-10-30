'use client';

import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, Calendar, 
  CheckSquare, Plus, RefreshCw, MoreVertical, 
  ArrowUpDown, LayoutList, Columns, ChevronRight
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { Task, TaskStatus, TaskPriority } from '@/types/sentinel';
import { formatDayMonthFrench, isDateOverdue } from '@/lib/dateUtils';
import confetti from 'canvas-confetti';
import { Badge, getStatusBadgeVariant, getPriorityBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const priorityWeights: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const statusWeights: Record<TaskStatus, number> = {
  todo: 1,
  in_progress: 2,
  in_review: 3,
  done: 4,
};

interface TrackingBoardProps {
  onOpenTaskModal: (task?: Task, defaultStatus?: TaskStatus) => void;
}

type SortField = 'title' | 'dueDate' | 'priority' | 'status';
type SortOrder = 'asc' | 'desc';

export function TrackingBoard({ onOpenTaskModal }: TrackingBoardProps) {
  const { 
    filteredTasks, trackingColumns, users, projects, 
    moveTaskStatus, currentProject, activeProjectId 
  } = useSentinel();

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtrage et tri de la table
  const sortedTasks = useMemo(() => {
    let list = [...filteredTasks];

    if (statusFilter !== 'all') {
      list = list.filter(t => t.status === statusFilter);
    }

    return list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'dueDate') {
        const dateA = a.dueDate || '9999-99-99';
        const dateB = b.dueDate || '9999-99-99';
        comparison = dateA.localeCompare(dateB);
      } else if (sortField === 'priority') {
        comparison = (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
      } else if (sortField === 'status') {
        comparison = (statusWeights[a.status] || 0) - (statusWeights[b.status] || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredTasks, statusFilter, sortField, sortOrder]);

  const columns = [
    {
      id: 'completed',
      label: 'TERMINÉ',
      description: 'Livrables validés et clôturés',
      badgeClass: 'badge badge--ok',
      borderColor: 'border-[#242424]',
      tasks: trackingColumns.completed,
      icon: CheckCircle2,
    },
    {
      id: 'inProgress',
      label: 'EN COURS',
      description: 'Tâches actives en progression normale',
      badgeClass: 'badge',
      borderColor: 'border-[#242424]',
      tasks: trackingColumns.inProgress,
      icon: Clock,
    },
    {
      id: 'overdue',
      label: 'EN RETARD',
      description: 'Échéance dépassée nécessitant une action',
      badgeClass: 'badge badge--bad',
      borderColor: 'border-red',
      tasks: trackingColumns.overdue,
      icon: AlertTriangle,
    },
    {
      id: 'upcoming',
      label: 'À VENIR',
      description: 'Travaux planifiés ultérieurement',
      badgeClass: 'badge',
      borderColor: 'border-[#242424]',
      tasks: trackingColumns.upcoming,
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Barre d'en-tête du tableau de suivi */}
      <div className="panel flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] border border-red bg-red/10 flex items-center justify-center text-red">
            <Clock className="w-5 h-5 text-red" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red shadow-[var(--glow-sm)]" />
              <h1 className="text-base font-bold text-white uppercase tracking-wider">
                SUIVI OPÉRATIONNEL & DÉLAIS
              </h1>
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              {activeProjectId === 'all' 
                ? 'Consolidation multi-projets • Gestion fluide des jalons' 
                : (currentProject ? `Projet : ${currentProject.name}` : 'Gestion des tâches')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bascule Mode Tableau / Mode Cartes */}
          <div className="tabs">
            <button
              onClick={() => setViewMode('table')}
              aria-selected={viewMode === 'table'}
              className="tab flex items-center gap-1.5"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>TABLEAU</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              aria-selected={viewMode === 'cards'}
              className="tab flex items-center gap-1.5"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>COLONNES</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-red ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">ACTUALISER</span>
          </button>

          <button
            onClick={() => onOpenTaskModal(undefined, 'todo')}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>NOUVELLE TÂCHE</span>
          </button>
        </div>
      </div>

      {/* VUE 1 : GRANDE TABLE PROFESSIONNELLE (DATA TABLE) */}
      {viewMode === 'table' && (
        <div className="panel space-y-4">
          {/* Barre de filtrage interne */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242424] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-micro font-bold uppercase tracking-wider text-white/45">
                AFFICHAGE :
              </span>
              <span className="badge badge--ok font-mono">
                {sortedTasks.length} TÂCHE{sortedTasks.length > 1 ? 'S' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select w-auto py-1 text-xs"
              >
                <option value="all">Tous les statuts</option>
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="in_review">En revue</option>
                <option value="done">Terminé</option>
              </select>
            </div>
          </div>

          {/* Tableau */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th 
                    onClick={() => handleSort('status')}
                    className="cursor-pointer select-none w-36"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>STATUT</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('title')}
                    className="cursor-pointer select-none text-left min-w-[280px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>TÂCHE & DESCRIPTIF</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </th>
                  <th className="w-40">PROJET</th>
                  <th 
                    onClick={() => handleSort('priority')}
                    className="cursor-pointer select-none w-32"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>PRIORITÉ</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </th>
                  <th className="w-44">RESPONSABLE</th>
                  <th 
                    onClick={() => handleSort('dueDate')}
                    className="cursor-pointer select-none w-36"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>ÉCHÉANCE</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  </th>
                  <th className="w-36 text-center">SOUS-TÂCHES</th>
                  <th className="w-20 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="table-empty py-12 text-center">
                      <Clock className="w-8 h-8 text-[var(--brand)] mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">AUCUNE TÂCHE TROUVÉE</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Créez votre première tâche ou réinitialisez les filtres.</p>
                    </td>
                  </tr>
                ) : (
                  sortedTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    const taskProject = projects.find(p => p.id === task.projectId);
                    const totalChecks = task.checklist ? task.checklist.length : 0;
                    const completedChecks = task.checklist ? task.checklist.filter(c => c.isCompleted).length : 0;
                    const isOverdue = isDateOverdue(task.dueDate, task.status);

                    return (
                      <tr key={task.id} className="group">
                        {/* Statut avec Badge interactif (bordure + pastille colorée) */}
                        <td className="text-center">
                          <div className="relative inline-flex items-center justify-center">
                            <select
                              value={task.status}
                              aria-label={`Changer le statut de ${task.title}`}
                              onChange={(e) => {
                                const newSt = e.target.value as TaskStatus;
                                moveTaskStatus(task.id, newSt);
                                if (newSt === 'done') {
                                  confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
                                }
                              }}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                            >
                              <option value="todo">À FAIRE</option>
                              <option value="in_progress">EN COURS</option>
                              <option value="in_review">EN REVUE</option>
                              <option value="done">TERMINÉ</option>
                            </select>
                            <Badge 
                              variant={getStatusBadgeVariant(task.status)} 
                              size="xs" 
                              className="cursor-pointer group-hover:scale-105 transition-transform" 
                            />
                          </div>
                        </td>

                        {/* Titre & Descriptif */}
                        <td className="text-left">
                          <div 
                            onClick={() => onOpenTaskModal(task)}
                            className="font-bold text-[var(--text)] hover:text-[var(--brand)] cursor-pointer transition text-xs leading-snug"
                          >
                            {task.title}
                          </div>
                          {task.description && (
                            <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5 font-normal">
                              {task.description}
                            </p>
                          )}
                          {task.labels && task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {task.labels.map((lbl, idx) => (
                                <span key={idx} className="badge text-[9px] py-0 px-1.5">
                                  {lbl}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Projet */}
                        <td className="text-xs text-[var(--text-muted)] font-mono text-center">
                          {taskProject?.name || '—'}
                        </td>

                        {/* Priorité avec Badge à pastille */}
                        <td className="text-center">
                          <Badge 
                            variant={getPriorityBadgeVariant(task.priority)} 
                            size="xs" 
                          />
                        </td>

                        {/* Responsable */}
                        <td>
                          {assignee ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className="w-5 h-5 rounded border border-[var(--border)] bg-[var(--surface-2)] text-[var(--brand)] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                {assignee.name.charAt(0)}
                              </span>
                              <span className="text-xs text-[var(--text)] truncate max-w-[120px]">
                                {assignee.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          )}
                        </td>

                        {/* Échéance */}
                        <td className="text-center">
                          {task.dueDate ? (
                            <span className={`font-mono text-xs font-semibold ${isOverdue ? 'text-[var(--danger)] font-bold' : 'text-[var(--text)]'}`}>
                              {formatDayMonthFrench(task.dueDate)}
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          )}
                        </td>

                        {/* Sous-tâches */}
                        <td className="text-center">
                          {totalChecks > 0 ? (
                            <span className={`badge-rate font-mono ${completedChecks === totalChecks ? 'border-[var(--brand)] text-[var(--brand)] font-bold' : ''}`}>
                              {completedChecks}/{totalChecks}
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          )}
                        </td>

                        {/* Action rapide */}
                        <td className="text-right">
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={<ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors" />}
                            onClick={() => onOpenTaskModal(task)}
                            title="Consulter ou modifier la tâche"
                          />
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

      {/* VUE 2 : GRILLE DES 4 COLONNES D'ÉTATS */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map(col => {
            const IconComp = col.icon;
            return (
              <div
                key={col.id}
                className={`panel flex flex-col p-4 min-h-[540px] border ${col.borderColor}`}
              >
                {/* En-tête de colonne */}
                <div className="flex items-start justify-between pb-3 mb-3 border-b border-[#242424]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-[4px] border border-red/40 bg-red/10 flex items-center justify-center text-red">
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          {col.label}
                        </h3>
                        <span className={col.badgeClass}>
                          {col.tasks.length}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/45 mt-0.5">
                        {col.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Liste de cartes */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[720px] pr-1">
                  {col.tasks.length === 0 ? (
                    <div className="empty py-12">
                      <IconComp className="w-6 h-6 text-red opacity-40 mb-2" />
                      <span className="text-micro uppercase text-white/45">Aucune tâche</span>
                    </div>
                  ) : (
                    col.tasks.map(task => {
                      const assignee = users.find(u => u.id === task.assigneeId);
                      const totalChecks = task.checklist ? task.checklist.length : 0;
                      const completedChecks = task.checklist ? task.checklist.filter(c => c.isCompleted).length : 0;
                      const progressPercent = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;
                      const isOverdue = isDateOverdue(task.dueDate, task.status);

                      return (
                        <div
                          key={task.id}
                          className={`card-inner transition ${col.id === 'overdue' ? 'border-red' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className={task.priority === 'urgent' ? 'badge badge--bad text-[9px] py-0 px-1.5' : 'badge text-[9px] py-0 px-1.5'}>
                              {task.priority.toUpperCase()}
                            </span>

                            <button
                              onClick={() => onOpenTaskModal(task)}
                              className="btn btn-ghost btn-sm p-1 text-white/45 hover:text-white"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <h4
                            onClick={() => onOpenTaskModal(task)}
                            className="text-xs font-bold text-white uppercase tracking-wide cursor-pointer hover:text-red transition mb-2"
                          >
                            {task.title}
                          </h4>

                          {totalChecks > 0 && (
                            <div className="space-y-1.5 p-2 rounded-[4px] bg-[#050505] border border-[#242424] mb-3">
                              <div className="flex items-center justify-between text-micro font-mono text-white/70">
                                <span className="flex items-center gap-1">
                                  <CheckSquare className="w-3 h-3 text-red" />
                                  Liste ({completedChecks}/{totalChecks})
                                </span>
                                <span>{progressPercent}%</span>
                              </div>
                              <div className="progress">
                                <span style={{ width: `${progressPercent}%` }} />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-[#242424] text-micro text-white/45">
                            {task.dueDate ? (
                              <span className={`font-mono font-bold ${isOverdue ? 'text-red' : 'text-white/70'}`}>
                                {formatDayMonthFrench(task.dueDate)}
                              </span>
                            ) : <span>—</span>}

                            {assignee && (
                              <span className="w-5 h-5 rounded-[4px] border border-red bg-red/10 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                                {assignee.name.charAt(0)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
