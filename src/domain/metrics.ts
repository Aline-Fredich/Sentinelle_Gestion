/**
 * SENTINEL GESTION — Domaine Métier Pur : Métriques et Indicateurs de Projet
 * Fonctions pures, déterministes, sans état React.
 */

import type { Task, TaskStatus } from '../types/sentinel';

function checkDateOverdue(dueDate?: string, status?: TaskStatus): boolean {
  if (!dueDate || status === 'done') return false;
  const today = new Date().toISOString().slice(0, 10);
  return dueDate < today;
}

export interface ProjectMetrics {
  totalTasks: number;
  completed: number;
  inProgress: number;
  inReview: number;
  todo: number;
  overdueCount: number;
  completionRate: number; // 0..100
  lateRate: number;       // 0..100
  totalEstimateMinutes: number;
  openTasksCount: number;
}

/**
 * Calcule les indicateurs clés de performance (KPI) pour un ensemble de tâches donné.
 */
export function calculateProjectMetrics(tasks: Task[]): ProjectMetrics {
  const totalTasks = tasks.length;
  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completed: 0,
      inProgress: 0,
      inReview: 0,
      todo: 0,
      overdueCount: 0,
      completionRate: 0,
      lateRate: 0,
      totalEstimateMinutes: 0,
      openTasksCount: 0,
    };
  }

  let completed = 0;
  let inProgress = 0;
  let inReview = 0;
  let todo = 0;
  let overdueCount = 0;
  let totalEstimateMinutes = 0;

  for (const t of tasks) {
    totalEstimateMinutes += t.estimateMinutes || 0;

    switch (t.status) {
      case 'done':
        completed++;
        break;
      case 'in_progress':
        inProgress++;
        break;
      case 'in_review':
        inReview++;
        break;
      case 'todo':
      default:
        todo++;
        break;
    }

    if (t.dueDate && checkDateOverdue(t.dueDate, t.status)) {
      overdueCount++;
    }
  }

  const completionRate = Math.round((completed / totalTasks) * 100);
  const lateRate = Math.round((overdueCount / totalTasks) * 100);
  const openTasksCount = totalTasks - completed;

  return {
    totalTasks,
    completed,
    inProgress,
    inReview,
    todo,
    overdueCount,
    completionRate,
    lateRate,
    totalEstimateMinutes,
    openTasksCount,
  };
}

/**
 * Calcule le pourcentage de complétion d'une phase de projet (0..100).
 */
export function calculatePhaseProgress(phaseTasks: Task[]): number {
  if (phaseTasks.length === 0) return 0;
  const doneCount = phaseTasks.filter(t => t.status === 'done').length;
  return Math.round((doneCount / phaseTasks.length) * 100);
}

/**
 * Filtre les tâches selon leur statut opérationnel.
 */
export function filterTasksByStatus(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter(t => t.status === status);
}
