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
      label: 'Terminé',
      description: 'Livrables validés et clôturés',
      colorBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
      borderColor: 'border-emerald-200 dark:border-emerald-800/60',
      tasks: trackingColumns.completed,
      icon: CheckCircle2,
    },
    {
      id: 'inProgress',
      label: 'En cours',
      description: 'Tâches actives en progression normale',
      colorBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
      borderColor: 'border-blue-200 dark:border-blue-800/60',
      tasks: trackingColumns.inProgress,
      icon: Clock,
    },
    {
      id: 'overdue',
      label: 'En retard',
      description: 'Échéance dépassée nécessitant une action',
      colorBadge: 'bg-red-100 text-[#FF1E27] dark:bg-red-950/60 dark:text-red-300',
      borderColor: 'border-red-300 dark:border-red-800/80',
      tasks: trackingColumns.overdue,
      icon: AlertTriangle,
    },
    {
      id: 'upcoming',
      label: 'À venir',
      description: 'Travaux planifiés ultérieurement',
      colorBadge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
      borderColor: 'border-slate-200 dark:border-slate-800',
      tasks: trackingColumns.upcoming,
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Barre d'en-tête du tableau de suivi */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#0066FF] shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Suivi Opérationnel & Délais
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeProjectId === 'all' 
                ? 'Consolidation multi-projets • Gestion fluide des jalons' 
                : (currentProject ? `Projet : ${currentProject.name}` : 'Gestion des tâches')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Bascule Mode Tableau / Mode Cartes */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-[#0066FF] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              <span>Tableau Structuré</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-[#0066FF] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Columns className="w-4 h-4" />
              <span>Colonnes d'États</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0066FF]' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <button
            onClick={() => onOpenTaskModal(undefined, 'todo')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle tâche</span>
          </button>
        </div>
      </div>

      {/* VUE 1 : GRANDE TABLE PROFESSIONNELLE (DATA TABLE) */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Barre de filtrage interne */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Affichage :
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-[#0066FF] dark:text-blue-300">
                {sortedTasks.length} tâche{sortedTasks.length > 1 ? 's' : ''} répertoriée{sortedTasks.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th 
                    onClick={() => handleSort('status')}
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition select-none w-36"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Statut</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('title')}
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition select-none min-w-[280px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Tâche & Descriptif</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-40">Projet</th>
                  <th 
                    onClick={() => handleSort('priority')}
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition select-none w-32"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Priorité</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-44">Responsable</th>
                  <th 
                    onClick={() => handleSort('dueDate')}
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition select-none w-36"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Échéance</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-36 text-center">Sous-tâches</th>
                  <th className="py-3.5 px-4 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {sortedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-semibold">Aucune tâche trouvée</p>
                      <p className="text-xs text-slate-500 mt-1">Créez votre première tâche ou réinitialisez les filtres.</p>
                    </td>
                  </tr>
                ) : (
                  sortedTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    const taskProject = projects.find(p => p.id === task.projectId);
                    const totalChecks = task.checklist ? task.checklist.length : 0;
                    const completedChecks = task.checklist ? task.checklist.filter(c => c.isCompleted).length : 0;
                    const isOverdue = isDateOverdue(task.dueDate, task.status);

                    const statusStyles: Record<TaskStatus, { label: string; badge: string }> = {
                      todo: { label: 'À faire', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
                      in_progress: { label: 'En cours', badge: 'bg-blue-100 text-[#0066FF] dark:bg-blue-950 dark:text-blue-300' },
                      in_review: { label: 'En revue', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
                      done: { label: 'Terminé', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
                    };

                    const priorityStyles: Record<TaskPriority, { label: string; badge: string }> = {
                      urgent: { label: 'Urgente', badge: 'bg-red-100 text-[#FF1E27] font-bold' },
                      high: { label: 'Haute', badge: 'bg-amber-100 text-amber-800 font-semibold' },
                      medium: { label: 'Moyenne', badge: 'bg-slate-100 text-slate-700' },
                      low: { label: 'Basse', badge: 'bg-slate-50 text-slate-500' },
                    };

                    return (
                      <tr 
                        key={task.id}
                        className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Statut sélecteur direct */}
                        <td className="py-3 px-4">
                          <select
                            value={task.status}
                            onChange={(e) => {
                              const newSt = e.target.value as TaskStatus;
                              moveTaskStatus(task.id, newSt);
                              if (newSt === 'done') {
                                confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
                              }
                            }}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 transition ${statusStyles[task.status].badge}`}
                          >
                            <option value="todo">À faire</option>
                            <option value="in_progress">En cours</option>
                            <option value="in_review">En revue</option>
                            <option value="done">Terminé</option>
                          </select>
                        </td>

                        {/* Titre & Descriptif */}
                        <td className="py-3 px-4">
                          <div 
                            onClick={() => onOpenTaskModal(task)}
                            className="font-semibold text-slate-900 dark:text-white hover:text-[#0066FF] cursor-pointer transition"
                          >
                            {task.title}
                          </div>
                          {task.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {task.description}
                            </p>
                          )}
                          {task.labels && task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {task.labels.map((lbl, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {lbl}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Projet */}
                        <td className="py-3 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                          {taskProject?.name || '—'}
                        </td>

                        {/* Priorité */}
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-xs rounded-md ${priorityStyles[task.priority].badge}`}>
                            {priorityStyles[task.priority].label}
                          </span>
                        </td>

                        {/* Responsable */}
                        <td className="py-3 px-4">
                          {assignee ? (
                            <div className="flex items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={assignee.avatar} 
                                alt={assignee.name} 
                                className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-300"
                              />
                              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                                {assignee.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Non assigné</span>
                          )}
                        </td>

                        {/* Échéance */}
                        <td className="py-3 px-4">
                          {task.dueDate ? (
                            <div className={`text-xs font-semibold flex items-center gap-1 ${
                              isOverdue ? 'text-[#FF1E27]' : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              {isOverdue && <AlertTriangle className="w-3.5 h-3.5" />}
                              <span>{formatDayMonthFrench(task.dueDate)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Sous-tâches */}
                        <td className="py-3 px-4 text-center">
                          {totalChecks > 0 ? (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              completedChecks === totalChecks 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {completedChecks}/{totalChecks}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Action rapide */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onOpenTaskModal(task)}
                            className="p-1.5 text-slate-400 hover:text-[#0066FF] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Éditer la tâche"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
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
                className={`flex flex-col bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border ${col.borderColor} p-4 min-h-[540px] shadow-sm`}
              >
                {/* En-tête de colonne */}
                <div className="flex items-start justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${col.colorBadge}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {col.label}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.colorBadge}`}>
                          {col.tasks.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {col.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Liste de cartes */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[720px] pr-1">
                  {col.tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 text-xs">
                      <IconComp className="w-8 h-8 opacity-30 mb-2" />
                      <span>Aucune tâche dans cette catégorie</span>
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
                          className={`p-4 rounded-xl bg-white dark:bg-slate-800 border transition shadow-sm hover:shadow-md ${
                            col.id === 'overdue'
                              ? 'border-red-300 dark:border-red-800/80 ring-1 ring-red-500/20'
                              : 'border-slate-200/90 dark:border-slate-700 hover:border-blue-400'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              task.priority === 'urgent'
                                ? 'bg-red-100 text-[#FF1E27]'
                                : task.priority === 'high'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                              {task.priority}
                            </span>

                            <button
                              onClick={() => onOpenTaskModal(task)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>

                          <h4
                            onClick={() => onOpenTaskModal(task)}
                            className="text-sm font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-[#0066FF] transition mb-2"
                          >
                            {task.title}
                          </h4>

                          {totalChecks > 0 && (
                            <div className="space-y-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 mb-3">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                <span className="flex items-center gap-1">
                                  <CheckSquare className="w-3.5 h-3.5 text-[#0066FF]" />
                                  Liste ({completedChecks}/{totalChecks})
                                </span>
                                <span>{progressPercent}%</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#0066FF] h-full rounded-full transition-all duration-300"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500">
                            {task.dueDate ? (
                              <span className={`font-semibold ${isOverdue ? 'text-[#FF1E27]' : ''}`}>
                                {formatDayMonthFrench(task.dueDate)}
                              </span>
                            ) : <span>—</span>}

                            {assignee && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-300"
                              />
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
