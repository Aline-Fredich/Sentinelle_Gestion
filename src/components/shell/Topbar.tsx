'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Filter, Plus, Bell, Palette, 
  X, Share2, Play, Square, Clock, Download, Upload, ShieldCheck, FileText,
  SlidersHorizontal, ChevronDown, FolderPlus, Sun, Moon
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { AppearancePopover } from '@/components/theme/AppearancePopover';
import { formatRelativeTimeFrench } from '@/lib/dateUtils';
import { TaskPriority, TaskStatus } from '@/types/sentinel';
import { SyncStatusBadge } from '@/components/sync/SyncStatusBadge';
import { Button } from '@/components/ui/Button';

interface TopbarProps {
  onOpenNewTaskModal?: () => void;
  onOpenCreateProjectModal?: () => void;
  onOpenShareModal?: () => void;
  onOpenExportModal?: () => void;
  onOpenImportModal?: () => void;
  onOpenSecurityModal?: () => void;
  onOpenReportModal?: () => void;
  onOpenAuthModal?: () => void;
}

export function Topbar({
  onOpenNewTaskModal,
  onOpenCreateProjectModal,
  onOpenShareModal,
  onOpenExportModal,
  onOpenImportModal,
  onOpenSecurityModal,
  onOpenReportModal,
  onOpenAuthModal,
}: TopbarProps) {
  const { 
    activeView, currentProject, activeProjectId, 
    searchQuery, setSearchQuery, filters, setFilters, 
    resetFilters, users, notifications, markNotificationAsRead, 
    markAllNotificationsAsRead, activeTimer, startTimer, stopTimer,
    currentUser
  } = useSentinel();

  const { themeData, isDark, setTheme } = useTheme();
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [showTimerPopover, setShowTimerPopover] = useState(false);
  const [showAppearancePopover, setShowAppearancePopover] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [timerDesc, setTimerDesc] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Fermer le menu Actions au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    }
    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsMenu]);

  // Décompte temps en direct lorsque le chronomètre est actif
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTimer) {
      const updateElapsed = () => {
        const start = new Date(activeTimer.startedAt).getTime();
        const now = Date.now();
        setTimerSeconds(Math.max(0, Math.floor((now - start) / 1000)));
      };
      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  const formatTimerDisplay = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };



  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Vue d’ensemble & Pilotage',
      subtitle: 'Poste de contrôle général, indicateurs clés et synthèse de santé des projets',
    },
    project_sheet: {
      title: currentProject ? `Fiche Projet : ${currentProject.name}` : 'Fiche Projet',
      subtitle: 'Cahier des charges, phases de livraison, livrables et contributeurs',
    },
    tracking: {
      title: 'Tableau de suivi des tâches',
      subtitle: 'Classification d’avancement : Terminé, En cours, En retard et À venir',
    },
    kanban: {
      title: 'Tableau Kanban visuel',
      subtitle: 'Gestion des flux de travail : À faire, En cours, En revue et Terminé',
    },
    sprints: {
      title: 'Sprints & Méthodologie Agile',
      subtitle: 'Gestion des itérations, backlog de tâches, vélocité et graphique burndown',
    },
    gantt: {
      title: 'Planning Visuel & Chronogramme',
      subtitle: 'Phases ordonnées, barres temporelles et dépendances strictes',
    },
    calendar: {
      title: 'Calendrier des échéances',
      subtitle: 'Vue d’ensemble des dates cibles et jalons de livraison',
    },
    finance: {
      title: 'Budgets & Gestion des Dépenses',
      subtitle: 'Suivi des coûts réels engagés, marge financière et rentabilité du projet',
    },
    timetracking: {
      title: 'Feuilles d’heures & Chronométrage',
      subtitle: 'Chronométrage des sessions de travail et récapitulatif par membre',
    },
    risks: {
      title: 'Matrice de criticité & Gestion des risques',
      subtitle: 'Identification 5x5 probabilité/impact et plans de mitigation opérationnels',
    },
    wiki: {
      title: 'Wiki & Base de connaissances',
      subtitle: 'Documentation technique, spécifications et notes de réunions collaboratives',
    },
    documents: {
      title: 'Documents & Fichiers',
      subtitle: 'Gestion centralisée des pièces jointes et des livrables de projet',
    },
    forum: {
      title: 'Forum du projet & Échanges',
      subtitle: 'Discussions d’équipe, questions techniques et décisions officielles',
    },
    team: {
      title: 'Équipe, Rôles & Invitations',
      subtitle: 'Gestion des membres, attribution des droits et répartition de la charge',
    },
    billing: {
      title: 'Abonnement & Quotas',
      subtitle: 'Consommation des ressources en temps réel et offres d’abonnement',
    },
    settings: {
      title: 'Paramètres & Configuration',
      subtitle: 'Options globales de l’espace de travail et intégrations',
    },
    super_admin: {
      title: 'Super Administrateur • Superviseur Global',
      subtitle: 'Indicateurs de performance holistiques, supervision de tous les projets et contrôle des formules',
    },
  };

  const currentMeta = titles[activeView] || { 
    title: 'SENTINEL GESTION', 
    subtitle: 'Plateforme professionnelle de gestion de projets' 
  };

  const activeFiltersCount = [
    filters.memberId ? 1 : 0,
    filters.priority && filters.priority !== 'all' ? 1 : 0,
    filters.status && filters.status !== 'all' ? 1 : 0,
    filters.startDate ? 1 : 0,
    filters.endDate ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const unreadNotifs = notifications.filter(n => !n.read);

  return (
    <header className="min-h-[64px] px-6 border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text)] flex items-center justify-between gap-6 z-20">
      {/* Fil d'Ariane & Titre de vue */}
      <div className="min-w-0 max-w-[36%] flex-1 overflow-hidden pr-2">
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] mb-1 font-mono truncate">
          <span className="hover:text-[var(--text)] transition shrink-0">ESPACE</span>
          <span className="text-[var(--text-muted)] shrink-0">/</span>
          <span className="font-semibold text-[var(--text)] truncate max-w-[180px]">
            {activeProjectId === 'all' ? 'PORTEFEUILLE PROJETS' : (currentProject?.name?.toUpperCase() || 'PROJET ACTIF')}
          </span>
          <span className="text-[var(--text-muted)] shrink-0">/</span>
          <span className="text-[var(--brand)] font-bold truncate">{currentMeta.title.toUpperCase()}</span>
        </nav>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-[var(--text)] truncate font-ui">
            {currentMeta.title}
          </h1>
          <span className="badge-role shrink-0">
            {currentUser.role === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN PROJET'}
          </span>
        </div>
      </div>

      {/* Barre d'outils centrale & droite */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Horloge numérique technique temps réel */}
        <div className="hidden lg:flex clock">
          <Clock className="w-4 h-4 text-[var(--color-primary)]" />
          <div>
            <div className="time text-white text-xs font-mono font-bold leading-none">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="date text-[9px] text-white/45 font-mono leading-none mt-0.5">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Widget Chronomètre interactif en direct */}
        <div className="relative">
          {activeTimer ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#000000] border border-[var(--color-primary)] text-white shadow-[var(--glow-sm)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
              <Clock className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="font-mono font-bold text-sm tracking-wider text-white">
                {formatTimerDisplay(timerSeconds)}
              </span>
              <button
                onClick={stopTimer}
                title="Arrêter et enregistrer la session"
                className="ml-1 p-1 rounded bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition shadow-sm"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={() => setShowTimerPopover(!showTimerPopover)}
                className="btn btn-secondary btn-sm"
              >
                <Play className="w-3.5 h-3.5 text-[var(--color-primary)] fill-current" />
                <span className="hidden md:inline">CHRONO</span>
              </button>

              {/* Popover démarrage chrono rapide */}
              {showTimerPopover && (
                <div className="absolute right-0 top-12 w-72 bg-[#050505] rounded-md shadow-[0_12px_32px_rgba(0,0,0,0.9)] border border-[#242424] p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="text-xs font-bold text-white mb-2 font-mono uppercase">
                    Démarrer un chronomètre
                  </div>
                  <input
                    type="text"
                    value={timerDesc}
                    onChange={(e) => setTimerDesc(e.target.value)}
                    placeholder="Objet de la tâche..."
                    className="form-input text-xs mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const targetProj = activeProjectId === 'all' ? 'proj-1' : activeProjectId;
                        startTimer(targetProj, undefined, timerDesc);
                        setShowTimerPopover(false);
                        setTimerDesc('');
                      }}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      Lancer
                    </button>
                    <button
                      onClick={() => setShowTimerPopover(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recherche instantanée */}
        <div className="relative w-44 sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-primary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="RECHERCHER..."
            className="w-full pl-9 pr-12 py-1.5 text-xs bg-[#000000] border border-[#242424] rounded-md text-white placeholder:text-white/45 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] font-ui transition"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-block">
            Ctrl K
          </kbd>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>



        {/* Action contextuelle : Nouveau Projet sur la vue Portefeuille */}
        {onOpenCreateProjectModal && activeView === 'overview' && (
          <Button
            variant="secondary"
            size="sm"
            icon={<FolderPlus className="w-3.5 h-3.5 text-[var(--brand)]" />}
            onClick={onOpenCreateProjectModal}
            className="font-semibold"
            title="Créer un nouveau projet"
          >
            <span className="hidden md:inline">NOUVEAU PROJET</span>
          </Button>
        )}

        {/* Bouton Filtrer avec Popover */}
        <div className="relative">
          <Button
            variant={activeFiltersCount > 0 ? 'primary' : 'secondary'}
            size="sm"
            icon={<Filter className="w-3.5 h-3.5" />}
            onClick={() => setShowFilterPopover(!showFilterPopover)}
            title="Filtrer les tâches"
            aria-label="Filtrer les tâches"
          >
            <span className="hidden sm:inline font-mono">FILTRER</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-black leading-none">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {/* Panneau de filtres */}
          {showFilterPopover && (
            <div className="absolute right-0 top-12 w-72 bg-[var(--surface-raised)] rounded-md shadow-[var(--shadow)] border border-[var(--border)] p-4 z-50 animate-in fade-in zoom-in-95 text-[var(--text)]">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--border)]">
                <span className="text-xs font-bold text-[var(--text)] uppercase font-mono">
                  Filtres actifs
                </span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-[11px] text-[var(--brand)] font-semibold hover:underline"
                  >
                    Effacer tout
                  </button>
                )}
              </div>

              <div className="space-y-3 text-xs">
                {/* Intervenant */}
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium font-mono text-[11px] uppercase">
                    Responsable assigné
                  </label>
                  <select
                    value={filters.memberId || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, memberId: e.target.value || undefined }))}
                    className="w-full px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                  >
                    <option value="">Tous les membres</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priorité */}
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium font-mono text-[11px] uppercase">
                    Priorité
                  </label>
                  <select
                    value={filters.priority || 'all'}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as TaskPriority | 'all' }))}
                    className="w-full px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                  >
                    <option value="all">Toutes les priorités</option>
                    <option value="urgent">URGENTE</option>
                    <option value="high">HAUTE</option>
                    <option value="medium">MOYENNE</option>
                    <option value="low">BASSE</option>
                  </select>
                </div>

                {/* Statut */}
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium font-mono text-[11px] uppercase">
                    Statut
                  </label>
                  <select
                    value={filters.status || 'all'}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as TaskStatus | 'all' }))}
                    className="w-full px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="todo">À FAIRE</option>
                    <option value="in_progress">EN COURS</option>
                    <option value="in_review">EN REVUE</option>
                    <option value="done">TERMINÉ</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-[var(--border)]">
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => setShowFilterPopover(false)}
                >
                  Appliquer
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Export direct */}
        {onOpenExportModal && (
          <Button
            variant="secondary"
            size="sm"
            data-testid="btn-export-modal"
            onClick={onOpenExportModal}
            icon={<Download className="w-3.5 h-3.5 text-[var(--brand)]" />}
            title="Exporter les données (CSV, JSON)"
            aria-label="Exporter"
            className="hidden sm:inline-flex"
          >
            <span className="hidden xl:inline font-mono text-xs uppercase">EXPORTER</span>
          </Button>
        )}

        {/* Sécurité & RGPD direct */}
        {onOpenSecurityModal && (
          <Button
            variant="secondary"
            size="sm"
            data-testid="btn-security-modal-direct"
            onClick={onOpenSecurityModal}
            icon={<ShieldCheck className="w-3.5 h-3.5 text-[var(--brand)]" />}
            title="Sécurité & Conformité RGPD"
            aria-label="Sécurité et conformité"
            className="hidden sm:inline-flex"
          >
            <span className="hidden xl:inline font-mono text-xs uppercase">SÉCURITÉ</span>
          </Button>
        )}

        {/* Menu déroulant groupé : Outils & Actions Secondaires */}
        {(onOpenShareModal || onOpenReportModal || onOpenExportModal || onOpenImportModal || onOpenSecurityModal || onOpenCreateProjectModal) && (
          <div className="relative" ref={actionsMenuRef}>
            <Button
              data-testid="btn-tools-menu"
              variant="secondary"
              size="sm"
              icon={<SlidersHorizontal className="w-3.5 h-3.5 text-[var(--brand)]" />}
              iconRight={<ChevronDown className={`w-3 h-3 text-[var(--text-muted)] transition-transform ${showActionsMenu ? 'rotate-180' : ''}`} />}
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              title="Outils et actions complémentaires"
              aria-label="Outils du projet"
              aria-expanded={showActionsMenu}
            >
              <span className="hidden md:inline font-mono text-xs uppercase">OUTILS</span>
            </Button>

            {showActionsMenu && (
              <div className="absolute right-0 top-11 w-64 bg-[var(--surface-raised)] rounded-md shadow-[var(--shadow)] border border-[var(--border)] p-1.5 z-50 animate-in fade-in zoom-in-95 font-ui text-[var(--text)]">
                <div className="px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] tracking-wider border-b border-[var(--border)] mb-1">
                  Outils & Actions complémentaires
                </div>

                {/* Nouveau projet via menu */}
                {onOpenCreateProjectModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsMenu(false);
                      onOpenCreateProjectModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs text-[var(--text)] hover:bg-[var(--surface-2)] transition text-left group"
                  >
                    <div className="w-6 h-6 rounded bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      <FolderPlus className="w-3.5 h-3.5 text-[var(--brand)]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--text)] group-hover:text-[var(--brand)]">Nouveau projet</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Créer un espace de projet</div>
                    </div>
                  </button>
                )}

                {/* Synthèse CoDir */}
                {onOpenReportModal && (
                  <button
                    type="button"
                    data-testid="btn-report-modal"
                    onClick={() => {
                      setShowActionsMenu(false);
                      onOpenReportModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs text-[var(--text)] hover:bg-[var(--surface-2)] transition text-left group"
                  >
                    <div className="w-6 h-6 rounded bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-[var(--brand)]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--text)] group-hover:text-[var(--brand)]">Rapport CoDir / Copil</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Synthèse exécutive PDF</div>
                    </div>
                  </button>
                )}

                {/* Partager */}
                {onOpenShareModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsMenu(false);
                      onOpenShareModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs text-[var(--text)] hover:bg-[var(--surface-2)] transition text-left group"
                  >
                    <div className="w-6 h-6 rounded bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      <Share2 className="w-3.5 h-3.5 text-[var(--brand)]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--text)] group-hover:text-[var(--brand)]">Partager le projet</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Lien et droits d'accès</div>
                    </div>
                  </button>
                )}

                {/* Exporter */}
                {onOpenExportModal && (
                  <button
                    type="button"
                    data-testid="btn-export-modal-menu"
                    onClick={() => {
                      setShowActionsMenu(false);
                      onOpenExportModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs text-[var(--text)] hover:bg-[var(--surface-2)] transition text-left group"
                  >
                    <div className="w-6 h-6 rounded bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      <Download className="w-3.5 h-3.5 text-[var(--brand)]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--text)] group-hover:text-[var(--brand)]">Exporter les données</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Format CSV ou JSON</div>
                    </div>
                  </button>
                )}

                {/* Importer */}
                {onOpenImportModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsMenu(false);
                      onOpenImportModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs text-[var(--text)] hover:bg-[var(--surface-2)] transition text-left group"
                  >
                    <div className="w-6 h-6 rounded bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      <Upload className="w-3.5 h-3.5 text-[var(--brand)]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--text)] group-hover:text-[var(--brand)]">Importer un fichier</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Restaurer des sauvegardes</div>
                    </div>
                  </button>
                )}

                {/* Sécurité & Audit RGPD */}
                {onOpenSecurityModal && (
                  <button
                    type="button"
                    data-testid="btn-security-modal"
                    onClick={() => {
                      setShowActionsMenu(false);
                      onOpenSecurityModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs text-[var(--text)] hover:bg-[var(--surface-2)] transition text-left group border-t border-[var(--border)] mt-1 pt-2"
                  >
                    <div className="w-6 h-6 rounded bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand)]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--text)] group-hover:text-[var(--brand)]">Sécurité & Conformité</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Journal d'audit & RGPD</div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifPopover(!showNotifPopover)}
            className="btn btn-secondary btn-icon relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-[var(--color-primary)]" />
            {unreadNotifs.length > 0 && (
              <span className="count-dot">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {/* Popover notifications */}
          {showNotifPopover && (
            <div className="absolute right-0 top-12 w-80 bg-[var(--surface-raised)] rounded-md shadow-[var(--shadow)] border border-[var(--border)] p-4 z-50 animate-in fade-in zoom-in-95 text-[var(--text)]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)]">
                <span className="text-xs font-bold text-[var(--text)] uppercase font-mono">
                  Notifications ({unreadNotifs.length})
                </span>
                {unreadNotifs.length > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] text-[var(--brand)] font-semibold hover:underline"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] text-center py-4">
                    Aucune notification.
                  </p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-2.5 rounded border text-xs cursor-pointer transition ${
                        !n.read
                          ? 'bg-[var(--surface-2)] border-[var(--brand)] text-[var(--text)]'
                          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-[var(--text)]">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          {formatRelativeTimeFrench(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Interrupteur Thème Clair / Sombre */}
        <button
          type="button"
          data-testid="btn-theme-toggle"
          onClick={() => {
            const next = isDark ? 'blanc' : 'nuit';
            setTheme(next);
          }}
          className="btn btn-secondary btn-icon"
          title={isDark ? 'Passer en thème clair (Blanc)' : 'Passer en thème sombre (Nuit)'}
          aria-label="Basculer thème clair/sombre"
        >
          {isDark ? <Sun className="w-4 h-4 text-[var(--color-primary)]" /> : <Moon className="w-4 h-4 text-[var(--color-primary)]" />}
        </button>

        {/* Bouton et Popover Apparence globale */}
        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            data-testid="btn-appearance"
            onClick={() => setShowAppearancePopover(!showAppearancePopover)}
            icon={<Palette className="w-3.5 h-3.5 text-[var(--brand)]" />}
            title="Personnaliser l'apparence : 4 thèmes de fond (Alt+T)"
            aria-label="Apparence globale"
          >
            <span className="hidden xl:inline text-xs font-bold uppercase tracking-wider font-mono">
              APPARENCE
            </span>
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shadow-sm transition-transform group-hover:scale-125 ml-0.5"
              style={{
                backgroundColor: themeData.colors.primary,
                boxShadow: `0 0 6px ${themeData.colors.primary}`,
              }}
              title={`Thème actif : ${themeData.name}`}
            />
          </Button>

          <AppearancePopover
            isOpen={showAppearancePopover}
            onClose={() => setShowAppearancePopover(false)}
          />
        </div>

        {/* Indicateur de synchronisation & Hors-ligne */}
        <SyncStatusBadge />
      </div>
    </header>
  );
}
