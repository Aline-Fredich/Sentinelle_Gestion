/**
 * SENTINEL GESTION — Store de Domaine : Planification
 * Gère les phases, dépendances, jalons de livraison et sprints agiles.
 */

import { create } from 'zustand';
import { ProjectPhase, TaskDependency, ProjectMilestone, Sprint, DependencyType } from '@/types/sentinel';
import { INITIAL_PHASES, INITIAL_DEPENDENCIES, INITIAL_MILESTONES, INITIAL_SPRINTS } from '@/lib/initialData';
import { generateId } from '@/lib/idUtils';
import { wouldCreateDependencyCycle } from '@/domain/dependencies';

interface PlanningState {
  phases: ProjectPhase[];
  dependencies: TaskDependency[];
  milestones: ProjectMilestone[];
  sprints: Sprint[];

  setPhases: (phases: ProjectPhase[]) => void;
  setDependencies: (dependencies: TaskDependency[]) => void;
  setMilestones: (milestones: ProjectMilestone[]) => void;
  setSprints: (sprints: Sprint[]) => void;

  createPhase: (data: {
    projectId: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    iconKey?: string;
    colorKey?: string;
  }) => ProjectPhase;
  updatePhase: (id: string, partial: Partial<ProjectPhase>) => void;
  deletePhase: (id: string) => void;

  addDependency: (
    projectId: string,
    predecessorTaskId: string,
    successorTaskId: string,
    dependencyType?: DependencyType,
    lagMinutes?: number
  ) => { success: boolean; error?: string; dependency?: TaskDependency };
  deleteDependency: (id: string) => void;

  createMilestone: (data: {
    projectId: string;
    name: string;
    dueDate: string;
    description?: string;
  }) => ProjectMilestone;
  updateMilestone: (id: string, partial: Partial<ProjectMilestone>) => void;
  deleteMilestone: (id: string) => void;

  createSprint: (data: {
    projectId: string;
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
  }) => Sprint;
  updateSprintStatus: (id: string, status: Sprint['status']) => void;
  addTasksToSprint: (sprintId: string, taskIds: string[]) => void;
}

export const usePlanningStore = create<PlanningState>((set, get) => ({
  phases: INITIAL_PHASES,
  dependencies: INITIAL_DEPENDENCIES,
  milestones: INITIAL_MILESTONES,
  sprints: INITIAL_SPRINTS,

  setPhases: (phases) => set({ phases }),
  setDependencies: (dependencies) => set({ dependencies }),
  setMilestones: (milestones) => set({ milestones }),
  setSprints: (sprints) => set({ sprints }),

  createPhase: (data) => {
    const { phases } = get();
    const projPhases = phases.filter((p) => p.projectId === data.projectId);
    const newPhase: ProjectPhase = {
      id: generateId('phase'),
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      order: projPhases.length + 1,
      startDate: data.startDate,
      endDate: data.endDate,
      iconKey: data.iconKey || 'layers',
      colorKey: data.colorKey || 'blue',
    };

    set((state) => ({ phases: [...state.phases, newPhase] }));
    return newPhase;
  },

  updatePhase: (id, partial) => {
    set((state) => ({
      phases: state.phases.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    }));
  },

  deletePhase: (id) => {
    set((state) => ({
      phases: state.phases.filter((p) => p.id !== id),
    }));
  },

  addDependency: (projectId, predecessorTaskId, successorTaskId, dependencyType = 'finish_to_start', lagMinutes = 0) => {
    const { dependencies } = get();

    if (predecessorTaskId === successorTaskId) {
      return { success: false, error: 'Une tâche ne peut pas dépendre d’elle-même.' };
    }

    const alreadyExists = dependencies.some(
      (d) => d.predecessorTaskId === predecessorTaskId && d.successorTaskId === successorTaskId
    );
    if (alreadyExists) {
      return { success: false, error: 'Ce lien de dépendance existe déjà.' };
    }

    if (wouldCreateDependencyCycle(dependencies, predecessorTaskId, successorTaskId)) {
      return { success: false, error: 'Création impossible : ce lien formerait une boucle cyclique infinie.' };
    }

    const newDep: TaskDependency = {
      id: generateId('dep'),
      projectId,
      predecessorTaskId,
      successorTaskId,
      dependencyType,
      lagMinutes,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ dependencies: [...state.dependencies, newDep] }));
    return { success: true, dependency: newDep };
  },

  deleteDependency: (id) => {
    set((state) => ({
      dependencies: state.dependencies.filter((d) => d.id !== id),
    }));
  },

  createMilestone: (data) => {
    const newMls: ProjectMilestone = {
      id: generateId('mls'),
      projectId: data.projectId,
      name: data.name,
      dueDate: data.dueDate,
      status: 'planned',
      description: data.description,
    };
    set((state) => ({ milestones: [...state.milestones, newMls] }));
    return newMls;
  },

  updateMilestone: (id, partial) => {
    set((state) => ({
      milestones: state.milestones.map((m) => (m.id === id ? { ...m, ...partial } : m)),
    }));
  },

  deleteMilestone: (id) => {
    set((state) => ({
      milestones: state.milestones.filter((m) => m.id !== id),
    }));
  },

  createSprint: (data) => {
    const newSprint: Sprint = {
      id: generateId('spr'),
      projectId: data.projectId,
      name: data.name,
      goal: data.goal,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'future',
      taskIds: [],
    };
    set((state) => ({ sprints: [newSprint, ...state.sprints] }));
    return newSprint;
  },

  updateSprintStatus: (id, status) => {
    set((state) => ({
      sprints: state.sprints.map((s) => (s.id === id ? { ...s, status } : s)),
    }));
  },

  addTasksToSprint: (sprintId, taskIds) => {
    set((state) => ({
      sprints: state.sprints.map((s) =>
        s.id === sprintId
          ? { ...s, taskIds: Array.from(new Set([...s.taskIds, ...taskIds])) }
          : s
      ),
    }));
  },
}));
