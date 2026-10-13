/**
 * SENTINEL GESTION — Domaine Métier Pur : Finances et Coûts de Projet
 * Calcul des dépenses engagées, coût de main-d'œuvre et écarts budgétaires.
 */

import type { ProjectExpense, ProjectBudget, TimeEntry, User } from '../types/sentinel';

export interface FinanceSummary {
  targetBudget: number;
  totalExpenses: number;
  paidExpenses: number;
  pendingExpenses: number;
  laborCost: number;
  totalCommittedCost: number;
  remainingBudget: number;
  consumptionRate: number; // 0..100%
  isOverBudget: boolean;
}

/**
 * Calcule la synthèse financière globale d'un projet.
 */
export function calculateProjectFinances(
  budget: ProjectBudget | undefined,
  expenses: ProjectExpense[],
  timeEntries: TimeEntry[],
  users: User[],
  defaultHourlyRate = 75
): FinanceSummary {
  const targetBudget = budget?.targetBudget || 0;

  // 1. Total des dépenses directes (hors main-d'œuvre directe si non comptée en expense)
  const paidExpenses = expenses
    .filter(e => e.status === 'paid')
    .reduce((sum, e) => sum + e.amount, 0);

  const pendingExpenses = expenses
    .filter(e => e.status !== 'paid')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = paidExpenses + pendingExpenses;

  // 2. Coût de main-d'œuvre issu des feuilles de temps
  const usersMap = new Map<string, User>(users.map(u => [u.id, u]));
  const laborCost = timeEntries.reduce((sum, entry) => {
    const user = usersMap.get(entry.userId);
    const rate = entry.hourlyRate || user?.hourlyRate || defaultHourlyRate;
    const hours = entry.durationMinutes / 60;
    return sum + (hours * rate);
  }, 0);

  // 3. Coût global engagé
  const totalCommittedCost = totalExpenses + laborCost;
  const remainingBudget = targetBudget - totalCommittedCost;
  const consumptionRate = targetBudget > 0 
    ? Math.round((totalCommittedCost / targetBudget) * 100) 
    : 0;

  return {
    targetBudget,
    totalExpenses,
    paidExpenses,
    pendingExpenses,
    laborCost,
    totalCommittedCost,
    remainingBudget,
    consumptionRate,
    isOverBudget: remainingBudget < 0,
  };
}
