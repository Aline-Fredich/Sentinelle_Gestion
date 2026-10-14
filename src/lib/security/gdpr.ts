/**
 * SENTINEL GESTION — Conformité RGPD (Articles 15, 17, 20 & 30)
 * Export de portabilité des données personnelles et Droit à l'Oubli (Anonymisation irréversible).
 */

import type { User, Task, TimeEntry, ActivityEvent } from '../../types/sentinel.ts';
import { createLocalAvatarSvg } from '../avatarUtils.ts';

export interface GdprExportData {
  metadata: {
    exportDate: string;
    rgpdArticle: string;
    schemaVersion: string;
    system: string;
    legalNotice: string;
  };
  userProfile: Partial<User>;
  assignedTasks: Array<{
    id: string;
    title: string;
    projectId: string;
    status: string;
    priority: string;
    dueDate?: string;
  }>;
  timeLogs: Array<{
    id: string;
    date: string;
    minutes: number;
    description: string;
    projectId: string;
  }>;
  activities: Array<{
    id: string;
    actionType: string;
    createdAt: string;
  }>;
}

export interface GdprAnonymizationResult {
  success: boolean;
  userId: string;
  anonymizedAt: string;
  affectedTasksCount: number;
  affectedTimeLogsCount: number;
  anonymizedEmail: string;
}

/**
 * Exporte l'intégralité des données à caractère personnel d'un utilisateur sous format JSON standardisé
 * (Conformité RGPD — Article 20 : Droit à la portabilité des données).
 */
export function exportUserPersonalData(
  userId: string,
  data: {
    users: User[];
    tasks: Task[];
    timeEntries: TimeEntry[];
    activities: ActivityEvent[];
  }
): GdprExportData | null {
  const targetUser = data.users.find(u => u.id === userId);
  if (!targetUser) return null;

  const assignedTasks = data.tasks
    .filter(t => t.assigneeId === userId || (t.assigneeIds && t.assigneeIds.includes(userId)))
    .map(t => ({
      id: t.id,
      title: t.title,
      projectId: t.projectId,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
    }));

  const timeLogs = data.timeEntries
    .filter(e => e.userId === userId)
    .map(e => ({
      id: e.id,
      date: e.date,
      minutes: e.durationMinutes,
      description: e.description,
      projectId: e.projectId,
    }));

  const userActivities = data.activities
    .filter(a => a.userId === userId)
    .map(a => ({
      id: a.id,
      actionType: a.actionType,
      createdAt: a.createdAt,
    }));

  return {
    metadata: {
      exportDate: new Date().toISOString(),
      rgpdArticle: 'Article 20 — Droit à la portabilité des données',
      schemaVersion: '1.0.0',
      system: 'SENTINEL GESTION',
      legalNotice: 'Ces données sont fournies dans un format ouvert, structuré et lisible par machine.',
    },
    userProfile: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      jobTitle: targetUser.jobTitle,
      weeklyCapacityMinutes: targetUser.weeklyCapacityMinutes,
      hourlyRate: targetUser.hourlyRate,
    },
    assignedTasks,
    timeLogs,
    activities: userActivities,
  };
}

/**
 * Applique le Droit à l'Effacement / Droit à l'Oubli (Article 17 du RGPD).
 * Anonymise de façon irréversible l'identité du collaborateur tout en préservant
 * la cohérence structurelle du projet (durée totale des chantiers, métriques financières).
 */
export function anonymizeUserData(
  userId: string,
  state: {
    users: User[];
    tasks: Task[];
    timeEntries: TimeEntry[];
  }
): {
  updatedUsers: User[];
  anonymizationResult: GdprAnonymizationResult;
} {
  const targetUser = state.users.find(u => u.id === userId);
  const hashSuffix = Math.random().toString(36).substring(2, 8);
  const anonymizedEmail = `anonyme-${hashSuffix}@rgpd.sentinel.local`;
  const anonymizedName = `Collaborateur Anonymisé (${hashSuffix})`;

  const updatedUsers = state.users.map(u => {
    if (u.id !== userId) return u;
    return {
      ...u,
      name: anonymizedName,
      email: anonymizedEmail,
      jobTitle: 'Compte Anonymisé (RGPD)',
      avatar: createLocalAvatarSvg(anonymizedName, '#64748b', '#475569'),
      hourlyRate: undefined,
    };
  });

  const affectedTasksCount = state.tasks.filter(
    t => t.assigneeId === userId || (t.assigneeIds && t.assigneeIds.includes(userId))
  ).length;

  const affectedTimeLogsCount = state.timeEntries.filter(e => e.userId === userId).length;

  return {
    updatedUsers,
    anonymizationResult: {
      success: !!targetUser,
      userId,
      anonymizedAt: new Date().toISOString(),
      affectedTasksCount,
      affectedTimeLogsCount,
      anonymizedEmail,
    },
  };
}
