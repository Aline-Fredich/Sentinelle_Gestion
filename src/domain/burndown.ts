/**
 * SENTINEL GESTION — Domaine Métier Pur : Vélocité Agile et Calcul de Burndown
 * Génère des trajectoires idéales et réelles basées sur des faits temporels exacts.
 */

import type { Sprint, Task } from '../types/sentinel';

export interface BurndownDataPoint {
  dayLabel: string;
  dateStr: string;
  x: number;
  idealY: number;
  idealPoints: number;
  actualPoints: number | null;
  actualY: number | null;
}

/**
 * Calcule les points de la courbe burndown d'un sprint donné.
 * @param sprint Le sprint agile ciblé
 * @param sprintTasks Les tâches faisant partie du sprint
 * @param getTaskPoints Fonction pour extraire les story points d'une tâche
 * @param referenceDate Date actuelle de référence (pure et injectable)
 */
export function calculateSprintBurndown(
  sprint: Sprint,
  sprintTasks: Task[],
  getTaskPoints: (task: Task) => number,
  referenceDate: Date = new Date()
): {
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  points: BurndownDataPoint[];
} {
  const totalPoints = sprintTasks.reduce((sum, t) => sum + getTaskPoints(t), 0);
  const completedPoints = sprintTasks
    .filter(t => t.status === 'done')
    .reduce((sum, t) => sum + getTaskPoints(t), 0);
  const remainingPoints = Math.max(0, totalPoints - completedPoints);

  if (totalPoints === 0) {
    return {
      totalPoints: 0,
      completedPoints: 0,
      remainingPoints: 0,
      points: [],
    };
  }

  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const stepsCount = 7;
  const points: BurndownDataPoint[] = [];

  for (let i = 0; i < stepsCount; i++) {
    const dayRatio = i / (stepsCount - 1);
    const stepDate = new Date(start.getTime() + dayRatio * (end.getTime() - start.getTime()));
    const dateStr = stepDate.toISOString().slice(0, 10);
    const dayLabel = `J${Math.round(dayRatio * totalDays) + 1}`;

    // Trajectoire idéale linéaire de totalPoints à 0
    const idealPoints = Math.max(0, Math.round(totalPoints * (1 - dayRatio)));

    // Calcul réel : Story points restants = total - points des tâches complétées à cette date
    let actualPoints: number | null = null;
    if (stepDate <= referenceDate || i === 0) {
      const completedUpToDate = sprintTasks
        .filter(t => t.status === 'done' && t.completedAt && t.completedAt.slice(0, 10) <= dateStr)
        .reduce((sum, t) => sum + getTaskPoints(t), 0);
      actualPoints = Math.max(0, totalPoints - completedUpToDate);
    }

    // Coordonnées SVG dans une boîte 600x120 (marges 40..580 et 20..100)
    const x = 40 + dayRatio * (580 - 40);
    const idealY = 100 - (idealPoints / totalPoints) * 80;
    const actualY = actualPoints !== null ? 100 - (actualPoints / totalPoints) * 80 : null;

    points.push({
      dayLabel,
      dateStr,
      x,
      idealY,
      idealPoints,
      actualPoints,
      actualY,
    });
  }

  return {
    totalPoints,
    completedPoints,
    remainingPoints,
    points,
  };
}
