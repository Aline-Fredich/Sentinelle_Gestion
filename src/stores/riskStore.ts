/**
 * SENTINEL GESTION — Store de Domaine : Gestion des Risques
 * Gère le registre des risques, la matrice d'impact 5x5 et les plans d'atténuation.
 */

import { create } from 'zustand';
import { ProjectRisk } from '@/types/sentinel';
import { INITIAL_RISKS } from '@/lib/initialData';
import { generateId } from '@/lib/idUtils';

interface RiskState {
  risks: ProjectRisk[];
  setRisks: (risks: ProjectRisk[]) => void;
  createRisk: (data: Omit<ProjectRisk, 'id' | 'createdAt'>) => ProjectRisk;
  updateRiskStatus: (id: string, status: ProjectRisk['status']) => void;
  updateRisk: (id: string, partial: Partial<ProjectRisk>) => void;
  deleteRisk: (id: string) => void;
}

export const useRiskStore = create<RiskState>((set) => ({
  risks: INITIAL_RISKS,

  setRisks: (risks) => set({ risks }),

  createRisk: (data) => {
    const newRisk: ProjectRisk = {
      ...data,
      id: generateId('risk'),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ risks: [newRisk, ...state.risks] }));
    return newRisk;
  },

  updateRiskStatus: (id, status) => {
    set((state) => ({
      risks: state.risks.map((r) => (r.id === id ? { ...r, status } : r)),
    }));
  },

  updateRisk: (id, partial) => {
    set((state) => ({
      risks: state.risks.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    }));
  },

  deleteRisk: (id) => {
    set((state) => ({
      risks: state.risks.filter((r) => r.id !== id),
    }));
  },
}));
