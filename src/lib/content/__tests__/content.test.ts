import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateInvitationEmail, generateDueDateReminderEmail, generateWeeklyReportEmail } from '../transactionalEmails.ts';
import { HUMAN_MESSAGES } from '../humanizedMessages.ts';

describe('SENTINEL GESTION — Contenu Éditorial & E-mails (Phase 9)', () => {
  it('génère un e-mail d’invitation courtois et conforme', () => {
    const email = generateInvitationEmail('Thomas Laurent', 'Espace Défense', 'Chef de projet', 'https://sentinel.fr/invite/123');
    assert.ok(email.subject.includes('Thomas Laurent vous invite'));
    assert.ok(email.text.includes('Chef de projet'));
    assert.ok(email.html.includes('Accepter l’invitation'));
    assert.ok(email.html.includes('https://sentinel.fr/invite/123'));
  });

  it('génère un rappel d’échéance avec mise en exergue du projet', () => {
    const reminder = generateDueDateReminderEmail('Marc Benali', 'Audit TLS', '2026-10-25', 'Refonte Cloud', 'https://sentinel.fr/t/1');
    assert.ok(reminder.subject.includes('Audit TLS'));
    assert.ok(reminder.text.includes('2026-10-25'));
    assert.ok(reminder.html.includes('Refonte Cloud'));
  });

  it('génère un rapport hebdomadaire synthétique avec les 4 métriques clés', () => {
    const report = generateWeeklyReportEmail('Claire Vasseur', 'SENTINEL', {
      completedCount: 12,
      overdueCount: 1,
      upcomingCount: 5,
      projectProgress: 78,
    });
    assert.ok(report.subject.includes('Synthèse hebdomadaire'));
    assert.ok(report.html.includes('78 %'));
    assert.ok(report.html.includes('12'));
  });

  it('vérifie la présence des messages d’erreur humanisés et de leurs conseils d’action', () => {
    assert.ok(HUMAN_MESSAGES.CYCLE_DEPENDENCY_PREVENTED.actionHint);
    assert.ok(HUMAN_MESSAGES.BUDGET_OVERRUN.description);
    assert.ok(HUMAN_MESSAGES.USER_OVERLOADED.actionHint);
  });
});
