'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Bell, Moon, Sun, 
  X, Share2, Play, Square, Clock, Download, Upload 
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { formatRelativeTimeFrench } from '@/lib/dateUtils';
import { TaskPriority, TaskStatus } from '@/types/sentinel';

interface TopbarProps {
  onOpenNewTaskModal: () => void;
  onOpenShareModal?: () => void;
  onOpenExportModal?: () => void;
  onOpenImportModal?: () => void;
}

export function Topbar({
  onOpenNewTaskModal,
  onOpenShareModal,
  onOpenExportModal,
  onOpenImportModal,
}: TopbarProps) {
  const { 
    activeView, currentProject, activeProjectId, 
    searchQuery, setSearchQuery, filters, setFilters, 
    resetFilters, users, notifications, markNotificationAsRead, 
    markAllNotificationsAsRead, activeTimer, startTimer, stopTimer
  } = useSentinel();

  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [showTimerPopover, setShowTimerPopover] = useState(false);
  const [timerDesc, setTimerDesc] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Synchronisation du thème sombre au montage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('sentinel_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;
      setIsDarkMode(shouldBeDark);
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } catch {
      // Pas d'accès au localStorage (ex: SSR)
    }
  }, []);

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

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      try {
        if (next) {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
          localStorage.setItem('sentinel_theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
          localStorage.setItem('sentinel_theme', 'light');
        }
      } catch {
        // Ignorer
      }
      return next;
    });
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
      title: 'Planning & Diagramme de Gantt',
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
      title: 'Suivi du temps & Feuilles de temps',
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
    <header className="h-20 px-6 border-b border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0B132B] flex items-center justify-between gap-4 z-20">
      {/* Titre & Fil d'ariane */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-0.5">
          <span className="font-bold text-[#0066FF] tracking-wide uppercase">SENTINEL GESTION</span>
          <span>/</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {activeProjectId === 'all' ? 'Tous les projets' : (currentProject?.name || 'Projet')}
          </span>
        </div>
        <h1 className="text-lg font-bold text-[#0F172A] dark:text-white truncate">
          {currentMeta.title}
        </h1>
      </div>

      {/* Barre d'outils centrale & droite */}
      <div className="flex items-center gap-3">
        {/* Widget Chronomètre interactif en direct */}
        <div className="relative">
          {activeTimer ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-sm animate-pulse">
              <Clock className="w-4 h-4 text-[#0066FF]" />
              <span className="font-mono font-bold text-sm tracking-wider">
                {formatTimerDisplay(timerSeconds)}
              </span>
              <button
                onClick={stopTimer}
                title="Arrêter et enregistrer la session"
                className="ml-1 p-1 rounded-lg bg-red-600 hover:bg-red-700 text-white transition shadow-sm"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={() => setShowTimerPopover(!showTimerPopover)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition border border-slate-200 dark:border-slate-700"
              >
                <Play className="w-3.5 h-3.5 text-[#0066FF] fill-current" />
                <span className="hidden md:inline">Chronométrer</span>
              </button>

              {/* Popover démarrage chrono rapide */}
              {showTimerPopover && (
                <div className="absolute right-0 top-12 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                    Démarrer un chronomètre
                  </div>
                  <input
                    type="text"
                    value={timerDesc}
                    onChange={(e) => setTimerDesc(e.target.value)}
                    placeholder="Objet de la tâche..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl mb-3 text-slate-800 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const targetProj = activeProjectId === 'all' ? 'proj-1' : activeProjectId;
                        startTimer(targetProj, undefined, timerDesc);
                        setShowTimerPopover(false);
                        setTimerDesc('');
                      }}
                      className="flex-1 py-1.5 bg-[#0066FF] hover:bg-blue-600 text-white font-semibold text-xs rounded-xl transition"
                    >
                      Lancer
                    </button>
                    <button
                      onClick={() => setShowTimerPopover(false)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl"
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Bouton Filtrer avec Popover */}
        <div className="relative">
          <button
            onClick={() => setShowFilterPopover(!showFilterPopover)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition ${
              activeFiltersCount > 0
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-[#0066FF]'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filtrer</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#0066FF] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Panneau de filtres */}
          {showFilterPopover && (
            <div className="absolute right-0 top-12 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Filtres actifs
                </span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-[11px] text-[#0066FF] font-medium hover:underline"
                  >
                    Effacer tout
                  </button>
                )}
              </div>

              <div className="space-y-3 text-xs">
                {/* Intervenant */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Responsable assigné
                  </label>
                  <select
                    value={filters.memberId || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, memberId: e.target.value || undefined }))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
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
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Priorité
                  </label>
                  <select
                    value={filters.priority || 'all'}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as TaskPriority | 'all' }))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">Toutes les priorités</option>
                    <option value="urgent">🔴 Urgente</option>
                    <option value="high">🟠 Haute</option>
                    <option value="medium">🟡 Moyenne</option>
                    <option value="low">🟢 Basse</option>
                  </select>
                </div>

                {/* Statut */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Statut
                  </label>
                  <select
                    value={filters.status || 'all'}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as TaskStatus | 'all' }))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="todo">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="in_review">En revue</option>
                    <option value="done">Terminé</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setShowFilterPopover(false)}
                  className="w-full py-1.5 bg-[#0066FF] hover:bg-blue-600 text-white rounded-lg font-semibold text-xs transition"
                >
                  Appliquer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action principale : + Nouvelle tâche */}
        <button
          onClick={onOpenNewTaskModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-blue-600 active:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvelle tâche</span>
        </button>

        {/* Bouton Partager */}
        {onOpenShareModal && (
          <button
            onClick={onOpenShareModal}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Partager le projet"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}

        {/* Bouton Exporter */}
        {onOpenExportModal && (
          <button
            onClick={onOpenExportModal}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Exporter les données (JSON / CSV)"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Bouton Importer */}
        {onOpenImportModal && (
          <button
            onClick={onOpenImportModal}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Importer un fichier (JSON / CSV)"
          >
            <Upload className="w-4 h-4" />
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifPopover(!showNotifPopover)}
            className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#FF1E27] ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Popover notifications */}
          {showNotifPopover && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Notifications ({unreadNotifs.length})
                </span>
                {unreadNotifs.length > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] text-[#0066FF] font-medium hover:underline"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
                    Aucune notification.
                  </p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        !n.read
                          ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                          : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {formatRelativeTimeFrench(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Toggle Mode Clair / Sombre */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
