/**
 * SENTINEL GESTION — Référentiel de Messages Humains & Aide Contextuelle
 * Remplace les codes d'erreurs bruts ou techniques par des formulations empathiques,
 * claires, orientées vers l'action et rédigées en vouvoiement courtois.
 */

export interface HumanMessage {
  title: string;
  description: string;
  actionHint?: string;
}

export const HUMAN_MESSAGES = {
  // Erreurs de validation et dépendances
  CYCLE_DEPENDENCY_PREVENTED: {
    title: 'Liaison impossible : boucle temporelle détectée',
    description: 'Une tâche ne peut pas être à la fois le prédécesseur et le successeur d’une même chaîne logique.',
    actionHint: 'Vérifiez la chronologie de vos tâches pour supprimer le conflit de dépendance.',
  },
  TASK_TITLE_REQUIRED: {
    title: 'Le titre de la tâche est requis',
    description: 'Veuillez saisir un intitulé clair décrivant le travail attendu.',
    actionHint: 'Exemple : « Rédiger la spécification des flux de facturation »',
  },
  DATE_RANGE_INVALID: {
    title: 'Dates non concordantes',
    description: 'La date d’échéance ne peut pas être antérieure à la date de démarrage.',
    actionHint: 'Ajustez l’échéance pour qu’elle se situe après la date de début.',
  },

  // Alertes budgétaires
  BUDGET_WARNING_70: {
    title: 'Seuil d’attention budgétaire atteint',
    description: 'Vous avez engagé 70 % de l’enveloppe prévisionnelle allouée à ce projet.',
    actionHint: 'Assurez-vous que l’avancement physique des livrables correspond au rythme de dépenses.',
  },
  BUDGET_WARNING_90: {
    title: 'Vigilance forte : 90 % du budget consommé',
    description: 'Il ne reste que 10 % des fonds prévus alors que le projet est toujours en cours.',
    actionHint: 'Consultez la feuille de dépenses pour anticiper d’éventuels arbitrages.',
  },
  BUDGET_OVERRUN: {
    title: 'Dépassement de budget constaté',
    description: 'Le cumul des dépenses réelles et des coûts de main d’œuvre excède le devis validé.',
    actionHint: 'Une demande de rallonge ou un réajustement de périmètre est recommandé.',
  },

  // Gestion d'équipe et charge
  USER_OVERLOADED: {
    title: 'Alerte de surcharge hebdomadaire',
    description: 'Le volume horaire attribué à ce collaborateur dépasse sa capacité contractuelle de 35 heures.',
    actionHint: 'Rééquilibrez certaines tâches vers d’autres membres de l’équipe.',
  },
  CANNOT_REMOVE_OWNER: {
    title: 'Action non autorisée sur le compte propriétaire',
    description: 'Le créateur de l’espace de travail doit transférer la propriété avant de pouvoir être retiré.',
    actionHint: 'Désignez un autre administrateur comme propriétaire principal au préalable.',
  },

  // Sauvegardes & Restauration
  RESTORE_CONFIRMATION: {
    title: 'Rétablissement des paramètres d’origine',
    description: 'Cette opération restaure l’ensemble des données à leur configuration d’usine.',
    actionHint: 'Une sauvegarde intégrale au format JSON peut être téléchargée avant de confirmer.',
  },
};
