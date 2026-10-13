/**
 * SENTINEL GESTION — Store de Domaine : Interface Utilisateur (UI)
 * Gère la vue active, les critères de recherche et filtres de navigation.
 */

import { create } from 'zustand';
import { ActiveView, TaskPriority, TaskStatus } from '@/types/sentinel';

interface UIState {
  activeView: ActiveView;
  searchQuery: string;
  statusFilter: TaskStatus | 'all';
  priorityFilter: TaskPriority | 'all';
  theme: 'light' | 'dark' | 'system';

  setActiveView: (view: ActiveView) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: TaskStatus | 'all') => void;
  setPriorityFilter: (filter: TaskPriority | 'all') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: 'overview',
  searchQuery: '',
  statusFilter: 'all',
  priorityFilter: 'all',
  theme: 'system',

  setActiveView: (activeView) => set({ activeView }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
  setTheme: (theme) => set({ theme }),
}));
