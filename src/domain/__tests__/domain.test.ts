import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { wouldCreateDependencyCycle, isTaskBlockedByDependencies } from '../dependencies.ts';
import { calculateProjectFinances } from '../finances.ts';
import { calculateSprintBurndown } from '../burndown.ts';
import { calculateTeamWorkload } from '../workload.ts';
import { calculateProjectMetrics, calculatePhaseProgress } from '../metrics.ts';
import type { Task, TaskDependency, ProjectBudget, ProjectExpense, TimeEntry, User, Sprint } from '../../types/sentinel.ts';

describe('SENTINEL GESTION — Domaine Métier Pur', () => {
  describe('1. Dépendances & Détection Anti-Cycle (DFS)', () => {
    it('détecte un cycle direct A -> B et B -> A', () => {
      const deps: TaskDependency[] = [
        { id: 'dep-1', projectId: 'p1', predecessorTaskId: 'A', successorTaskId: 'B', dependencyType: 'finish_to_start', createdAt: '' }
      ];
      // Tenter d'ajouter B -> A
      const hasCycle = wouldCreateDependencyCycle(deps, 'B', 'A');
      assert.equal(hasCycle, true, 'Devrait détecter le cycle direct A -> B -> A');
    });

    it('autorise une dépendance linéaire valide A -> B -> C', () => {
      const deps: TaskDependency[] = [
        { id: 'dep-1', projectId: 'p1', predecessorTaskId: 'A', successorTaskId: 'B', dependencyType: 'finish_to_start', createdAt: '' }
      ];
      // B -> C est valide
      const hasCycle = wouldCreateDependencyCycle(deps, 'B', 'C');
      assert.equal(hasCycle, false, 'Ne devrait pas détecter de cycle');
    });

    it('détecte un cycle indirect A -> B -> C -> A', () => {
      const deps: TaskDependency[] = [
        { id: 'dep-1', projectId: 'p1', predecessorTaskId: 'A', successorTaskId: 'B', dependencyType: 'finish_to_start', createdAt: '' },
        { id: 'dep-2', projectId: 'p1', predecessorTaskId: 'B', successorTaskId: 'C', dependencyType: 'finish_to_start', createdAt: '' }
      ];
      // Tenter d'ajouter C -> A
      const hasCycle = wouldCreateDependencyCycle(deps, 'C', 'A');
      assert.equal(hasCycle, true, 'Devrait détecter le cycle indirect');
    });

    it('détecte l’auto-dépendance A -> A', () => {
      assert.equal(wouldCreateDependencyCycle([], 'A', 'A'), true, 'Auto-dépendance interdite');
    });

    it('vérifie le blocage opérationnel d’une tâche par des prédécesseurs non terminés', () => {
      const deps: TaskDependency[] = [
        { id: 'dep-1', projectId: 'p1', predecessorTaskId: 'tsk-1', successorTaskId: 'tsk-2', dependencyType: 'finish_to_start', createdAt: '' }
      ];
      const tasks: Task[] = [
        { id: 'tsk-1', workspaceId: 'ws-1', projectId: 'prj-1', title: 'T1', description: '', status: 'in_progress', priority: 'high', estimateMinutes: 60, labels: [], order: 0, createdAt: '', updatedAt: '', checklist: [], attachments: [], customFieldValues: {} },
        { id: 'tsk-2', workspaceId: 'ws-1', projectId: 'prj-1', title: 'T2', description: '', status: 'todo', priority: 'medium', estimateMinutes: 60, labels: [], order: 1, createdAt: '', updatedAt: '', checklist: [], attachments: [], customFieldValues: {} }
      ];
      const checkBlocked = isTaskBlockedByDependencies('tsk-2', deps, tasks);
      assert.equal(checkBlocked.isBlocked, true, 'T2 devrait être bloquée par T1');
      assert.deepEqual(checkBlocked.blockingTaskIds, ['tsk-1']);

      // Si T1 passe à "done", le blocage est levé
      tasks[0].status = 'done';
      const checkUnblocked = isTaskBlockedByDependencies('tsk-2', deps, tasks);
      assert.equal(checkUnblocked.isBlocked, false, 'T2 devrait être débloquée');
      assert.equal(checkUnblocked.blockingTaskIds.length, 0);
    });
  });

  describe('2. Finances & Budgets', () => {
    it('calcule la somme dépenses directes + coût de main d’œuvre et détecte le dépassement', () => {
      const budget: ProjectBudget = {
        projectId: 'prj-1',
        targetBudget: 10000,
        currency: '€'
      };
      const expenses: ProjectExpense[] = [
        { id: 'e1', projectId: 'prj-1', title: 'SaaS', amount: 3000, category: 'software', date: '2026-10-01', status: 'paid', createdBy: 'Admin' },
        { id: 'e2', projectId: 'prj-1', title: 'Audit', amount: 2000, category: 'consulting', date: '2026-10-02', status: 'planned', createdBy: 'Admin' }
      ];
      const timeEntries: TimeEntry[] = [
        { id: 't1', taskId: 'tsk-1', projectId: 'prj-1', userId: 'u-1', userName: 'Dev', description: 'Développement', durationMinutes: 3000, date: '2026-10-05', hourlyRate: 100, createdAt: '2026-10-05T00:00:00Z' } // 50h * 100€ = 5000€
      ];
      const users: User[] = [
        { id: 'u-1', name: 'Dev', email: 'dev@test.fr', role: 'member', avatar: '', jobTitle: 'Développeur', hourlyRate: 100, weeklyCapacityMinutes: 2100 }
      ];

      const res = calculateProjectFinances(budget, expenses, timeEntries, users, 75);
      // Dépenses = 3000 + 2000 = 5000
      // Main d'oeuvre = 50h * 100 = 5000
      // Total = 10000
      assert.equal(res.totalExpenses, 5000);
      assert.equal(res.laborCost, 5000);
      assert.equal(res.totalCommittedCost, 10000);
      assert.equal(res.remainingBudget, 0);
      assert.equal(res.consumptionRate, 100);
      assert.equal(res.isOverBudget, false);

      // Si on ajoute 1000€ de dépense supplémentaire -> dépassement
      expenses.push({ id: 'e3', projectId: 'prj-1', title: 'Extra', amount: 1000, category: 'other', date: '2026-10-03', status: 'paid', createdBy: 'Admin' });
      const resOver = calculateProjectFinances(budget, expenses, timeEntries, users, 75);
      assert.equal(resOver.totalCommittedCost, 11000);
      assert.equal(resOver.remainingBudget, -1000);
      assert.equal(resOver.isOverBudget, true);
    });
  });

  describe('3. Vélocité Agile & Burndown', () => {
    it('génère 7 points de progression et respecte les bornes vectorielles SVG 40..580 et 20..100', () => {
      const sprint: Sprint = {
        id: 'sp-1',
        projectId: 'prj-1',
        name: 'Sprint 1',
        goal: 'Finaliser MVP',
        startDate: '2026-10-01',
        endDate: '2026-10-15',
        status: 'active',
        taskIds: ['tsk-1', 'tsk-2']
      };
      const tasks: Task[] = [
        { id: 'tsk-1', workspaceId: 'ws-1', projectId: 'prj-1', title: 'T1', description: '', status: 'done', priority: 'high', estimateMinutes: 60, storyPoints: 5, completedAt: '2026-10-03T10:00:00Z', labels: [], order: 0, createdAt: '', updatedAt: '', checklist: [], attachments: [], customFieldValues: {} },
        { id: 'tsk-2', workspaceId: 'ws-1', projectId: 'prj-1', title: 'T2', description: '', status: 'in_progress', priority: 'medium', estimateMinutes: 60, storyPoints: 8, labels: [], order: 1, createdAt: '', updatedAt: '', checklist: [], attachments: [], customFieldValues: {} }
      ];

      const getPoints = (t: Task) => t.storyPoints || 0;
      const res = calculateSprintBurndown(sprint, tasks, getPoints, new Date('2026-10-05T00:00:00Z'));

      assert.equal(res.totalPoints, 13);
      assert.equal(res.completedPoints, 5);
      assert.equal(res.remainingPoints, 8);
      assert.equal(res.points.length, 7);

      // Vérification des coordonnées vectorielles
      assert.equal(res.points[0].x, 40);
      assert.equal(res.points[6].x, 580);
      for (const p of res.points) {
        assert.ok(p.x >= 40 && p.x <= 580);
        assert.ok(p.idealY >= 20 && p.idealY <= 100);
      }
    });
  });

  describe('4. Capacité d’Équipe & Surcharges (35h/semaine)', () => {
    it('détecte un collaborateur surchargé au-delà de sa capacité hebdomadaire', () => {
      const users: User[] = [
        { id: 'u-1', name: 'Alice', email: 'alice@test.fr', role: 'member', avatar: '', jobTitle: 'Ingénieure', weeklyCapacityMinutes: 2100 } // 35h
      ];
      const tasks: Task[] = [
        { id: 't1', workspaceId: 'ws-1', projectId: 'prj-1', title: 'T1', description: '', status: 'in_progress', priority: 'high', assigneeId: 'u-1', estimateMinutes: 1500, labels: [], order: 0, createdAt: '', updatedAt: '', checklist: [], attachments: [], customFieldValues: {} },
        { id: 't2', workspaceId: 'ws-1', projectId: 'prj-1', title: 'T2', description: '', status: 'todo', priority: 'medium', assigneeId: 'u-1', estimateMinutes: 900, labels: [], order: 1, createdAt: '', updatedAt: '', checklist: [], attachments: [], customFieldValues: {} }
      ];
      // Total assigné = 2400 min > 2100 min
      const workload = calculateTeamWorkload(users, tasks);
      assert.equal(workload.length, 1);
      assert.equal(workload[0].totalAssignedMinutes, 2400);
      assert.equal(workload[0].weeklyCapacityMinutes, 2100);
      assert.equal(workload[0].isOverloaded, true);
      assert.equal(workload[0].utilizationRate, 114); // 2400 / 2100 * 100 = 114%
    });
  });

  describe('5. Métriques Projet & Avancement des Phases', () => {
    it('calcule exactement le pourcentage d’achèvement', () => {
      const tasks: Task[] = [
        { id: 't1', workspaceId: 'ws-1', projectId: 'prj-1', title: 'T1', description: '', status: 'done', priority: 'high', estimateMinutes: 60, labels: [], order: 0, createdAt: '', updatedAt: '', checklist: [], attachments: [], customFieldValues: {} },
        { id: 't2', workspaceId: 'ws-1', projectId: 'prj-1', title: 'T2', description: '', status: 'done', priority: 'medium', estimateMinutes: 60, labels: [], order: 1, createdAt: '', updatedAt: '', checklist: [], attachments: [], customFieldValues: {} },
        { id: 't3', workspaceId: 'ws-1', projectId: 'prj-1', title: 'T3', description: '', status: 'todo', priority: 'low', estimateMinutes: 60, labels: [], order: 2, createdAt: '', updatedAt: '', checklist: [], attachments: [], customFieldValues: {} },
        { id: 't4', workspaceId: 'ws-1', projectId: 'prj-1', title: 'T4', description: '', status: 'in_progress', priority: 'medium', estimateMinutes: 60, labels: [], order: 3, createdAt: '', updatedAt: '', checklist: [], attachments: [], customFieldValues: {} }
      ];
      const metrics = calculateProjectMetrics(tasks);
      assert.equal(metrics.totalTasks, 4);
      assert.equal(metrics.completed, 2);
      assert.equal(metrics.completionRate, 50);

      const phaseProgress = calculatePhaseProgress(tasks);
      assert.equal(phaseProgress, 50);
    });
  });
});
