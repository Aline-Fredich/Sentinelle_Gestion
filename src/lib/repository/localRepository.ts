/**
 * SENTINEL GESTION — Implémentation LocalRepository (IndexedDB / Dexie)
 * Gère les opérations CRUD et la migration automatique depuis localStorage.
 */

import { Table } from 'dexie';
import { Repository } from './types';
import { db } from './dexieDb';
import {
  ProjectBudget,
  TimeEntry,
  Sprint,
  WikiPage,
  ProjectRisk,
  ProjectShare,
  User,
  Workspace,
} from '@/types/sentinel';
import {
  INITIAL_PROJECTS,
  INITIAL_PHASES,
  INITIAL_TASKS,
  INITIAL_DEPENDENCIES,
  INITIAL_MILESTONES,
  INITIAL_DOCUMENTS,
  INITIAL_EXPENSES,
  INITIAL_BUDGETS,
  INITIAL_TIME_ENTRIES,
  INITIAL_SPRINTS,
  INITIAL_WIKI_PAGES,
  INITIAL_RISKS,
  INITIAL_USERS,
  INITIAL_WORKSPACE,
  INITIAL_ACTIVITIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_INVITATIONS,
} from '@/lib/initialData';

export class DexieRepository<T extends { id: string }> implements Repository<T> {
  constructor(private table: Table<T, string>) {}

  async list(filter?: (item: T) => boolean): Promise<T[]> {
    const all = await this.table.toArray();
    return filter ? all.filter(filter) : all;
  }

  async get(id: string): Promise<T | null> {
    const item = await this.table.get(id);
    return item || null;
  }

  async create(item: T): Promise<T> {
    await this.table.put(item);
    return item;
  }

  async update(id: string, partial: Partial<T>): Promise<T> {
    const existing = await this.table.get(id);
    if (!existing) {
      throw new Error(`Élément avec l'ID ${id} non trouvé dans la table ${this.table.name}`);
    }
    const updated = { ...existing, ...partial };
    await this.table.put(updated);
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    await this.table.delete(id);
    return true;
  }

  async clear(): Promise<void> {
    await this.table.clear();
  }
}

/**
 * Migration automatique depuis les anciennes clés localStorage vers IndexedDB Dexie
 */
export async function initializeAndMigrateDatabase(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const count = await db.projects.count();
  if (count > 0) {
    // La base IndexedDB contient déjà des données valides
    return true;
  }

  // Vérification de données pré-existantes dans localStorage
  let savedData: Record<string, unknown> | null = null;
  const storageKeys = [
    'sentinel_gestion_state_v1',
    'sentinel_de_gestion_state_v1',
    'software_gestion_state_v1',
  ];

  for (const key of storageKeys) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        savedData = JSON.parse(raw);
        break;
      } catch (err) {
        console.warn(`Erreur de lecture sur ${key}`, err);
      }
    }
  }

  // Transaction d'insertion initiale ou de migration
  await db.transaction('rw', [
    db.projects,
    db.phases,
    db.tasks,
    db.dependencies,
    db.milestones,
    db.documents,
    db.expenses,
    db.budgets,
    db.timeEntries,
    db.sprints,
    db.wikiPages,
    db.risks,
    db.shares,
    db.users,
    db.workspaces,
    db.activity,
    db.notifications,
    db.invitations,
  ], async () => {
    if (savedData) {
      // Insertion des données migrées depuis localStorage
      if (Array.isArray(savedData.projects)) await db.projects.bulkPut(savedData.projects);
      if (Array.isArray(savedData.phases)) await db.phases.bulkPut(savedData.phases);
      if (Array.isArray(savedData.tasks)) await db.tasks.bulkPut(savedData.tasks);
      if (Array.isArray(savedData.dependencies)) await db.dependencies.bulkPut(savedData.dependencies);
      if (Array.isArray(savedData.milestones)) await db.milestones.bulkPut(savedData.milestones);
      if (Array.isArray(savedData.documents)) await db.documents.bulkPut(savedData.documents);
      if (Array.isArray(savedData.expenses)) await db.expenses.bulkPut(savedData.expenses);
      if (savedData.budget && typeof savedData.budget === 'object') {
        const b = savedData.budget as ProjectBudget;
        await db.budgets.put({ id: b.projectId || 'prj-1', ...b });
      }
      if (Array.isArray(savedData.timeEntries)) await db.timeEntries.bulkPut(savedData.timeEntries as TimeEntry[]);
      if (Array.isArray(savedData.sprints)) await db.sprints.bulkPut(savedData.sprints as Sprint[]);
      if (Array.isArray(savedData.wikiPages)) await db.wikiPages.bulkPut(savedData.wikiPages as WikiPage[]);
      if (Array.isArray(savedData.risks)) await db.risks.bulkPut(savedData.risks as ProjectRisk[]);
      if (Array.isArray(savedData.shares)) await db.shares.bulkPut(savedData.shares as ProjectShare[]);
      if (Array.isArray(savedData.users)) await db.users.bulkPut(savedData.users as User[]);
      if (savedData.workspace && typeof savedData.workspace === 'object') {
        await db.workspaces.put(savedData.workspace as Workspace);
      }
      if (Array.isArray(savedData.activity)) await db.activity.bulkPut(savedData.activity);
      if (Array.isArray(savedData.notifications)) await db.notifications.bulkPut(savedData.notifications);
      if (Array.isArray(savedData.invitations)) await db.invitations.bulkPut(savedData.invitations);
    } else {
      // Chargement initial d'usine complet
      await db.projects.bulkPut(INITIAL_PROJECTS);
      await db.phases.bulkPut(INITIAL_PHASES);
      await db.tasks.bulkPut(INITIAL_TASKS);
      await db.dependencies.bulkPut(INITIAL_DEPENDENCIES);
      await db.milestones.bulkPut(INITIAL_MILESTONES);
      await db.documents.bulkPut(INITIAL_DOCUMENTS);
      await db.expenses.bulkPut(INITIAL_EXPENSES);
      await db.budgets.bulkPut(INITIAL_BUDGETS.map((b) => ({ id: b.projectId, ...b })));
      await db.timeEntries.bulkPut(INITIAL_TIME_ENTRIES);
      await db.sprints.bulkPut(INITIAL_SPRINTS);
      await db.wikiPages.bulkPut(INITIAL_WIKI_PAGES);
      await db.risks.bulkPut(INITIAL_RISKS);
      await db.users.bulkPut(INITIAL_USERS);
      await db.workspaces.put(INITIAL_WORKSPACE);
      await db.activity.bulkPut(INITIAL_ACTIVITIES);
      await db.notifications.bulkPut(INITIAL_NOTIFICATIONS);
      await db.invitations.bulkPut(INITIAL_INVITATIONS);
    }
  });

  return true;
}
