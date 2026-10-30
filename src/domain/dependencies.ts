/**
 * SENTINEL GESTION — Domaine Métier Pur : Dépendances et Algorithmes de Graphe
 * Détection de cycles (DFS), ordonnancement topologique, méthode du chemin critique (CPM)
 * et calcul des marges temporelles libres et totales.
 */

import type { TaskDependency, Task, DependencyType } from '../types/sentinel';

export interface TaskCpmSchedule {
  taskId: string;
  durationDays: number;
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  totalFloat: number;
  freeFloat: number;
  isCritical: boolean;
}

export interface CriticalPathResult {
  schedules: Map<string, TaskCpmSchedule>;
  criticalTaskIds: string[];
  projectDurationDays: number;
}

/**
 * Calcule la durée estimée d'une tâche en jours (arrondi supérieur à 1 jour minimum).
 */
export function getTaskDurationDays(task: Task): number {
  if (task.startDate && task.dueDate) {
    const start = new Date(task.startDate).getTime();
    const end = new Date(task.dueDate).getTime();
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, diffDays);
    }
  }
  if (task.estimateMinutes && task.estimateMinutes > 0) {
    // 7 heures ouvrées standard = 420 minutes par jour
    return Math.max(1, Math.ceil(task.estimateMinutes / 420));
  }
  return 1;
}

/**
 * Calcule l'ordonnancement complet selon la Méthode du Chemin Critique (CPM - Critical Path Method).
 * Détermine les dates au plus tôt (Early Start/Finish), au plus tard (Late Start/Finish),
 * les marges totales (Total Float), marges libres (Free Float) et identifie la chaîne critique.
 */
export function calculateCriticalPathMethod(
  tasks: Task[],
  dependencies: TaskDependency[]
): CriticalPathResult {
  const result: CriticalPathResult = {
    schedules: new Map(),
    criticalTaskIds: [],
    projectDurationDays: 0,
  };

  if (!tasks || tasks.length === 0) {
    return result;
  }

  const taskMap = new Map<string, Task>(tasks.map(t => [t.id, t]));
  const durations = new Map<string, number>();
  for (const t of tasks) {
    durations.set(t.id, getTaskDurationDays(t));
  }

  // Graphe des successeurs et prédécesseurs avec délais (lag converti en jours)
  const successors = new Map<string, Array<{ id: string; type: DependencyType; lagDays: number }>>();
  const predecessors = new Map<string, Array<{ id: string; type: DependencyType; lagDays: number }>>();
  const inDegree = new Map<string, number>();

  for (const t of tasks) {
    successors.set(t.id, []);
    predecessors.set(t.id, []);
    inDegree.set(t.id, 0);
  }

  for (const dep of dependencies) {
    if (taskMap.has(dep.predecessorTaskId) && taskMap.has(dep.successorTaskId)) {
      const lagDays = dep.lagMinutes ? Math.ceil(dep.lagMinutes / (60 * 24)) : 0;
      successors.get(dep.predecessorTaskId)!.push({
        id: dep.successorTaskId,
        type: dep.dependencyType || 'finish_to_start',
        lagDays,
      });
      predecessors.get(dep.successorTaskId)!.push({
        id: dep.predecessorTaskId,
        type: dep.dependencyType || 'finish_to_start',
        lagDays,
      });
      inDegree.set(dep.successorTaskId, (inDegree.get(dep.successorTaskId) || 0) + 1);
    }
  }

  // 1. Tri topologique (Algorithme de Kahn)
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  const topoOrder: string[] = [];
  const tempInDegree = new Map(inDegree);

  while (queue.length > 0) {
    const u = queue.shift()!;
    topoOrder.push(u);
    for (const edge of successors.get(u) || []) {
      const nextDeg = (tempInDegree.get(edge.id) || 1) - 1;
      tempInDegree.set(edge.id, nextDeg);
      if (nextDeg === 0) {
        queue.push(edge.id);
      }
    }
  }

  // Si des tâches restent hors du tri topologique (cycle ou graphe isolé), on les ajoute
  if (topoOrder.length < tasks.length) {
    for (const t of tasks) {
      if (!topoOrder.includes(t.id)) {
        topoOrder.push(t.id);
      }
    }
  }

  // 2. Passe Aller (Forward Pass) -> Calcul de Early Start (ES) et Early Finish (EF)
  const earlyStart = new Map<string, number>();
  const earlyFinish = new Map<string, number>();

  for (const taskId of topoOrder) {
    const dur = durations.get(taskId) || 1;
    const preds = predecessors.get(taskId) || [];

    let es = 0;
    for (const p of preds) {
      const pEf = earlyFinish.get(p.id) ?? 0;
      const pEs = earlyStart.get(p.id) ?? 0;

      let constraint = 0;
      switch (p.type) {
        case 'start_to_start':
          constraint = pEs + p.lagDays;
          break;
        case 'finish_to_finish':
          constraint = pEf + p.lagDays - dur;
          break;
        case 'start_to_finish':
          constraint = pEs + p.lagDays - dur;
          break;
        case 'finish_to_start':
        default:
          constraint = pEf + p.lagDays;
          break;
      }
      es = Math.max(es, constraint);
    }

    const ef = es + dur;
    earlyStart.set(taskId, es);
    earlyFinish.set(taskId, ef);
  }

  const projectDurationDays = Math.max(0, ...Array.from(earlyFinish.values()));
  result.projectDurationDays = projectDurationDays;

  // 3. Passe Retour (Backward Pass) -> Calcul de Late Finish (LF) et Late Start (LS)
  const lateStart = new Map<string, number>();
  const lateFinish = new Map<string, number>();

  const reversedOrder = [...topoOrder].reverse();

  for (const taskId of reversedOrder) {
    const dur = durations.get(taskId) || 1;
    const succs = successors.get(taskId) || [];

    let lf = projectDurationDays;
    if (succs.length > 0) {
      lf = Number.POSITIVE_INFINITY;
      for (const s of succs) {
        const sLs = lateStart.get(s.id) ?? projectDurationDays;
        const sLf = lateFinish.get(s.id) ?? projectDurationDays;

        let constraint = projectDurationDays;
        switch (s.type) {
          case 'start_to_start':
            constraint = sLs - s.lagDays + dur;
            break;
          case 'finish_to_finish':
            constraint = sLf - s.lagDays;
            break;
          case 'start_to_finish':
            constraint = sLf - s.lagDays + dur;
            break;
          case 'finish_to_start':
          default:
            constraint = sLs - s.lagDays;
            break;
        }
        lf = Math.min(lf, constraint);
      }
    }

    const ls = lf - dur;
    lateFinish.set(taskId, lf);
    lateStart.set(taskId, ls);
  }

  // 4. Calcul des Marges (Total Float & Free Float) et Détermination du Chemin Critique
  for (const t of tasks) {
    const dur = durations.get(t.id) || 1;
    const es = earlyStart.get(t.id) ?? 0;
    const ef = earlyFinish.get(t.id) ?? dur;
    const ls = lateStart.get(t.id) ?? es;
    const lf = lateFinish.get(t.id) ?? ef;

    const totalFloat = Math.max(0, ls - es);

    // Marge libre = min(ES successeurs) - EF
    const succs = successors.get(t.id) || [];
    let minSuccEs = projectDurationDays;
    if (succs.length > 0) {
      for (const s of succs) {
        const sEs = earlyStart.get(s.id) ?? projectDurationDays;
        minSuccEs = Math.min(minSuccEs, sEs);
      }
    } else {
      minSuccEs = projectDurationDays;
    }
    const freeFloat = Math.max(0, minSuccEs - ef);

    // Une tâche est critique si sa marge totale est nulle (ou quasi-nulle)
    const isCritical = totalFloat === 0;
    if (isCritical) {
      result.criticalTaskIds.push(t.id);
    }

    result.schedules.set(t.id, {
      taskId: t.id,
      durationDays: dur,
      earlyStart: es,
      earlyFinish: ef,
      lateStart: ls,
      lateFinish: lf,
      totalFloat,
      freeFloat,
      isCritical,
    });
  }

  return result;
}

