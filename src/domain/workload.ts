/**
 * SENTINEL GESTION — Domaine Métier Pur : Charge d'Équipe et Capacités
 * Analyse de charge hebdomadaire, détection de surcharge et distribution des tâches.
 */

import type { Task, User } from '../types/sentinel';

export interface UserWorkload {
  userId: string;
  userName: string;
  userAvatar: string;
  jobTitle: string;
  assignedTasksCount: number;
  totalAssignedMinutes: number;
  weeklyCapacityMinutes: number;
  utilizationRate: number; // 0..100+%
  isOverloaded: boolean;
}

/**
 * Calcule la charge de travail actuelle de chaque collaborateur.
 */
export function calculateTeamWorkload(
  users: User[],
  tasks: Task[]
): UserWorkload[] {
  // Filtrer les tâches non terminées (todo, in_progress, in_review)
  const openTasks = tasks.filter(t => t.status !== 'done');

  return users.map(u => {
    const userTasks = openTasks.filter(t => t.assigneeId === u.id);
    const assignedTasksCount = userTasks.length;
    const totalAssignedMinutes = userTasks.reduce((sum, t) => sum + (t.estimateMinutes || 0), 0);
    const weeklyCapacityMinutes = u.weeklyCapacityMinutes || 2100; // 35h par défaut

    const utilizationRate = weeklyCapacityMinutes > 0
      ? Math.round((totalAssignedMinutes / weeklyCapacityMinutes) * 100)
      : 0;

    return {
      userId: u.id,
      userName: u.name,
      userAvatar: u.avatar,
      jobTitle: u.jobTitle,
      assignedTasksCount,
      totalAssignedMinutes,
      weeklyCapacityMinutes,
      utilizationRate,
      isOverloaded: utilizationRate > 100,
    };
  });
}
