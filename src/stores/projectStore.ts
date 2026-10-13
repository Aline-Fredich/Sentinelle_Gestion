/**
 * SENTINEL GESTION — Store de Domaine : Projets
 * Géré avec Zustand pour des re-rendus atomiques et performants.
 */

import { create } from 'zustand';
import { Project, TaskPriority } from '@/types/sentinel';
import { INITIAL_PROJECTS } from '@/lib/initialData';
import { generateId } from '@/lib/idUtils';

interface ProjectState {
  projects: Project[];
  activeProjectId: string; // 'all' ou ID de projet
  setProjects: (projects: Project[]) => void;
  setActiveProjectId: (id: string) => void;
  createProject: (data: {
    name: string;
    reference: string;
    description: string;
    priority: TaskPriority;
    startDate: string;
    dueDate: string;
    leadUserId: string;
    iconKey?: string;
    colorKey?: string;
    githubRepoUrl?: string;
    tags?: string[];
  }) => Project;
  updateProject: (id: string, partial: Partial<Project>) => void;
  updateProjectIcon: (id: string, iconKey: string) => void;
  getActiveProject: () => Project | null;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: INITIAL_PROJECTS,
  activeProjectId: INITIAL_PROJECTS[0]?.id || 'prj-1',

  setProjects: (projects) => set({ projects }),
  setActiveProjectId: (activeProjectId) => set({ activeProjectId }),

  createProject: (data) => {
    const newProj: Project = {
      id: generateId('prj'),
      workspaceId: 'ws-1',
      name: data.name,
      reference: data.reference,
      description: data.description,
      status: 'active',
      priority: data.priority,
      iconKey: data.iconKey || 'folder-kanban',
      colorKey: data.colorKey || 'blue',
      startDate: data.startDate,
      dueDate: data.dueDate,
      leadUserId: data.leadUserId,
      memberIds: [data.leadUserId],
      githubRepoUrl: data.githubRepoUrl,
      tags: data.tags || ['Nouveau'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      projects: [newProj, ...state.projects],
      activeProjectId: newProj.id,
    }));

    return newProj;
  },

  updateProject: (id, partial) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...partial, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },

  updateProjectIcon: (id, iconKey) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, iconKey, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },

  getActiveProject: () => {
    const { projects, activeProjectId } = get();
    if (activeProjectId === 'all') return null;
    return projects.find((p) => p.id === activeProjectId) || projects[0] || null;
  },
}));
