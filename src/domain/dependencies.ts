/**
 * SENTINEL GESTION — Domaine Métier Pur : Dépendances et Algorithmes de Graphe
 * Détection de cycles (DFS), ordonnancement topologique et intégrité relationnelle.
 */

import type { TaskDependency, Task } from '../types/sentinel';

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
