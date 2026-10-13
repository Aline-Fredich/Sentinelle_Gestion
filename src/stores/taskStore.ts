/**
 * SENTINEL GESTION — Store de Domaine : Tâches
 * Gère le cycle de vie des tâches, sous-tâches, priorités et checklist.
 */

import { create } from 'zustand';
import { Task, TaskPriority, TaskStatus, ChecklistItem } from '@/types/sentinel';
import { INITIAL_TASKS } from '@/lib/initialData';
import { generateId } from '@/lib/idUtils';

interface TaskState {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  createTask: (data: {
    projectId: string;
    phaseId?: string;
    parentTaskId?: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId?: string;
    assigneeIds?: string[];
    startDate?: string;
    dueDate?: string;
    estimateMinutes: number;
    storyPoints?: number;
    labels?: string[];
    checklist?: ChecklistItem[];
  }) => Task;
  updateTask: (id: string, partial: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTaskStatus: (id: string, newStatus: TaskStatus) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: INITIAL_TASKS,

  setTasks: (tasks) => set({ tasks }),

  createTask: (data) => {
    const newTask: Task = {
      id: generateId('tsk'),
      workspaceId: 'ws-1',
      projectId: data.projectId,
      phaseId: data.phaseId,
      parentTaskId: data.parentTaskId,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assigneeId: data.assigneeId,
      assigneeIds: data.assigneeIds || (data.assigneeId ? [data.assigneeId] : []),
      startDate: data.startDate,
      dueDate: data.dueDate,
      estimateMinutes: data.estimateMinutes,
      storyPoints: data.storyPoints,
      labels: data.labels || [],
      checklist: data.checklist || [],
      order: 0,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      tasks: [newTask, ...state.tasks],
    }));

    return newTask;
  },

  updateTask: (id, partial) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t;
        const isNowDone = partial.status === 'done' && t.status !== 'done';
        const isNoLongerDone = partial.status && partial.status !== 'done' && t.status === 'done';
        const completedAt = isNowDone
          ? new Date().toISOString()
          : isNoLongerDone
          ? undefined
          : t.completedAt;

        return {
          ...t,
          ...partial,
          completedAt,
          version: (t.version || 1) + 1,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },

  moveTaskStatus: (id, newStatus) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t;
        const isDone = newStatus === 'done';
        return {
          ...t,
          status: newStatus,
          completedAt: isDone ? new Date().toISOString() : undefined,
          version: (t.version || 1) + 1,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  toggleChecklistItem: (taskId, itemId) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const updatedChecklist = t.checklist.map((item) =>
          item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
        );
        return {
          ...t,
          checklist: updatedChecklist,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },
}));
