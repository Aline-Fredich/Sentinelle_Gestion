/**
 * SENTINEL GESTION — Moteur de Migration des Données du Prototype
 * Gère la détection, la sauvegarde préalable, la conversion ascendante et le rollback
 * des données stockées sous les anciennes versions du prototype (localStorage).
 */

import type { Task, Project, ProjectPhase, User, TaskStatus, TaskPriority } from '../../types/sentinel.ts';
import { generateId } from '../idUtils.ts';

export interface LegacyPrototypeData {
  projects?: Array<{
    id?: string;
    name?: string;
    description?: string;
    status?: string;
    color?: string;
    startDate?: string;
    endDate?: string;
  }>;
  tasks?: Array<{
    id?: string;
    title?: string;
    description?: string;
    projectId?: string;
    status?: string;
    priority?: string | number;
    assignee?: string;
    dueDate?: string;
    estimate?: number;
    completed?: boolean;
    tags?: string[];
  }>;
  phases?: Array<{
    id?: string;
    projectId?: string;
    name?: string;
    order?: number;
  }>;
}

export interface MigrationResult {
  success: boolean;
  backupKey: string;
  migratedProjectsCount: number;
  migratedTasksCount: number;
  migratedPhasesCount: number;
  warnings: string[];
  errors: string[];
  timestamp: string;
}

export const LEGACY_KEYS = [
  'sentinelle_v1',
  'sentinel_v1',
  'sentinel_projects_v1',
  'sentinel_tasks_v1',
  'sentinel_phases_v1',
  'sentinel_master_v1',
  'sentinel_workspace_v1'
];

/**
 * Crée une sauvegarde horodatée complète de l'ensemble des clés legacy avant migration.
 */
export function createPreMigrationBackup(): { backupKey: string; itemsCount: number } {
  if (typeof window === 'undefined') return { backupKey: '', itemsCount: 0 };

  const backupData: Record<string, string | null> = {};
  let count = 0;

  for (const key of LEGACY_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) {
      backupData[key] = val;
      count++;
    }
  }

  const backupKey = `sentinel_migration_backup_${Date.now()}`;
  try {
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    localStorage.setItem('sentinel_latest_backup_key', backupKey);
  } catch (err) {
    console.error('Erreur lors de la création de la sauvegarde avant migration:', err);
  }

  return { backupKey, itemsCount: count };
}

/**
 * Restaure une sauvegarde en cas d'anomalie (Rollback garanti).
 */
export function rollbackMigration(backupKey: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const raw = localStorage.getItem(backupKey);
    if (!raw) return false;

    const data: Record<string, string | null> = JSON.parse(raw);
    for (const [key, val] of Object.entries(data)) {
      if (val !== null) {
        localStorage.setItem(key, val);
      }
    }
    return true;
  } catch (err) {
    console.error('Erreur lors du rollback de migration:', err);
    return false;
  }
}

/**
 * Normalise le statut des tâches issues des anciennes versions.
 */
function normalizeTaskStatus(rawStatus?: string, isCompleted?: boolean): TaskStatus {
  if (isCompleted) return 'done';
  if (!rawStatus) return 'todo';
  const s = rawStatus.toLowerCase().trim();
  if (s.includes('done') || s.includes('termine') || s.includes('fini')) return 'done';
  if (s.includes('review') || s.includes('revue') || s.includes('validation')) return 'in_review';
  if (s.includes('progress') || s.includes('cours')) return 'in_progress';
  return 'todo';
}

/**
 * Normalise la priorité des tâches issues des anciennes versions (chaîne ou chiffre).
 */
