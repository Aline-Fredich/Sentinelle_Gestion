/**
 * SENTINEL GESTION — Base de données locale IndexedDB via Dexie
 * Fournit un stockage client robuste, haute capacité (> 100 Mo), avec support hors-ligne.
 */

import Dexie, { type Table } from 'dexie';
import {
  Project,
  ProjectPhase,
  Task,
  TaskDependency,
  ProjectMilestone,
  ProjectDocument,
  ProjectExpense,
  TimeEntry,
  Sprint,
  WikiPage,
  ProjectRisk,
  ProjectShare,
  ActivityEvent,
  NotificationItem,
  WorkspaceInvitation,
  User,
  Workspace,
  ProjectBudget,
} from '@/types/sentinel';

export class SentinelDatabase extends Dexie {
  projects!: Table<Project, string>;
  phases!: Table<ProjectPhase, string>;
  tasks!: Table<Task, string>;
  dependencies!: Table<TaskDependency, string>;
  milestones!: Table<ProjectMilestone, string>;
  documents!: Table<ProjectDocument, string>;
  expenses!: Table<ProjectExpense, string>;
  budgets!: Table<ProjectBudget & { id: string }, string>;
  timeEntries!: Table<TimeEntry, string>;
  sprints!: Table<Sprint, string>;
  wikiPages!: Table<WikiPage, string>;
  risks!: Table<ProjectRisk, string>;
  shares!: Table<ProjectShare, string>;
  activity!: Table<ActivityEvent, string>;
  notifications!: Table<NotificationItem, string>;
  invitations!: Table<WorkspaceInvitation, string>;
  users!: Table<User, string>;
  workspaces!: Table<Workspace, string>;

  constructor() {
    super('SentinelGestionDB');

    this.version(1).stores({
      projects: 'id, workspaceId, status, priority, createdAt',
      phases: 'id, projectId, order',
      tasks: 'id, projectId, phaseId, status, priority, assigneeId, dueDate, createdAt',
      dependencies: 'id, projectId, predecessorTaskId, successorTaskId',
      milestones: 'id, projectId, dueDate, status',
      documents: 'id, projectId, category, updatedAt',
      expenses: 'id, projectId, category, status, date',
      budgets: 'id, projectId',
      timeEntries: 'id, projectId, taskId, userId, date',
      sprints: 'id, projectId, status, startDate, endDate',
      wikiPages: 'id, projectId, slug, category, updatedAt',
      risks: 'id, projectId, severity, status, createdAt',
      shares: 'id, projectId, sharedWithEmail',
      activity: 'id, workspaceId, projectId, createdAt',
      notifications: 'id, userId, read, createdAt',
      invitations: 'id, workspaceId, email, status',
      users: 'id, email, role',
      workspaces: 'id, slug',
    });
  }
}

export const db = new SentinelDatabase();
