/**
 * SENTINEL GESTION — Store de Domaine : Suivi du Temps
 * Gère le chronomètre en direct persistant et les feuilles de temps individuelles.
 */

import { create } from 'zustand';
import { TimeEntry, ActiveTimer } from '@/types/sentinel';
import { INITIAL_TIME_ENTRIES } from '@/lib/initialData';
import { generateId } from '@/lib/idUtils';

interface TimeState {
  timeEntries: TimeEntry[];
  activeTimer: ActiveTimer | null;

  setTimeEntries: (timeEntries: TimeEntry[]) => void;
  setActiveTimer: (activeTimer: ActiveTimer | null) => void;

  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => TimeEntry;
  deleteTimeEntry: (id: string) => void;

  startTimer: (projectId: string, taskId?: string, description?: string) => void;
  stopTimer: (user: { id: string; name: string; hourlyRate?: number }, fallbackRate?: number) => TimeEntry | null;
}

export const useTimeStore = create<TimeState>((set, get) => ({
  timeEntries: INITIAL_TIME_ENTRIES,
  activeTimer: null,

  setTimeEntries: (timeEntries) => set({ timeEntries }),
  setActiveTimer: (activeTimer) => set({ activeTimer }),

  addTimeEntry: (data) => {
    const newEntry: TimeEntry = {
      ...data,
      id: generateId('time'),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ timeEntries: [newEntry, ...state.timeEntries] }));
    return newEntry;
  },

  deleteTimeEntry: (id) => {
    set((state) => ({
      timeEntries: state.timeEntries.filter((e) => e.id !== id),
    }));
  },

  startTimer: (projectId, taskId, description = 'Session de travail') => {
    const timer: ActiveTimer = {
      projectId,
      taskId,
      description,
      startedAt: new Date().toISOString(),
    };
    set({ activeTimer: timer });
  },

  stopTimer: (user, fallbackRate = 75) => {
    const { activeTimer } = get();
    if (!activeTimer) return null;

    const start = new Date(activeTimer.startedAt).getTime();
    const now = Date.now();
    const durationMinutes = Math.max(1, Math.round((now - start) / (1000 * 60)));
    const date = new Date().toISOString().slice(0, 10);
    const hourlyRate = user.hourlyRate || fallbackRate;

    const newEntry: TimeEntry = {
      id: generateId('time'),
      projectId: activeTimer.projectId,
      taskId: activeTimer.taskId,
      userId: user.id,
      userName: user.name,
      description: activeTimer.description,
      durationMinutes,
      date,
      hourlyRate,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      timeEntries: [newEntry, ...state.timeEntries],
      activeTimer: null,
    }));

    return newEntry;
  },
}));
