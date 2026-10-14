/**
 * SENTINEL GESTION — Gabarits d'E-mails Transactionnels
 * Textes et structures HTML réactifs conformes à la charte graphique officielle.
 * Vouvoiement courtois, clarté absolue et absence de jargon technique.
 */

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

const EMAIL_HEADER = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden;">
  <div style="background-color: #0F172A; padding: 24px 32px; border-bottom: 3px solid #0066FF;">
    <h1 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">
      SENTINEL <span style="color: #00D2FF;">GESTION</span>
    </h1>
  </div>
  <div style="padding: 32px; color: #1E293B; line-height: 1.6; font-size: 15px;">
`;

const EMAIL_FOOTER = `
  </div>
  <div style="background-color: #F8FAFC; padding: 20px 32px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">
    <p style="margin: 0;">Cet e-mail automatique vous est adressé par la plateforme <strong>SENTINEL GESTION</strong>.</p>
    <p style="margin: 4px 0 0 0;">Système certifié conforme aux normes de souveraineté et de protection des données (RGPD).</p>
  </div>
</div>
`;

/**
 * 1. E-mail d'invitation à rejoindre un espace de travail
 */
export function generateInvitationEmail(
  inviterName: string,
  workspaceName: string,
  roleLabel: string,
  inviteUrl: string
): EmailTemplate {
  const subject = `${inviterName} vous invite à rejoindre l’espace « ${workspaceName} » sur SENTINEL GESTION`;
  const text = `Bonjour,\n\n${inviterName} vous invite à collaborer sur l’espace de gestion « ${workspaceName} » avec le rôle de ${roleLabel}.\n\nPour accepter cette invitation et configurer votre accès sécurisé, veuillez vous rendre sur le lien suivant :\n${inviteUrl}\n\nCe lien restera actif pendant 7 jours.\n\nÀ très bientôt sur SENTINEL GESTION.`;
  
  const html = `
    ${EMAIL_HEADER}
      <h2 style="font-size: 18px; color: #0F172A; margin-top: 0;">Rejoignez votre équipe de projet</h2>
      <p>Bonjour,</p>
      <p><strong>${inviterName}</strong> vous invite à collaborer sur l’espace de travail <strong>« ${workspaceName} »</strong> en tant que <strong>${roleLabel}</strong>.</p>
      <div style="margin: 28px 0; text-align: center;">
        <a href="${inviteUrl}" style="background-color: #0066FF; color: #FFFFFF; padding: 12px 28px; border-radius: 10px; font-weight: 600; text-decoration: none; display: inline-block;">
          Accepter l’invitation
        </a>
      </div>
      <p style="font-size: 13px; color: #64748B;">Ce lien d’invitation est personnel et expirera automatiquement dans 7 jours.</p>
    ${EMAIL_FOOTER}
  `;

  return { subject, text, html };
}

/**
 * 2. E-mail de réinitialisation de mot de passe
 */
export function generatePasswordResetEmail(
  userName: string,
  resetUrl: string,
  expiresMinutes: number = 30
): EmailTemplate {
  const subject = `Réinitialisation de votre mot de passe — SENTINEL GESTION`;
  const text = `Bonjour ${userName},\n\nUne demande de réinitialisation de mot de passe a été enregistrée pour votre compte SENTINEL GESTION.\n\nPour définir votre nouveau mot de passe, suivez ce lien sécurisé :\n${resetUrl}\n\nCe lien expirera dans ${expiresMinutes} minutes.\nSi vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message en toute sécurité.\n\nL'équipe SENTINEL GESTION.`;

  const html = `
    ${EMAIL_HEADER}
      <h2 style="font-size: 18px; color: #0F172A; margin-top: 0;">Réinitialisation de votre mot de passe</h2>
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Nous avons reçu une demande de réinitialisation pour votre accès à la plateforme.</p>
      <div style="margin: 28px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #0066FF; color: #FFFFFF; padding: 12px 28px; border-radius: 10px; font-weight: 600; text-decoration: none; display: inline-block;">
          Changer mon mot de passe
        </a>
      </div>
      <p style="font-size: 13px; color: #64748B;">Pour votre sécurité, ce lien à usage unique cessera de fonctionner dans <strong>${expiresMinutes} minutes</strong>.</p>
    ${EMAIL_FOOTER}
  `;

  return { subject, text, html };
}

