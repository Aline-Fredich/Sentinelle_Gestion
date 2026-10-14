/**
 * SENTINEL GESTION — Moteur d'Automatismes & Intégrations Webhooks
 * Déclencheurs événementiels « Si ceci alors cela » et diffusion multi-canaux (Slack, Teams, Discord).
 */

import type { Task, ProjectBudget, ProjectExpense, ProjectRisk, NotificationItem } from '../../types/sentinel.ts';

export type AutomationTrigger =
  | 'TASK_CHECKLIST_COMPLETED'
  | 'TASK_STATUS_CHANGED'
  | 'BUDGET_THRESHOLD_REACHED'
  | 'CRITICAL_RISK_DETECTED';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: AutomationTrigger;
}

export interface AutomationActionResult {
  executed: boolean;
  actionType: 'UPDATE_TASK' | 'CREATE_NOTIFICATION' | 'DISPATCH_WEBHOOK';
  targetId?: string;
  message: string;
  payload?: Record<string, unknown>;
}

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule-auto-review',
    name: 'Passage automatique en révision',
    description: 'Bascule automatiquement une tâche en « En révision » dès que 100% de sa checklist est cochée.',
    enabled: true,
    trigger: 'TASK_CHECKLIST_COMPLETED',
  },
  {
    id: 'rule-budget-alert',
    name: 'Alerte de surconsommation budgétaire',
    description: 'Déclenche une notification d’alerte dès que les dépenses engagées atteignent 85% du devis alloué.',
    enabled: true,
    trigger: 'BUDGET_THRESHOLD_REACHED',
  },
  {
    id: 'rule-risk-escalation',
    name: 'Escalade des risques majeurs',
    description: 'Prépare une alerte prioritaire lorsqu’un risque atteint une criticité égale ou supérieure à 15/25.',
    enabled: true,
    trigger: 'CRITICAL_RISK_DETECTED',
  },
];

/**
 * Évalue la règle de complétion de checklist.
 */
export function evaluateChecklistAutoReview(
  task: Task,
  ruleEnabled: boolean = true
): AutomationActionResult | null {
  if (!ruleEnabled || !task.checklist || task.checklist.length === 0) {
    return null;
  }

  const allCompleted = task.checklist.every(item => item.isCompleted);
  if (allCompleted && task.status === 'in_progress') {
    return {
      executed: true,
      actionType: 'UPDATE_TASK',
      targetId: task.id,
      message: `Tâche « ${task.title} » : 100% de la checklist cochée. Passage automatique en « En révision ».`,
      payload: { status: 'in_review' },
    };
  }

  return null;
}

/**
 * Évalue le seuil d'alerte de dépassement budgétaire (85%).
 */
export function evaluateBudgetThreshold(
  budget: ProjectBudget | undefined,
  expenses: ProjectExpense[],
  ruleEnabled: boolean = true
): AutomationActionResult | null {
  if (!ruleEnabled || !budget || budget.targetBudget <= 0) {
    return null;
  }

  const totalCommitted = expenses.reduce((sum, e) => sum + e.amount, 0);
  const ratio = totalCommitted / budget.targetBudget;

  if (ratio >= 0.85) {
    const percentage = Math.round(ratio * 100);
    return {
      executed: true,
      actionType: 'CREATE_NOTIFICATION',
      targetId: budget.projectId,
      message: `Alerte budgétaire : ${percentage}% du devis alloué a été engagé (${totalCommitted.toLocaleString('fr-FR')} € / ${budget.targetBudget.toLocaleString('fr-FR')} €).`,
      payload: {
        category: 'security',
        level: 'warning',
        ratio,
      },
    };
  }

  return null;
}

/**
 * Formate un message compatible pour les webhooks entrants Slack ou Microsoft Teams.
 */
export function formatWebhookPayload(
  platform: 'slack' | 'teams' | 'generic',
  title: string,
  message: string,
  projectName?: string
): Record<string, unknown> {
  const timestamp = new Date().toISOString();

  if (platform === 'slack') {
    return {
      text: `*SENTINEL GESTION* — ${title}\n${message}`,
      attachments: [
        {
          color: '#0066FF',
          fields: [
            { title: 'Projet', value: projectName || 'Global', short: true },
            { title: 'Horodatage', value: timestamp, short: true },
          ],
        },
      ],
    };
  }

  if (platform === 'teams') {
    return {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      summary: title,
      themeColor: '0066FF',
      title: `SENTINEL GESTION : ${title}`,
      sections: [
        {
          activityTitle: projectName ? `Projet : ${projectName}` : 'Notification Système',
          activitySubtitle: timestamp,
          text: message,
        },
      ],
    };
  }

  // Format générique JSON ouvert
  return {
    source: 'SENTINEL GESTION',
    version: '1.0.0',
    timestamp,
    title,
    message,
    project: projectName,
  };
}

/**
 * Diffuse une notification vers une URL de webhook externe.
 */
export async function dispatchWebhookNotification(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('https://')) {
    return { success: false, error: 'URL de webhook HTTPS valide requise' };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { success: false, error: `Erreur HTTP ${response.status}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