/**
 * Vérifie si l'ajout d'une dépendance créerait un cycle dirigé (boucle infinie).
 * Algorithme : Recherche en profondeur (DFS) depuis la tâche successeur vers le prédécesseur.
 * Si le prédécesseur est atteignable depuis le successeur, alors ajouter successeur -> prédécesseur crée un cycle.
 */
export function wouldCreateDependencyCycle(
  existingDependencies: TaskDependency[],
  predecessorTaskId: string,
  successorTaskId: string
): boolean {
  if (predecessorTaskId === successorTaskId) {
    return true; // Auto-dépendance interdite
  }

  // Construction du graphe d'adjacence : tâche source -> liste des tâches cibles
  const adjacency = new Map<string, string[]>();
  for (const dep of existingDependencies) {
    const list = adjacency.get(dep.predecessorTaskId) || [];
    list.push(dep.successorTaskId);
    adjacency.set(dep.predecessorTaskId, list);
  }

  // Parcours DFS à partir de successorTaskId pour voir si l'on peut atteindre predecessorTaskId
  const visited = new Set<string>();
  const stack = [successorTaskId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === predecessorTaskId) {
      return true; // Cycle détecté !
    }

    if (!visited.has(current)) {
      visited.add(current);
      const neighbors = adjacency.get(current) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          stack.push(n);
        }
      }
    }
  }

  return false;
}

/**
 * Détermine si une tâche est bloquée par des prédécesseurs non terminés.
 */
export function isTaskBlockedByDependencies(
  taskId: string,
  dependencies: TaskDependency[],
  tasks: Task[]
): { isBlocked: boolean; blockingTaskIds: string[] } {
  const blockingTaskIds: string[] = [];
  const tasksMap = new Map<string, Task>(tasks.map(t => [t.id, t]));

  // Trouver toutes les dépendances où taskId est le successeur
  const incomingDeps = dependencies.filter(d => d.successorTaskId === taskId);

  for (const dep of incomingDeps) {
    const pred = tasksMap.get(dep.predecessorTaskId);
    if (pred && pred.status !== 'done') {
      blockingTaskIds.push(pred.id);
    }
  }

  return {
    isBlocked: blockingTaskIds.length > 0,
    blockingTaskIds,
  };
}
