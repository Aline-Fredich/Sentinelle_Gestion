import React from 'react';
import {
  LayoutDashboard, Star, Bell, Archive, Bookmark, CheckCircle2, Clock, Sparkles,
  Folder, Briefcase, Target, Layers, Flag, Rocket, Compass, Map,
  CheckSquare, ListTodo, ClipboardList, Tag, CalendarCheck, Workflow,
  Calendar, Hourglass, Timer, History,
  FileText, BookOpen, FileCode, Paperclip, Files,
  MessageSquare, Mail, Send, Phone, Megaphone,
  Users, UserCheck, UserPlus, Award, ShieldAlert,
  Code, Terminal, GitBranch, GitPullRequest, Bug, Cpu,
  Server, Database, HardDrive, Wifi, Cloud, Activity,
  Shield, Lock, Key, Eye, AlertTriangle, ShieldCheck,
  BarChart3, TrendingUp, PieChart, LineChart, Sliders, Settings
} from 'lucide-react';

export interface IconDefinition {
  key: string;
  label: string;
  category: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
}

export const ICON_CATEGORIES = [
  'Tous',
  'Général',
  'Projets',
  'Tâches',
  'Calendrier & Temps',
  'Documents',
  'Communication',
  'Équipe',
  'Développement',
  'Réseaux & Systèmes',
  'Cybersécurité',
  'Analyses & Statistiques',
] as const;

