import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { executePrototypeMigration, createPreMigrationBackup, rollbackMigration, LEGACY_KEYS } from '../prototypeMigration.ts';

// Mock simple de localStorage en mémoire pour l'environnement Node
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe('SENTINEL GESTION — Moteur de Migration des Données Prototype (Phase 9)', () => {
  let mockStorage: LocalStorageMock;

  beforeEach(() => {
    mockStorage = new LocalStorageMock();
    (globalThis as unknown as { window: unknown }).window = globalThis;
    (globalThis as unknown as { localStorage: unknown }).localStorage = mockStorage;
  });

  it('gère l’absence de données antérieures sans erreur', () => {
    const result = executePrototypeMigration();
    assert.equal(result.success, true);
    assert.equal(result.migratedProjectsCount, 0);
    assert.equal(result.migratedTasksCount, 0);
    assert.ok(result.warnings.some(w => w.includes('Aucune donnée')));
  });

  it('effectue une sauvegarde avant migration et convertit les projets et tâches legacy', () => {
    const legacyProjects = [
      { id: 'old-1', name: 'Refonte Site Web', description: 'Migration CMS', status: 'active', color: 'indigo', startDate: '2026-01-01', endDate: '2026-06-30' }
    ];
    const legacyTasks = [
      { id: 'tsk-old-1', title: 'Intégration Design', status: 'in_progress', priority: 3, estimate: 5, tags: ['Design', 'UI'] },
      { id: 'tsk-old-2', title: 'Audit de conformité', status: 'done', priority: 'critique', completed: true }
    ];

    mockStorage.setItem('sentinel_projects_v1', JSON.stringify({ projects: legacyProjects }));
    mockStorage.setItem('sentinel_tasks_v1', JSON.stringify({ tasks: legacyTasks }));

    const result = executePrototypeMigration();

    assert.equal(result.success, true);
    assert.equal(result.migratedProjectsCount, 1);
    assert.equal(result.migratedTasksCount, 2);
    assert.ok(result.backupKey.startsWith('sentinel_migration_backup_'));

    // Vérifier la présence de la sauvegarde dans le stockage
    const backupRaw = mockStorage.getItem(result.backupKey);
    assert.ok(backupRaw !== null);
    const backupObj = JSON.parse(backupRaw!);
    assert.ok(backupObj['sentinel_projects_v1'] !== undefined);
  });

  it('permet un rollback fidèle des clés legacy sauvegardées', () => {
    mockStorage.setItem('sentinel_v1', JSON.stringify({ version: '0.9.0' }));
    const { backupKey } = createPreMigrationBackup();

    // Modification ultérieure
    mockStorage.setItem('sentinel_v1', 'corrupted_state');

    // Rollback
    const restored = rollbackMigration(backupKey);
    assert.equal(restored, true);
    assert.equal(mockStorage.getItem('sentinel_v1'), JSON.stringify({ version: '0.9.0' }));
  });
});
