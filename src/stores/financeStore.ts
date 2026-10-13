/**
 * SENTINEL GESTION — Store de Domaine : Finances
 * Gère les dépenses engagées, les devis budgétaires et le suivi des règlements.
 */

import { create } from 'zustand';
import { ProjectExpense, ProjectBudget } from '@/types/sentinel';
import { INITIAL_EXPENSES, INITIAL_BUDGETS } from '@/lib/initialData';
import { generateId } from '@/lib/idUtils';

interface FinanceState {
  expenses: ProjectExpense[];
  budget: ProjectBudget;

  setExpenses: (expenses: ProjectExpense[]) => void;
  setBudget: (budget: ProjectBudget) => void;

  addExpense: (expense: Omit<ProjectExpense, 'id'>) => ProjectExpense;
  updateExpenseStatus: (id: string, status: ProjectExpense['status']) => void;
  deleteExpense: (id: string) => void;
  updateBudget: (targetBudget: number) => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  expenses: INITIAL_EXPENSES,
  budget: INITIAL_BUDGETS[0] || { projectId: 'prj-1', targetBudget: 45000, currency: '€' },

  setExpenses: (expenses) => set({ expenses }),
  setBudget: (budget) => set({ budget }),

  addExpense: (data) => {
    const newExp: ProjectExpense = {
      ...data,
      id: generateId('exp'),
    };
    set((state) => ({ expenses: [newExp, ...state.expenses] }));
    return newExp;
  },

  updateExpenseStatus: (id, status) => {
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === id ? { ...e, status } : e)),
    }));
  },

  deleteExpense: (id) => {
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    }));
  },

  updateBudget: (targetBudget) => {
    set((state) => ({
      budget: { ...state.budget, targetBudget },
    }));
  },
}));
