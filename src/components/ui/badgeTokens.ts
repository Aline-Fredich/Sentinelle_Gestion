/**
 * SENTINEL GESTION — Jetons de style pour les Badges
 * Style officiel : « Bordure avec pastille colorée »
 * Conforme WCAG 2.1 AA/AAA sur tous les thèmes de fond
 */

import type { TaskStatus, TaskPriority } from '../../types/sentinel.ts';

export type BadgeVariant = 
  | 'default'
  | 'todo' 
  | 'in_progress' 
  | 'in_review' 
  | 'done'
  | 'urgent' 
  | 'high' 
  | 'medium' 
  | 'low'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface BadgeConfig {
  label: string;
  dotColor: string;
  borderColor: string;
  textColor: string;
  bgColor: string;
}

export const BADGE_CONFIGS: Record<BadgeVariant, BadgeConfig> = {
  // Statuts de tâche
  todo: {
    label: 'À FAIRE',
    dotColor: '#94A3B8',
    borderColor: 'var(--border-strong)',
    textColor: 'var(--text)',
    bgColor: 'var(--surface-2)',
  },
  in_progress: {
    label: 'EN COURS',
    dotColor: 'var(--brand)',
    borderColor: 'var(--brand)',
    textColor: 'var(--text)',
    bgColor: 'var(--surface-2)',
  },
  in_review: {
    label: 'EN REVUE',
    dotColor: '#F59E0B',
    borderColor: '#D97706',
    textColor: 'var(--text)',
    bgColor: 'var(--surface-2)',
  },
  done: {
    label: 'TERMINÉ',
    dotColor: '#22C55E',
    borderColor: '#16A34A',
    textColor: 'var(--text)',
    bgColor: 'var(--surface-2)',
  },

  // Priorités
  urgent: {
    label: 'URGENTE',
    dotColor: 'var(--danger)',
    borderColor: 'var(--danger)',
    textColor: 'var(--text)',
    bgColor: 'var(--surface-2)',
  },
  high: {
    label: 'HAUTE',
    dotColor: '#EA580C',
    borderColor: '#C2410C',
    textColor: 'var(--text)',
    bgColor: 'var(--surface-2)',
  },
  medium: {
    label: 'MOYENNE',
    dotColor: 'var(--brand)',
    borderColor: 'var(--border-strong)',
    textColor: 'var(--text)',
    bgColor: 'var(--surface-2)',
  },
  low: {
    label: 'BASSE',
    dotColor: '#64748B',
    borderColor: 'var(--border)',
    textColor: 'var(--text-muted)',
    bgColor: 'var(--surface-2)',
  },

  // Variantes sémantiques génériques
  success: {
    label: 'SUCCÈS',
    dotColor: '#22C55E',
    borderColor: '#16A34A',
    textColor: 'var(--text)',
    bgColor: 'var(--surface-2)',
  },
  warning: {
    label: 'ATTENTION',
    dotColor: '#F59E0B',
    borderColor: '#D97706',
    textColor: 'var(--text)',
    bgColor: 'var(--surface-2)',
  },
  danger: {
    label: 'CRITIQUE',
    dotColor: 'var(--danger)',
    borderColor: 'var(--danger)',
    textColor: 'var(--text)',
    bgColor: 'var(--surface-2)',
  },
  info: {
    label: 'INFO',
    dotColor: 'var(--brand)',
    borderColor: 'var(--brand)',
    textColor: 'var(--text)',
    bgColor: 'var(--surface-2)',
  },
  default: {
    label: 'STATUT',
    dotColor: 'var(--text-muted)',
    borderColor: 'var(--border)',
    textColor: 'var(--text)',
    bgColor: 'var(--surface-2)',
  },
};

export function getStatusBadgeVariant(status: TaskStatus): BadgeVariant {
  switch (status) {
    case 'todo': return 'todo';
    case 'in_progress': return 'in_progress';
    case 'in_review': return 'in_review';
    case 'done': return 'done';
    default: return 'default';
  }
}

export function getPriorityBadgeVariant(priority: TaskPriority): BadgeVariant {
  switch (priority) {
    case 'urgent': return 'urgent';
    case 'high': return 'high';
    case 'medium': return 'medium';
    case 'low': return 'low';
    default: return 'default';
  }
}
