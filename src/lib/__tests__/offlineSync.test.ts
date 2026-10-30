import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  enqueueMutation,
  getPendingMutations,
  clearPendingMutations,
  resolveConflictLww,
  flushSyncQueue,
  getSyncStatus,
  getLastSyncTimestamp,
} from '../sync/offlineSync.ts';

describe('SENTINEL GESTION — Phase 7 : Robustesse Hors-Ligne & Synchronisation LWW', () => {
  beforeEach(() => {
    clearPendingMutations();
  });

  describe('1. Stratégie de Résolution de Conflits Last-Write-Wins (LWW)', () => {
    it('1.1 Version locale plus récente que la version distante (ISO Date)', () => {
      const local = { id: 'task-1', title: 'Local Task', updatedAt: '2026-10-19T14:30:00.000Z' };
      const remote = { id: 'task-1', title: 'Remote Task', updatedAt: '2026-10-19T14:00:00.000Z' };

      const result = resolveConflictLww(local, remote);
      assert.equal(result.source, 'local');
      assert.equal(result.winningVersion.title, 'Local Task');
    });

    it('1.2 Version distante plus récente que la version locale (ISO Date)', () => {
      const local = { id: 'task-1', title: 'Local Task', updatedAt: '2026-10-19T10:00:00.000Z' };
      const remote = { id: 'task-1', title: 'Remote Task Updated', updatedAt: '2026-10-19T15:00:00.000Z' };

      const result = resolveConflictLww(local, remote);
      assert.equal(result.source, 'remote');
      assert.equal(result.winningVersion.title, 'Remote Task Updated');
    });

    it('1.3 Horodatages numériques (Unix Epoch ms)', () => {
      const t1 = 1760000000000;
      const t2 = 1760000500000;

      const local = { id: 'exp-1', amount: 1500, updatedAt: t2 };
      const remote = { id: 'exp-1', amount: 1200, updatedAt: t1 };

      const result = resolveConflictLww(local, remote);
      assert.equal(result.source, 'local');
      assert.equal(result.winningVersion.amount, 1500);
    });

    it('1.4 Égalité parfaite des horodatages (priorité optimiste locale conservée)', () => {
      const time = '2026-10-19T12:00:00.000Z';
      const local = { id: 'risk-1', score: 25, updatedAt: time };
      const remote = { id: 'risk-1', score: 20, updatedAt: time };

      const result = resolveConflictLww(local, remote);
      assert.equal(result.source, 'local');
      assert.equal(result.winningVersion.score, 25);
    });

    it('1.5 Résilience en cas d’horodatage absent ou invalide', () => {
      const local = { id: 'doc-1', name: 'Valid Local', updatedAt: '2026-10-19T12:00:00.000Z' };
      const remoteMissing: { id: string; name: string; updatedAt?: string } = { id: 'doc-1', name: 'No Timestamp' };
      const remoteInvalid = { id: 'doc-1', name: 'Bad Date', updatedAt: 'invalid-date' };

      assert.equal(resolveConflictLww(local, remoteMissing).source, 'local');
      assert.equal(resolveConflictLww(local, remoteInvalid).source, 'local');
    });
  });

  describe('2. File d’Attente des Mutations & Déduplication Intelligente', () => {
    it('2.1 Enfilement d’une nouvelle mutation avec statut initial "pending"', () => {
      const mutation = enqueueMutation({
        type: 'CREATE',
        entity: 'task',
        entityId: 'task-101',
        payload: { title: 'Nouvelle tâche déconnectée' },
      });

      assert.ok(mutation.id.startsWith('mut-'));
      assert.equal(mutation.status, 'pending');
      assert.equal(mutation.retryCount, 0);

      const queue = getPendingMutations();
      assert.equal(queue.length, 1);
      assert.equal(queue[0].entityId, 'task-101');
    });

    it('2.2 Déduplication et fusion automatique des payloads pour les mutations de type UPDATE', () => {
      enqueueMutation({
        type: 'UPDATE',
        entity: 'task',
        entityId: 'task-200',
        payload: { title: 'Titre initial', priority: 'medium' },
      });

      // Seconde mise à jour sur la même tâche alors qu'elle est toujours en attente
      enqueueMutation({
        type: 'UPDATE',
        entity: 'task',
        entityId: 'task-200',
        payload: { priority: 'urgent', progress: 50 },
      });

      const queue = getPendingMutations();
      // La file ne doit contenir qu'une seule entrée fusionnée !
      assert.equal(queue.length, 1);
      assert.deepEqual(queue[0].payload, {
        title: 'Titre initial',
        priority: 'urgent',
        progress: 50,
      });
    });

    it('2.3 Entités ou types différents ne doivent pas être écrasés', () => {
      enqueueMutation({
        type: 'CREATE',
        entity: 'task',
        entityId: 'task-1',
        payload: { title: 'Task 1' },
      });
      enqueueMutation({
        type: 'UPDATE',
        entity: 'task',
        entityId: 'task-2',
        payload: { title: 'Task 2' },
      });
      enqueueMutation({
        type: 'DELETE',
        entity: 'task',
        entityId: 'task-3',
        payload: {},
      });

      const queue = getPendingMutations();
      assert.equal(queue.length, 3);
    });
  });

  describe('3. Dépilement Asynchrone, Retries et Gestion des Pannes', () => {
    it('3.1 Dépilement d’une file vide', async () => {
      const result = await flushSyncQueue(async () => true);
      assert.deepEqual(result, { processed: 0, failed: 0, remaining: 0 });
    });

    it('3.2 Traitement réussi de toutes les mutations en attente', async () => {
      enqueueMutation({
        type: 'CREATE',
        entity: 'project',
        entityId: 'prj-1',
        payload: { name: 'Projet Alpha' },
      });
      enqueueMutation({
        type: 'UPDATE',
        entity: 'project',
        entityId: 'prj-1',
        payload: { progress: 80 },
      });

      const executedIds: string[] = [];
      const result = await flushSyncQueue(async (mut) => {
        executedIds.push(mut.entityId);
        return true;
      });

      assert.equal(result.processed, 2);
      assert.equal(result.failed, 0);
      assert.equal(result.remaining, 0);
      assert.equal(getPendingMutations().length, 0);
      assert.ok(getLastSyncTimestamp() !== null, 'L’horodatage de dernière synchronisation doit être enregistré');
    });

    it('3.3 Échec d’exécution incrémente retryCount et conserve l’élément (< 5 essais)', async () => {
      enqueueMutation({
        type: 'UPDATE',
        entity: 'expense',
        entityId: 'exp-55',
        payload: { amount: 300 },
      });

      const result = await flushSyncQueue(async () => false);

      assert.equal(result.processed, 0);
      assert.equal(result.failed, 1);
      assert.equal(result.remaining, 1);

      const queue = getPendingMutations();
      assert.equal(queue.length, 1);
      assert.equal(queue[0].retryCount, 1);
      assert.equal(queue[0].status, 'failed');
    });

    it('3.4 Purge automatique des mutations après 5 échecs consécutifs', async () => {
      enqueueMutation({
        type: 'UPDATE',
        entity: 'risk',
        entityId: 'risk-99',
        payload: { score: 10 },
      });

      // Simule 5 échecs consécutifs
      for (let i = 0; i < 5; i++) {
        await flushSyncQueue(async () => {
          throw new Error('Erreur réseau simulée 503');
        });
      }

      const queue = getPendingMutations();
      assert.equal(queue.length, 0, 'La mutation doit être évincée après 5 tentatives infructueuses');
    });
  });

  describe('4. État Global de Synchronisation (getSyncStatus)', () => {
    it('4.1 Reflète fidèlement le nombre d’éléments en attente et les erreurs', () => {
      const initialStatus = getSyncStatus();
      assert.equal(initialStatus.pendingCount, 0);
      assert.equal(initialStatus.hasErrors, false);

      enqueueMutation({
        type: 'CREATE',
        entity: 'timeEntry',
        entityId: 'te-1',
        payload: { hours: 4 },
      });

      const activeStatus = getSyncStatus();
      assert.equal(activeStatus.pendingCount, 1);
    });
  });
});
