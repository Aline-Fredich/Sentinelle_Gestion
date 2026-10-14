import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateChecklistAutoReview,
  evaluateBudgetThreshold,
  formatWebhookPayload,
  dispatchWebhookNotification,
} from '../ruleEngine.ts';
import type { Task, ProjectBudget, ProjectExpense } from '../../../types/sentinel.ts';

describe('SENTINEL GESTION — Moteur d’Automatismes & Webhooks (Phase 13+)', () => {
  describe('1. Règle : Passage automatique en révision sur complétion de checklist', () => {
    it('ne déclenche rien si la checklist est incomplète', () => {
      const task: Task = {
        id: 't-1',
        workspaceId: 'ws-1',
        projectId: 'p-1',
        title: 'Tâche Test',
        description: '',
        status: 'in_progress',
        priority: 'medium',
        estimateMinutes: 60,
        labels: [],
        checklist: [
          { id: 'c-1', title: 'Sous-tâche 1', isCompleted: true },
          { id: 'c-2', title: 'Sous-tâche 2', isCompleted: false },
        ],
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = evaluateChecklistAutoReview(task);
      assert.equal(result, null);
    });

    it('bascule en « in_review » lorsque 100% de la checklist est cochée', () => {
      const task: Task = {
        id: 't-1',
        workspaceId: 'ws-1',
        projectId: 'p-1',
        title: 'Audit de sécurité',
        description: '',
        status: 'in_progress',
        priority: 'high',
        estimateMinutes: 120,
        labels: [],
        checklist: [
          { id: 'c-1', title: 'Analyse statique', isCompleted: true },
          { id: 'c-2', title: 'Tests d’intrusion', isCompleted: true },
        ],
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = evaluateChecklistAutoReview(task);
      assert.ok(result !== null);
      assert.equal(result.executed, true);
      assert.equal(result.actionType, 'UPDATE_TASK');
      assert.equal(result.targetId, 't-1');
      assert.equal((result.payload as { status: string }).status, 'in_review');
    });
  });

  describe('2. Règle : Alerte de surconsommation budgétaire (85%)', () => {
    const mockBudget: ProjectBudget = {
      projectId: 'p-1',
      targetBudget: 100000,
      currency: 'EUR',
    };

    it('ne déclenche pas d’alerte sous le seuil de 85%', () => {
      const expenses: ProjectExpense[] = [
        { id: 'e-1', projectId: 'p-1', title: 'Serveurs', amount: 50000, category: 'software', date: '2026-10-01', status: 'paid', createdBy: 'u-1' },
      ];

      const result = evaluateBudgetThreshold(mockBudget, expenses);
      assert.equal(result, null);
    });

    it('émet une notification prioritaire dès que les dépenses atteignent 85%', () => {
      const expenses: ProjectExpense[] = [
        { id: 'e-1', projectId: 'p-1', title: 'Développement', amount: 86000, category: 'consulting', date: '2026-10-01', status: 'paid', createdBy: 'u-1' },
      ];

      const result = evaluateBudgetThreshold(mockBudget, expenses);
      assert.ok(result !== null);
      assert.equal(result.executed, true);
      assert.equal(result.actionType, 'CREATE_NOTIFICATION');
      assert.ok(result.message.includes('86%'));
    });
  });

  describe('3. Formatage et Sécurité des Webhooks Sortants (Slack / Teams)', () => {
    it('génère un payload conforme à la structure Slack API', () => {
      const payload = formatWebhookPayload('slack', 'Jalon Atteint', 'Phase 1 livrée avec succès', 'Projet Refonte');
      assert.ok(typeof payload.text === 'string');
      assert.ok((payload.text as string).includes('SENTINEL GESTION'));
      assert.ok(Array.isArray(payload.attachments));
    });

    it('génère un payload conforme à la structure MessageCard Microsoft Teams', () => {
      const payload = formatWebhookPayload('teams', 'Alerte Risque', 'Risque critique identifié');
      assert.equal(payload['@type'], 'MessageCard');
      assert.equal(payload.summary, 'Alerte Risque');
      assert.ok(Array.isArray(payload.sections));
    });

    it('rejette les URLs de webhook non HTTPS', async () => {
      const res = await dispatchWebhookNotification('http://insecure-webhook.com', {});
      assert.equal(res.success, false);
      assert.ok(res.error?.includes('HTTPS'));
    });
  });
});