/**
 * 3. E-mail de rappel d'échéance de tâche
 */
export function generateDueDateReminderEmail(
  userName: string,
  taskTitle: string,
  dueDate: string,
  projectName: string,
  taskUrl: string
): EmailTemplate {
  const subject = `Rappel d’échéance : « ${taskTitle} » arrive à terme le ${dueDate}`;
  const text = `Bonjour ${userName},\n\nLa tâche « ${taskTitle} » rattachée au projet « ${projectName} » arrive à échéance le ${dueDate}.\n\nVous pouvez consulter ou actualiser son avancement ici :\n${taskUrl}\n\nSENTINEL GESTION — Pilotage opérationnel.`;

  const html = `
    ${EMAIL_HEADER}
      <h2 style="font-size: 18px; color: #0F172A; margin-top: 0;">Rappel d’échéance imminente</h2>
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>La tâche suivante requiert votre attention et arrive à son terme le <strong>${dueDate}</strong> :</p>
      <div style="background-color: #F8FAFC; border-left: 4px solid #FF1E27; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #0F172A; display: block; font-size: 16px;">${taskTitle}</strong>
        <span style="font-size: 13px; color: #64748B;">Projet : ${projectName}</span>
      </div>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${taskUrl}" style="background-color: #0066FF; color: #FFFFFF; padding: 10px 24px; border-radius: 10px; font-weight: 600; text-decoration: none; display: inline-block;">
          Accéder à la tâche
        </a>
      </div>
    ${EMAIL_FOOTER}
  `;

  return { subject, text, html };
}

/**
 * 4. Rapport hebdomadaire synthétique
 */
export function generateWeeklyReportEmail(
  userName: string,
  workspaceName: string,
  summary: {
    completedCount: number;
    overdueCount: number;
    upcomingCount: number;
    projectProgress: number;
  }
): EmailTemplate {
  const subject = `Synthèse hebdomadaire de vos projets — ${workspaceName}`;
  const text = `Bonjour ${userName},\n\nVoici le point d'avancement de votre espace « ${workspaceName} » cette semaine :\n- Taux d’achèvement global : ${summary.projectProgress} %\n- Tâches livrées : ${summary.completedCount}\n- Tâches en retard : ${summary.overdueCount}\n- Tâches à venir (7 jours) : ${summary.upcomingCount}\n\nConsultez le tableau de bord complet sur votre espace SENTINEL GESTION.`;

  const html = `
    ${EMAIL_HEADER}
      <h2 style="font-size: 18px; color: #0F172A; margin-top: 0;">Point d’avancement hebdomadaire</h2>
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Voici la synthèse des indicateurs de votre espace <strong>« ${workspaceName} »</strong> pour la semaine écoulée :</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr>
          <td style="padding: 12px; background-color: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 8px 0 0 8px; text-align: center;">
            <span style="font-size: 22px; font-weight: 700; color: #0066FF; display: block;">${summary.projectProgress} %</span>
            <span style="font-size: 11px; color: #1E40AF; text-transform: uppercase;">Progression</span>
          </td>
          <td style="padding: 12px; background-color: #ECFDF5; border: 1px solid #D1FAE5; text-align: center;">
            <span style="font-size: 22px; font-weight: 700; color: #059669; display: block;">${summary.completedCount}</span>
            <span style="font-size: 11px; color: #065F46; text-transform: uppercase;">Livrées</span>
          </td>
          <td style="padding: 12px; background-color: #FEF2F2; border: 1px solid #FEE2E2; text-align: center;">
            <span style="font-size: 22px; font-weight: 700; color: #DC2626; display: block;">${summary.overdueCount}</span>
            <span style="font-size: 11px; color: #991B1B; text-transform: uppercase;">En retard</span>
          </td>
          <td style="padding: 12px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 0 8px 8px 0; text-align: center;">
            <span style="font-size: 22px; font-weight: 700; color: #475569; display: block;">${summary.upcomingCount}</span>
            <span style="font-size: 11px; color: #334155; text-transform: uppercase;">À venir (7j)</span>
          </td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #64748B;">Retrouvez l’ensemble des analyses détaillées, le diagramme de Gantt et le registre budgétaire sur votre tableau de bord.</p>
    ${EMAIL_FOOTER}
  `;

  return { subject, text, html };
}