export const ICON_REGISTRY: IconDefinition[] = [
  // Général
  { key: 'dashboard', label: 'Tableau de bord', category: 'Général', keywords: ['vue', 'accueil', 'synthèse'], icon: LayoutDashboard },
  { key: 'star', label: 'Étoile', category: 'Général', keywords: ['favori', 'important', 'prioritaire'], icon: Star },
  { key: 'bell', label: 'Notification', category: 'Général', keywords: ['alerte', 'cloche', 'rappel'], icon: Bell },
  { key: 'archive', label: 'Archive', category: 'Général', keywords: ['boîte', 'stockage', 'historique'], icon: Archive },
  { key: 'bookmark', label: 'Signet', category: 'Général', keywords: ['marque-page', 'enregistré'], icon: Bookmark },
  { key: 'check-circle', label: 'Validation', category: 'Général', keywords: ['succès', 'terminé', 'valide'], icon: CheckCircle2 },
  { key: 'clock', label: 'Horloge', category: 'Général', keywords: ['temps', 'heure', 'durée'], icon: Clock },
  { key: 'sparkles', label: 'Innovation', category: 'Général', keywords: ['ia', 'qualité', 'nouveau'], icon: Sparkles },

  // Projets
  { key: 'folder', label: 'Dossier projet', category: 'Projets', keywords: ['projet', 'classeur', 'espace'], icon: Folder },
  { key: 'briefcase', label: 'Affaires & Entreprise', category: 'Projets', keywords: ['travail', 'client', 'mission'], icon: Briefcase },
  { key: 'target', label: 'Objectif', category: 'Projets', keywords: ['cible', 'but', 'jalon'], icon: Target },
  { key: 'layers', label: 'Phases & Couches', category: 'Projets', keywords: ['étape', 'niveau', 'structure'], icon: Layers },
  { key: 'flag', label: 'Jalon & Drapeau', category: 'Projets', keywords: ['étape', 'échéance', 'repère'], icon: Flag },
  { key: 'rocket', label: 'Lancement', category: 'Projets', keywords: ['déploiement', 'démarrage', 'livraison'], icon: Rocket },
  { key: 'compass', label: 'Orientation', category: 'Projets', keywords: ['stratégie', 'direction', 'guide'], icon: Compass },
  { key: 'map', label: 'Feuille de route', category: 'Projets', keywords: ['planning', 'parcours', 'carte'], icon: Map },

  // Tâches
  { key: 'check-square', label: 'Tâche validable', category: 'Tâches', keywords: ['case', 'cocher', 'action'], icon: CheckSquare },
  { key: 'list-todo', label: 'Liste de tâches', category: 'Tâches', keywords: ['todo', 'à faire', 'actions'], icon: ListTodo },
  { key: 'clipboard-list', label: 'Fiche d’actions', category: 'Tâches', keywords: ['contrôle', 'rapport', 'audit'], icon: ClipboardList },
  { key: 'tag', label: 'Étiquette', category: 'Tâches', keywords: ['catégorie', 'mot-clé', 'badge'], icon: Tag },
  { key: 'calendar-check', label: 'Tâche planifiée', category: 'Tâches', keywords: ['date', 'échéance', 'rendez-vous'], icon: CalendarCheck },
  { key: 'workflow', label: 'Flux de travail', category: 'Tâches', keywords: ['processus', 'pipeline', 'enchaînement'], icon: Workflow },

  // Calendrier & Temps
  { key: 'calendar', label: 'Calendrier', category: 'Calendrier & Temps', keywords: ['date', 'planning', 'mois', 'semaine'], icon: Calendar },
  { key: 'hourglass', label: 'Sablier & Délai', category: 'Calendrier & Temps', keywords: ['attente', 'compte à rebours', 'retard'], icon: Hourglass },
  { key: 'timer', label: 'Chronomètre', category: 'Calendrier & Temps', keywords: ['temps passé', 'estimation', 'durée'], icon: Timer },
  { key: 'history', label: 'Historique', category: 'Calendrier & Temps', keywords: ['passé', 'chronologie', 'traçabilité'], icon: History },

  // Documents
  { key: 'file-text', label: 'Document texte', category: 'Documents', keywords: ['note', 'spécification', 'rédaction'], icon: FileText },
  { key: 'book-open', label: 'Guide & Wiki', category: 'Documents', keywords: ['documentation', 'manuel', 'savoir'], icon: BookOpen },
  { key: 'file-code', label: 'Fichier technique', category: 'Documents', keywords: ['code', 'script', 'config'], icon: FileCode },
  { key: 'paperclip', label: 'Pièce jointe', category: 'Documents', keywords: ['fichier', 'attachement', 'liaison'], icon: Paperclip },
  { key: 'files', label: 'Dossier documentaire', category: 'Documents', keywords: ['archives', 'bibliothèque', 'collection'], icon: Files },

  // Communication
  { key: 'message-square', label: 'Commentaires & Discussions', category: 'Communication', keywords: ['chat', 'message', 'échange'], icon: MessageSquare },
  { key: 'mail', label: 'Courrier & Invitation', category: 'Communication', keywords: ['email', 'inviter', 'contact'], icon: Mail },
  { key: 'send', label: 'Envoi & Publication', category: 'Communication', keywords: ['transmettre', 'publier', 'partager'], icon: Send },
  { key: 'phone', label: 'Appel & Réunion', category: 'Communication', keywords: ['point', 'audio', 'synchrone'], icon: Phone },
  { key: 'megaphone', label: 'Annonce & Alerte équipe', category: 'Communication', keywords: ['diffusion', 'information', 'nouvelle'], icon: Megaphone },

  // Équipe
  { key: 'users', label: 'Équipe & Membres', category: 'Équipe', keywords: ['groupe', 'collaborateurs', 'personnes'], icon: Users },
  { key: 'user-check', label: 'Attribution validée', category: 'Équipe', keywords: ['responsable', 'assigné', 'validé'], icon: UserCheck },
  { key: 'user-plus', label: 'Nouveau collaborateur', category: 'Équipe', keywords: ['recrutement', 'invitation', 'ajout'], icon: UserPlus },
  { key: 'award', label: 'Performance & Rôle', category: 'Équipe', keywords: ['succès', 'responsable', 'mérite'], icon: Award },
  { key: 'shield-alert', label: 'Alerte surcharge', category: 'Équipe', keywords: ['capacité', 'dépassement', 'vigilance'], icon: ShieldAlert },

  // Développement
  { key: 'code', label: 'Code source', category: 'Développement', keywords: ['programmation', 'dev', 'logiciel'], icon: Code },
  { key: 'terminal', label: 'Ligne de commande', category: 'Développement', keywords: ['cli', 'console', 'script'], icon: Terminal },
  { key: 'git-branch', label: 'Branche Git', category: 'Développement', keywords: ['version', 'merge', 'dépôt'], icon: GitBranch },
  { key: 'git-pull-request', label: 'Revue de code', category: 'Développement', keywords: ['pr', 'pull request', 'validation'], icon: GitPullRequest },
  { key: 'bug', label: 'Anomalie & Bug', category: 'Développement', keywords: ['erreur', 'problème', 'correctif'], icon: Bug },
  { key: 'cpu', label: 'Architecture & Système', category: 'Développement', keywords: ['processeur', 'moteur', 'coeur'], icon: Cpu },

  // Réseaux & Systèmes
  { key: 'server', label: 'Serveur de production', category: 'Réseaux & Systèmes', keywords: ['hébergement', 'machine', 'cloud'], icon: Server },
  { key: 'database', label: 'Base de données', category: 'Réseaux & Systèmes', keywords: ['données', 'sql', 'stockage'], icon: Database },
  { key: 'hard-drive', label: 'Disque & Capacité', category: 'Réseaux & Systèmes', keywords: ['volume', 'sauvegarde', 'espace'], icon: HardDrive },
  { key: 'wifi', label: 'Réseau & Connexion', category: 'Réseaux & Systèmes', keywords: ['liaison', 'en ligne', 'accès'], icon: Wifi },
  { key: 'cloud', label: 'Cloud & Synchronisation', category: 'Réseaux & Systèmes', keywords: ['distant', 'sauvegarde', 'en ligne'], icon: Cloud },
  { key: 'activity', label: 'Monitoring & Activité', category: 'Réseaux & Systèmes', keywords: ['surveillance', 'santé', 'flux'], icon: Activity },

  // Cybersécurité
  { key: 'shield', label: 'Bouclier de sécurité', category: 'Cybersécurité', keywords: ['protection', 'sentinelle', 'défense'], icon: Shield },
  { key: 'lock', label: 'Verrouillage & Privé', category: 'Cybersécurité', keywords: ['accès', 'confidentiel', 'droits'], icon: Lock },
  { key: 'key', label: 'Gestion des clés & API', category: 'Cybersécurité', keywords: ['authentification', 'token', 'secret'], icon: Key },
  { key: 'eye', label: 'Surveillance & Audit', category: 'Cybersécurité', keywords: ['journal', 'traçabilité', 'contrôle'], icon: Eye },
  { key: 'alert-triangle', label: 'Avertissement & Risque', category: 'Cybersécurité', keywords: ['danger', 'blocage', 'alerte'], icon: AlertTriangle },
  { key: 'shield-check', label: 'Conformité & Intégrité', category: 'Cybersécurité', keywords: ['certifié', 'conforme', 'audité'], icon: ShieldCheck },

  // Analyses & Statistiques
  { key: 'bar-chart-3', label: 'Statistiques & Rapports', category: 'Analyses & Statistiques', keywords: ['graphique', 'kpi', 'indicateurs'], icon: BarChart3 },
  { key: 'trending-up', label: 'Progression & Croissance', category: 'Analyses & Statistiques', keywords: ['avancement', 'vitesse', 'performance'], icon: TrendingUp },
  { key: 'pie-chart', label: 'Répartition des charges', category: 'Analyses & Statistiques', keywords: ['camembert', 'pourcentage', 'parts'], icon: PieChart },
  { key: 'line-chart', label: 'Tendance temporelle', category: 'Analyses & Statistiques', keywords: ['évolution', 'courbe', 'vitesse'], icon: LineChart },
  { key: 'sliders', label: 'Paramétrage fin', category: 'Analyses & Statistiques', keywords: ['filtres', 'ajustement', 'niveaux'], icon: Sliders },
  { key: 'settings', label: 'Configuration générale', category: 'Analyses & Statistiques', keywords: ['options', 'réglages', 'système'], icon: Settings },
];

export function renderSentinelIcon(iconKey?: string, className: string = 'w-5 h-5') {
  if (!iconKey) {
    return <Folder className={className} />;
  }
  const found = ICON_REGISTRY.find(item => item.key === iconKey);
  if (found) {
    const Component = found.icon;
    return <Component className={className} />;
  }
  return <Folder className={className} />;
}
