'use client';

import React, { useState, useMemo } from 'react';
import { 
  Folder, Calendar, Users, Flag, 
  Share2, CheckCircle2, Clock, 
  Layers, BarChart2, Edit3, UserPlus, Play, Square, MessageSquare, ArrowRight
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { renderSentinelIcon } from '@/lib/iconRegistry';
import { formatShortDateFrench } from '@/lib/dateUtils';
import { GanttChart } from '@/components/planning/GanttChart';
import { TrackingBoard } from '@/components/tracking/TrackingBoard';
import { EditProjectModal } from '@/components/dialogs/EditProjectModal';
import { InviteMemberModal } from '@/components/team/InviteMemberModal';
import { Task } from '@/types/sentinel';
import { formatCurrency } from '@/lib/currencyUtils';

interface ProjectSheetProps {
  onOpenTaskModal: (task?: Task) => void;
  onOpenIconPicker: (targetId: string) => void;
  onOpenShareModal: () => void;
  onOpenExportModal: () => void;
  onOpenImportModal: () => void;
}

export function ProjectSheet({
  onOpenTaskModal,
  onOpenIconPicker,
  onOpenShareModal,
  onOpenExportModal,
  onOpenImportModal,
}: ProjectSheetProps) {
  const { 
    currentProject, metrics, milestones, users, documents,
    timeEntries, activeTimer, startTimer, stopTimer,
    forumTopics, setActiveView, setActiveProjectId, tasks
  } = useSentinel();

  const [internalTab, setInternalTab] = useState<'sheet' | 'planning' | 'tracking'>('sheet');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Calcul du temps dédié à ce projet
  const projectTimeEntries = useMemo(() => {
    if (!currentProject) return [];
    return timeEntries.filter(t => t.projectId === currentProject.id);
  }, [timeEntries, currentProject]);

  const totalMinutes = useMemo(() => {
    return projectTimeEntries.reduce((sum, t) => sum + t.durationMinutes, 0);
  }, [projectTimeEntries]);

  const totalHours = (totalMinutes / 60).toFixed(1);
  const allocatedHours = currentProject?.allocatedHours || 120;
  const timeProgressPct = Math.min(100, Math.round((Number(totalHours) / (allocatedHours || 1)) * 100));

  // Tâches du projet
  const projectTasks = useMemo(() => {
    if (!currentProject) return [];
    return tasks.filter(t => t.projectId === currentProject.id);
  }, [tasks, currentProject]);

  const doneTasksCount = projectTasks.filter(t => t.status === 'done').length;
  const projectProgressPct = projectTasks.length > 0 
    ? Math.round((doneTasksCount / projectTasks.length) * 100) 
    : metrics.completionRate;

  // Sujets du forum du projet
  const projectTopics = useMemo(() => {
    if (!currentProject) return [];
    return forumTopics.filter(f => f.projectId === currentProject.id);
  }, [forumTopics, currentProject]);

  if (!currentProject) {
    return (
      <div className="empty panel max-w-lg mx-auto my-12">
        <Folder className="w-10 h-10 text-[var(--red)]" />
        <h3 className="text-base font-bold text-white uppercase tracking-wider">
          Veuillez sélectionner un projet
        </h3>
        <p className="text-xs text-[var(--white-70)] text-center">
          Sélectionnez un projet dans la barre supérieure ou créez un nouvel espace pour afficher sa supervision complète.
        </p>
      </div>
    );
  }

  const projectMilestones = milestones.filter(m => m.projectId === currentProject.id);
  const leadUser = users.find(u => u.id === currentProject.leadUserId) || users[0];
  const isTimerRunningOnThisProject = activeTimer && activeTimer.projectId === currentProject.id;

  const handleToggleTimer = () => {
    if (isTimerRunningOnThisProject) {
      stopTimer();
    } else {
      startTimer(currentProject.id, undefined, `Session dédiée sur ${currentProject.name}`);
    }
  };

  return (
    <div className="stack animate-in fade-in duration-200">
      {/* 1. En-tête Fiche & Dashboard de Projet Hero */}
      <div className="panel panel--hero space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Icône du projet personnalisable */}
            <button
              onClick={() => onOpenIconPicker(currentProject.id)}
              className="w-16 h-16 rounded-[var(--r-md)] bg-black text-[var(--red)] flex items-center justify-center border border-[var(--red-soft)] shadow-[var(--glow-sm)] hover:border-[var(--red)] transition flex-none"
              title="Personnaliser l'icône du projet"
            >
              {renderSentinelIcon(currentProject.iconKey, 'w-8 h-8')}
            </button>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-role">
                  {currentProject.reference}
                </span>

                <span className={`badge ${currentProject.status === 'active' ? 'badge--ok' : 'badge--bad'}`}>
                  {currentProject.status === 'active' ? 'ACTIF' : currentProject.status.toUpperCase()}
                </span>

                <span className="badge">
                  PRIORITÉ {currentProject.priority.toUpperCase()}
                </span>

                <span className="badge badge--info font-mono">
                  FORMULE {(currentProject.tier || 'standard').toUpperCase()}
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white uppercase">
                {currentProject.name}
              </h1>

              <p className="text-xs text-[var(--white-70)] max-w-3xl leading-relaxed">
                {currentProject.description}
              </p>
            </div>
          </div>

          {/* Boutons d'Action Clés : Éditer, Inviter, Partager */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn btn-primary"
            >
              <Edit3 className="w-4 h-4" />
              <span>Éditer</span>
            </button>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="btn btn-secondary"
            >
              <UserPlus className="w-4 h-4" />
              <span>Inviter</span>
            </button>

            <button
              onClick={onOpenShareModal}
              className="btn btn-secondary"
            >
              <Share2 className="w-4 h-4" />
              <span>Partager</span>
            </button>
          </div>
        </div>

        {/* Métriques d'Avancement, Calendrier et Budget */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-[var(--line)] text-xs">
          <div>
            <span className="text-[var(--white-45)] block text-[11px] font-bold uppercase tracking-wider mb-1">
              Administrateur Lead
            </span>
            <div className="flex items-center gap-2 mt-1">
              <img src={leadUser.avatar} alt={leadUser.name} className="w-6 h-6 rounded-[var(--r-xs)] border border-[var(--line-strong)]" />
              <span className="font-bold text-white truncate">
                {leadUser.name}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[var(--white-45)] block text-[11px] font-bold uppercase tracking-wider mb-1">
              Période du Projet
            </span>
            <span className="font-mono text-white block mt-1 font-semibold">
              {formatShortDateFrench(currentProject.startDate)} → {formatShortDateFrench(currentProject.dueDate)}
            </span>
          </div>

          <div>
            <span className="text-[var(--white-45)] block text-[11px] font-bold uppercase tracking-wider mb-1">
              Avancement des Tâches
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-20 bg-black border border-[var(--line)] rounded-full h-2 overflow-hidden flex-none">
                <div 
                  className="bg-[var(--red)] h-full shadow-[var(--glow-sm)] transition-all duration-300"
                  style={{ width: `${projectProgressPct}%` }}
                />
              </div>
              <span className="font-mono font-bold text-[var(--red)]">
                {projectProgressPct}% ({doneTasksCount}/{projectTasks.length})
              </span>
            </div>
          </div>

          <div>
            <span className="text-[var(--white-45)] block text-[11px] font-bold uppercase tracking-wider mb-1">
              Budget Financier
            </span>
            <span className="font-mono font-bold text-white block mt-1">
              {formatCurrency(currentProject.budget || 25000000)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Onglets de Navigation */}
      <div className="tabs">
        <button
          onClick={() => setInternalTab('sheet')}
          className="tab"
          aria-selected={internalTab === 'sheet'}
        >
          <Layers className="w-3.5 h-3.5 inline mr-1.5" />
          DASHBOARD & SUPERVISION
        </button>

        <button
          onClick={() => setInternalTab('tracking')}
          className="tab"
          aria-selected={internalTab === 'tracking'}
        >
          <BarChart2 className="w-3.5 h-3.5 inline mr-1.5" />
          TABLEAU DE SUIVI
        </button>

        <button
          onClick={() => setInternalTab('planning')}
          className="tab"
          aria-selected={internalTab === 'planning'}
        >
          <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
          PLANNING GANTT
        </button>
      </div>

      {/* 3. Contenu de l'onglet actif */}
      {internalTab === 'sheet' && (
        <div className="stack">
          {/* Grille 2 Colonnes : A. Temps Dédié au Projet | B. Administrateurs et Membres */}
          <div className="grid-2">
            {/* A. Supervision du Temps Dédié au Projet */}
            <div className="panel space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="panel-title text-sm">
                    TEMPS DÉDIÉ AU PROJET
                  </h3>
                  <p className="text-xs text-[var(--white-70)]">
                    Suivi précis des heures passées par l’équipe vs le temps alloué
                  </p>
                </div>

                {/* Bouton Chronomètre en direct */}
                <button
                  onClick={handleToggleTimer}
                  className={`btn ${isTimerRunningOnThisProject ? 'btn-danger animate-pulse' : 'btn-secondary'} btn-sm`}
                >
                  {isTimerRunningOnThisProject ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>ARRÊTER CHRONO</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-[var(--red)]" />
                      <span>CHRONOMÉTRER</span>
                    </>
                  )}
                </button>
              </div>

              {/* Indicateurs de Temps */}
              <div className="card-inner space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="font-mono text-3xl font-bold text-white">
                      {totalHours}H
                    </span>
                    <span className="text-xs text-[var(--white-45)] ml-1.5 uppercase font-bold tracking-wider">
                      consommées
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[var(--white-70)] block">
                      Plafond : <strong className="text-white font-mono">{allocatedHours}h</strong>
                    </span>
                    <div className="text-[11px] font-mono font-bold text-[var(--red)]">
                      {timeProgressPct}% DU BUDGET
                    </div>
                  </div>
                </div>

                <div className="progress">
                  <span style={{ width: `${timeProgressPct}%` }} />
                </div>
              </div>

              {/* Dernières sessions de temps enregistrées */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--white-70)] block">
                  Dernières sessions enregistrées ({projectTimeEntries.length})
                </span>

                {projectTimeEntries.length === 0 ? (
                  <p className="text-xs text-[var(--white-45)] italic py-3 text-center border border-[var(--line)] rounded-[var(--r-xs)]">
                    Aucune entrée de temps enregistrée pour ce projet pour le moment.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {projectTimeEntries.slice(0, 4).map(entry => (
                      <div 
                        key={entry.id}
                        className="p-2.5 rounded-[var(--r-xs)] bg-black border border-[var(--line)] flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-white">
                            {entry.description || 'Session de travail'}
                          </div>
                          <div className="text-[11px] text-[var(--white-45)] font-mono">
                            Par {entry.userName} • {formatShortDateFrench(entry.date)}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-[var(--red)] border border-[var(--red-soft)] px-2 py-0.5 rounded-[var(--r-xs)]">
                          {(entry.durationMinutes / 60).toFixed(1)}h
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* B. Administrateurs et Membres du Projet */}
            <div className="panel space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="panel-title text-sm">
                    ÉQUIPE DU PROJET
                  </h3>
                  <p className="text-xs text-[var(--white-70)]">
                    Collaborateurs assignés à cet espace de travail
                  </p>
                </div>

                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="btn btn-secondary btn-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>INVITER</span>
                </button>
              </div>

              {/* Administrateur Lead */}
              <div className="card-inner flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={leadUser.avatar} 
                    alt={leadUser.name} 
                    className="w-10 h-10 rounded-[var(--r-xs)] border border-[var(--red)]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {leadUser.name}
                      </span>
                      <span className="badge badge--ok text-[9px]">
                        ADMIN LEAD
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--white-45)] font-mono mt-0.5">
                      {leadUser.jobTitle} • {leadUser.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Membres assignés au projet */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--white-70)] block">
                  Membres et Collaborateurs ({currentProject.memberIds.length})
                </span>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {currentProject.memberIds.map(memId => {
                    const u = users.find(user => user.id === memId);
                    if (!u) return null;
                    return (
                      <div 
                        key={u.id}
                        className="p-2.5 rounded-[var(--r-xs)] bg-black border border-[var(--line)] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-[var(--r-xs)] border border-[var(--line-strong)]" />
                          <div>
                            <span className="font-bold text-white block">
                              {u.name}
                            </span>
                            <span className="text-[10px] text-[var(--white-45)] block font-mono">
                              {u.jobTitle}
                            </span>
                          </div>
                        </div>

                        <span className="badge text-[10px] uppercase font-mono">
                          {u.role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* C. Forum & Communication entre membres du projet */}
          <div className="panel space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="panel-title text-sm">
                  FORUM DE DISCUSSION DU PROJET
                </h3>
                <p className="text-xs text-[var(--white-70)]">
                  Échangez, posez des questions et partagez des décisions entre membres
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveProjectId(currentProject.id);
                  setActiveView('forum');
                }}
                className="btn btn-primary btn-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>OUVRIR LE FORUM</span>
              </button>
            </div>

            {projectTopics.length === 0 ? (
              <div className="p-6 text-center border border-[var(--line)] rounded-[var(--r-md)] bg-black space-y-3">
                <p className="text-xs text-[var(--white-45)]">
                  Aucun sujet de discussion actif pour l'instant sur ce projet.
                </p>
                <button
                  onClick={() => {
                    setActiveProjectId(currentProject.id);
                    setActiveView('forum');
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  CRÉER LE PREMIER SUJET
                </button>
              </div>
            ) : (
              <div className="grid-2">
                {projectTopics.slice(0, 4).map(topic => (
                  <div
                    key={topic.id}
                    className="p-3.5 rounded-[var(--r-sm)] bg-black border border-[var(--line)] hover:border-[var(--red-soft)] transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-white line-clamp-1">
                        {topic.title}
                      </div>
                      <div className="text-[11px] text-[var(--white-45)] font-mono mt-0.5">
                        Par {topic.authorName} • {topic.replyCount} réponse(s)
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveProjectId(currentProject.id);
                        setActiveView('forum');
                      }}
                      className="p-1.5 rounded-[var(--r-xs)] text-[var(--white-70)] hover:text-[var(--red)] transition"
                      aria-label="Accéder au sujet"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* D. Jalons majeurs du projet */}
          <div className="panel space-y-4">
            <h3 className="panel-title text-sm">
              JALONS MAJEURS & ÉCHÉANCES STRATÉGIQUES
            </h3>

            <div className="grid-2">
              {projectMilestones.map(mls => (
                <div
                  key={mls.id}
                  className="p-3.5 rounded-[var(--r-sm)] bg-black border border-[var(--line)] flex items-start justify-between"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-[var(--r-xs)] border border-[var(--red-soft)] text-[var(--red)]">
                      <Flag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        {mls.name}
                      </h4>
                      <p className="text-[11px] text-[var(--white-70)] mt-0.5">
                        {mls.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-xs font-mono font-bold text-white">
                      {formatShortDateFrench(mls.dueDate)}
                    </span>
                    <span className={`badge ${mls.status === 'reached' ? 'badge--ok' : 'badge--info'} text-[9px] mt-1`}>
                      {mls.status === 'reached' ? 'ATTEINT' : 'PLANIFIÉ'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {internalTab === 'planning' && (
        <GanttChart 
          onOpenTaskModal={onOpenTaskModal} 
          onOpenIconPicker={onOpenIconPicker} 
        />
      )}

      {internalTab === 'tracking' && (
        <TrackingBoard onOpenTaskModal={onOpenTaskModal} />
      )}

      {/* Modale d'édition du projet */}
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={currentProject}
      />

      {/* Modale d'invitation de membre */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}
