import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('SENTINEL GESTION — Phase 5 : Vues Métier Clés & Navigation Intuitive', () => {
  it('1. Partitionnement et regroupement des colonnes Kanban', () => {
    const columns = [
      { status: 'todo', label: 'À FAIRE' },
      { status: 'in_progress', label: 'EN COURS' },
      { status: 'in_review', label: 'EN REVUE' },
      { status: 'done', label: 'TERMINÉ' },
    ] as const;

    const mockTasks = [
      { id: '1', title: 'T1', status: 'todo' },
      { id: '2', title: 'T2', status: 'in_progress' },
      { id: '3', title: 'T3', status: 'in_review' },
      { id: '4', title: 'T4', status: 'done' },
      { id: '5', title: 'T5', status: 'todo' },
    ];

    const grouped: Record<string, number> = {};
    for (const col of columns) {
      grouped[col.status] = mockTasks.filter(t => t.status === col.status).length;
    }

    assert.equal(grouped.todo, 2);
    assert.equal(grouped.in_progress, 1);
    assert.equal(grouped.in_review, 1);
    assert.equal(grouped.done, 1);
  });

  it('2. Résolution de l’indicateur visuel de phase sur les cartes Kanban', () => {
    const mockPhases = [
      { id: 'phase-1', name: 'Sprint 1 : Cadrage', colorKey: '#E60000' },
      { id: 'phase-2', name: 'Sprint 2 : Dév Core', colorKey: '#17D0FA' },
    ];

    const getPhaseStyle = (phaseId: string | undefined) => {
      const p = mockPhases.find(item => item.id === phaseId);
      return p ? { borderLeftColor: p.colorKey } : undefined;
    };

    assert.deepEqual(getPhaseStyle('phase-1'), { borderLeftColor: '#E60000' });
    assert.deepEqual(getPhaseStyle('phase-2'), { borderLeftColor: '#17D0FA' });
    assert.equal(getPhaseStyle(undefined), undefined);
  });

  it('3. Calcul de la sévérité dans la matrice de risques 5x5', () => {
    const calculateSeverity = (prob: number, impact: number): 'critical' | 'high' | 'medium' | 'low' => {
      const score = prob * impact;
      if (score >= 16) return 'critical';
      if (score >= 10) return 'high';
      if (score >= 5) return 'medium';
      return 'low';
    };

    assert.equal(calculateSeverity(5, 5), 'critical', '5x5 = 25 -> critique');
    assert.equal(calculateSeverity(4, 4), 'critical', '4x4 = 16 -> critique');
    assert.equal(calculateSeverity(3, 4), 'high', '3x4 = 12 -> élevé');
    assert.equal(calculateSeverity(2, 3), 'medium', '2x3 = 6 -> moyen');
    assert.equal(calculateSeverity(1, 4), 'low', '1x4 = 4 -> faible');
    assert.equal(calculateSeverity(1, 1), 'low', '1x1 = 1 -> faible');
  });

  it('4. Formatage et résolution du fil d’Ariane (Breadcrumb)', () => {
    const resolveBreadcrumb = (activeProjectId: string, projectName?: string, viewTitle = 'Tableau Kanban') => {
      const projectSegment = activeProjectId === 'all' ? 'PORTEFEUILLE PROJETS' : (projectName?.toUpperCase() || 'PROJET ACTIF');
      return `ESPACE / ${projectSegment} / ${viewTitle.toUpperCase()}`;
    };

    assert.equal(
      resolveBreadcrumb('all', undefined, 'Tableau Kanban'),
      'ESPACE / PORTEFEUILLE PROJETS / TABLEAU KANBAN'
    );
    assert.equal(
      resolveBreadcrumb('prj-1', 'Refonte Portail', 'Matrice de criticité'),
      'ESPACE / REFONTE PORTAIL / MATRICE DE CRITICITÉ'
    );
  });
});