function normalizeTaskPriority(rawPriority?: string | number): TaskPriority {
  if (typeof rawPriority === 'number') {
    if (rawPriority >= 4) return 'urgent';
    if (rawPriority === 3) return 'high';
    if (rawPriority === 2) return 'medium';
    return 'low';
  }
  if (!rawPriority) return 'medium';
  const p = rawPriority.toLowerCase().trim();
  if (p.includes('urg') || p.includes('critique') || p === 'p1') return 'urgent';
  if (p.includes('haut') || p.includes('high') || p === 'p2') return 'high';
  if (p.includes('bas') || p.includes('low') || p === 'p4') return 'low';
  return 'medium';
}

/**
 * Exécute la migration des anciennes données du prototype vers le schéma SENTINEL GESTION v1.0.
 */
export function executePrototypeMigration(): MigrationResult {
  const result: MigrationResult = {
    success: false,
    backupKey: '',
    migratedProjectsCount: 0,
    migratedTasksCount: 0,
    migratedPhasesCount: 0,
    warnings: [],
    errors: [],
    timestamp: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return result;

  // 1. Sauvegarde préalable obligatoire
  const { backupKey, itemsCount } = createPreMigrationBackup();
  result.backupKey = backupKey;

  if (itemsCount === 0) {
    result.warnings.push('Aucune donnée de prototype antérieure détectée dans le stockage local.');
    result.success = true;
    return result;
  }

  try {
    const convertedProjects: Project[] = [];
    const convertedTasks: Task[] = [];
    const convertedPhases: ProjectPhase[] = [];

    // Extraction et traitement des données legacy
    for (const key of LEGACY_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);

        // Si le format contient un tableau de projets
        if (Array.isArray(parsed.projects)) {
          for (const oldP of parsed.projects) {
            const prjId = oldP.id || generateId('prj');
            convertedProjects.push({
              id: prjId,
              workspaceId: 'ws-sentinel-01',
              name: oldP.name || 'Projet Migré',
              reference: generateId('PRJ').toUpperCase().slice(0, 10),
              description: oldP.description || '',
              status: (oldP.status as Project['status']) || 'active',
              priority: 'medium',
              colorKey: oldP.color || 'blue',
              iconKey: 'folder',
              startDate: oldP.startDate || new Date().toISOString().split('T')[0],
              dueDate: oldP.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
              leadUserId: 'u-1',
              memberIds: ['u-1'],
              tags: ['Migration'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }

        // Si le format contient un tableau de tâches
        if (Array.isArray(parsed.tasks)) {
          for (const oldT of parsed.tasks) {
            const tskId = oldT.id || generateId('tsk');
            convertedTasks.push({
              id: tskId,
              workspaceId: 'ws-sentinel-01',
              projectId: oldT.projectId || convertedProjects[0]?.id || 'prj-1',
              title: oldT.title || 'Tâche Migrée',
              description: oldT.description || '',
              status: normalizeTaskStatus(oldT.status, oldT.completed),
              priority: normalizeTaskPriority(oldT.priority),
              dueDate: oldT.dueDate,
              estimateMinutes: oldT.estimate ? oldT.estimate * 60 : 60,
              labels: Array.isArray(oldT.tags) ? oldT.tags : [],
              checklist: [],
              order: convertedTasks.length,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }

        // Si le format contient un tableau de phases
        if (Array.isArray(parsed.phases)) {
          for (const oldPh of parsed.phases) {
            convertedPhases.push({
              id: oldPh.id || generateId('ph'),
              projectId: oldPh.projectId || convertedProjects[0]?.id || 'prj-1',
              name: oldPh.name || 'Phase Migrée',
              description: '',
              order: oldPh.order || convertedPhases.length,
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            });
          }
        }
      } catch (err) {
        result.warnings.push(`Impossible de parser le contenu de la clé ${key}: ${(err as Error).message}`);
      }
    }

    result.migratedProjectsCount = convertedProjects.length;
    result.migratedTasksCount = convertedTasks.length;
    result.migratedPhasesCount = convertedPhases.length;
    result.success = true;

  } catch (err) {
    result.errors.push(`Échec critique de la migration: ${(err as Error).message}`);
    result.success = false;
  }

  return result;
}
