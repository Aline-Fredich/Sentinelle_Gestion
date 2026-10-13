'use client';

import React from 'react';
import { Plus, MoreVertical, AlertTriangle, CheckSquare, Calendar } from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { Task, TaskStatus } from '@/types/sentinel';
import { formatDayMonthFrench, isDateOverdue } from '@/lib/dateUtils';

interface KanbanBoardProps {
  onOpenTaskModal: (task?: Task, defaultStatus?: TaskStatus) => void;
}

export function KanbanBoard({ onOpenTaskModal }: KanbanBoardProps) {
  const { filteredTasks, moveTaskStatus, users } = useSentinel();

  const columns: Array<{ status: TaskStatus; label: string; badgeColor: string }> = [
    { status: 'todo', label: 'À faire', badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { status: 'in_progress', label: 'En cours', badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-cyan-300' },
    { status: 'in_review', label: 'En revue', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
    { status: 'done', label: 'Terminé', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Tableau Kanban complet
          </h2>
          <p className="text-xs text-slate-500">
            Gestion des flux de travail par étapes de réalisation
          </p>
        </div>
        <button
          onClick={() => onOpenTaskModal(undefined, 'todo')}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#0066FF] hover:bg-blue-700 rounded-xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle tâche</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.status);
          return (
            <div
              key={col.status}
              className="bg-slate-50/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 min-h-[560px] flex flex-col shadow-sm"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {col.label}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeColor}`}>
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onOpenTaskModal(undefined, col.status)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[700px]">
                {colTasks.map(task => {
                  const assignee = users.find(u => u.id === task.assigneeId);
                  const isLate = isDateOverdue(task.dueDate, task.status);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onOpenTaskModal(task)}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:border-[#0066FF] cursor-pointer transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          task.priority === 'urgent'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                            : task.priority === 'high'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {task.priority}
                        </span>
                        {isLate && (
                          <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> Retard
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                        {task.title}
                      </h4>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{task.dueDate ? formatDayMonthFrench(task.dueDate) : 'Sans date'}</span>
                        </div>
                        {assignee && (
                          <img
                            src={assignee.avatar}
                            alt={assignee.name}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
