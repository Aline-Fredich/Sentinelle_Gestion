import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('SENTINEL GESTION — Phase 6 : Tableaux de Bord, Graphiques & Reporting Exécutif', () => {
  it('1. Calcul du ratio de consommation budgétaire et seuils d’alerte', () => {
    const calculateBudgetStatus = (committed: number, target: number) => {
      const ratio = target > 0 ? Math.round((committed / target) * 100) : 0;
      const isOverBudget = committed > target;
      const isVigilance = !isOverBudget && ratio >= 80;
      return { ratio, isOverBudget, isVigilance };
    };

    // 1. Normal sous 80%
    const normal = calculateBudgetStatus(15000000, 30000000);
    assert.equal(normal.ratio, 50);
    assert.equal(normal.isOverBudget, false);
    assert.equal(normal.isVigilance, false);

    // 2. Seuil de vigilance (≥ 80%)
    const vigilance = calculateBudgetStatus(25000000, 30000000);
    assert.equal(vigilance.ratio, 83);
    assert.equal(vigilance.isOverBudget, false);
    assert.equal(vigilance.isVigilance, true);

    // 3. Dépassement critique (> 100%)
    const overrun = calculateBudgetStatus(35000000, 30000000);
    assert.equal(overrun.ratio, 117);
    assert.equal(overrun.isOverBudget, true);
    assert.equal(overrun.isVigilance, false);
  });

  it('2. Filtrage des risques critiques pour le rapport exécutif CODIR', () => {
    const mockRisks = [
      { id: '1', title: 'R1', severity: 'critical' },
      { id: '2', title: 'R2', severity: 'high' },
      { id: '3', title: 'R3', severity: 'medium' },
      { id: '4', title: 'R4', severity: 'low' },
      { id: '5', title: 'R5', severity: 'critical' },
    ];

    const criticalCount = mockRisks.filter(r => r.severity === 'critical' || r.severity === 'high').length;
    assert.equal(criticalCount, 3, 'Doit identifier 3 risques majeurs (2 critiques + 1 élevé)');
  });

  it('3. Options modulaires du rapport exécutif (sections à cocher)', () => {
    const generateSections = (options: { includeBudget: boolean; includeMilestones: boolean; includeRisks: boolean }) => {
      const sections: string[] = ['header', 'kpis'];
      if (options.includeBudget) sections.push('budget');
      if (options.includeMilestones) sections.push('milestones');
      if (options.includeRisks) sections.push('risks');
      sections.push('footer');
      return sections;
    };

    const allSections = generateSections({ includeBudget: true, includeMilestones: true, includeRisks: true });
    assert.equal(allSections.length, 6);
    assert.ok(allSections.includes('budget'));
    assert.ok(allSections.includes('milestones'));
    assert.ok(allSections.includes('risks'));

    const withoutRisks = generateSections({ includeBudget: true, includeMilestones: true, includeRisks: false });
    assert.equal(withoutRisks.length, 5);
    assert.equal(withoutRisks.includes('risks'), false);
  });

  it('4. Calcul d’avancement de projet sur les tâches validées', () => {
    const calculateProgress = (total: number, completed: number) => {
      return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    assert.equal(calculateProgress(10, 5), 50);
    assert.equal(calculateProgress(12, 12), 100);
    assert.equal(calculateProgress(0, 0), 0);
  });
});
