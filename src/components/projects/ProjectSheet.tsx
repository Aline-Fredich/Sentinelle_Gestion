'use client';

import React, { useState, useMemo } from 'react';
import { 
  Folder, Calendar, Users, Flag, ExternalLink, 
  Share2, Download, Upload, CheckCircle2, Clock, 
  Layers, BarChart2, FolderKanban, FileText, Plus, Shield, 
  Edit3, UserPlus, Play, Square, MessageSquare, ArrowRight,
  TrendingUp, Award, DollarSign
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { renderSentinelIcon } from '@/lib/iconRegistry';
import { formatShortDateFrench, formatRelativeTimeFrench } from '@/lib/dateUtils';
import { GanttChart } from '@/components/planning/GanttChart';
import { TrackingBoard } from '@/components/tracking/TrackingBoard';
import { EditProjectModal } from '@/components/dialogs/EditProjectModal';
import { InviteMemberModal } from '@/components/team/InviteMemberModal';
import { Task } from '@/types/sentinel';

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
      <div className="p-12 text-center apple-card max-w-lg mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center mx-auto">
          <Folder className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Veuillez sélectionner un projet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sélectionnez un projet dans la barre supérieure ou créez un nouvel espace pour afficher sa supervision complète.
          </p>
        </div>
      </div>
    );
  }

  const projectMilestones = milestones.filter(m => m.projectId === currentProject.id);
  const projectDocs = documents.filter(d => d.projectId === currentProject.id);
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
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* 1. En-tête Fiche & Dashboard de Projet Apple */}
      <div className="p-7 rounded-3xl apple-card shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Icône du projet Apple */}
            <button
              onClick={() => onOpenIconPicker(currentProject.id)}
              className="w-16 h-16 rounded-3xl bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center border border-black/5 dark:border-white/10 shadow-sm hover:scale-105 active:scale-95 transition"
              title="Personnaliser l'icône du projet"
            >
              {renderSentinelIcon(currentProject.iconKey, 'w-8 h-8')}
            </button>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider text-[#0071E3] dark:text-[#2997FF]">
                  {currentProject.reference}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">
                  {currentProject.status === 'active' ? '🟢 Actif' : currentProject.status}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9F0A]/10 text-[#FF9F0A] border border-[#FF9F0A]/20">
                  Priorité {currentProject.priority}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Formule {(currentProject.tier || 'standard').toUpperCase()}
                </span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {currentProject.name}
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
                {currentProject.description}
              </p>
            </div>
          </div>

          {/* Boutons d'Action Clés : Éditer, Inviter, Partager */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="apple-btn-primary text-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Éditer le projet</span>
            </button>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="apple-btn-secondary text-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Inviter membre</span>
            </button>

            <button
              onClick={onOpenShareModal}
              className="apple-btn-secondary text-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Partager</span>
            </button>
          </div>
        </div>

        {/* Métriques d'Avancement, Calendrier et Budget */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-black/5 dark:border-white/5 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] mb-0.5">Administrateur Lead</span>
            <div className="flex items-center gap-2 mt-1">
              <img src={leadUser.avatar} alt={leadUser.name} className="w-5 h-5 rounded-full" />
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {leadUser.name}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] mb-0.5">Période du Projet</span>
            <span className="font-semibold text-slate-900 dark:text-white block mt-1">
              {formatShortDateFrench(currentProject.startDate)} → {formatShortDateFrench(currentProject.dueDate)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] mb-0.5">Avancement des Tâches</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[#0071E3] dark:bg-[#2997FF] h-full rounded-full"
                  style={{ width: `${projectProgressPct}%` }}
                />
              </div>
              <span className="font-bold text-[#0071E3] dark:text-[#2997FF]">
                {projectProgressPct}% ({doneTasksCount}/{projectTasks.length})
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] mb-0.5">Budget Financier</span>
            <span className="font-semibold text-slate-900 dark:text-white block mt-1">
              {currentProject.budget ? `${currentProject.budget.toLocaleString()} €` : '35 000 €'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Onglets de Navigation Apple */}
      <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-2">
        <button
          onClick={() => setInternalTab('sheet')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition ${
            internalTab === 'sheet'
              ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Dashboard & Supervision</span>
        </button>

        <button
          onClick={() => setInternalTab('tracking')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition ${
            internalTab === 'tracking'
              ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Tableau de Suivi</span>
        </button>

        <button
          onClick={() => setInternalTab('planning')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition ${
            internalTab === 'planning'
              ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Planning Gantt</span>
        </button>
      </div>

      {/* 3. Contenu de l'onglet actif */}
      {internalTab === 'sheet' && (
        <div className="space-y-6">
          {/* Grille 2 Colonnes : A. Temps Dédié au Projet | B. Administrateurs et Membres */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* A. Supervision du Temps Dédié au Projet */}
            <div className="p-6 rounded-3xl apple-card space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#FF9F0A]" />
                    Temps Dédié à ce Projet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Suivi précis des heures passées par l’équipe vs le temps alloué
                  </p>
                </div>

                {/* Bouton Chronomètre en direct */}
                <button
                  onClick={handleToggleTimer}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                    isTimerRunningOnThisProject
                      ? 'bg-[#FF3B30] text-white animate-pulse shadow-md'
                      : 'apple-btn-secondary text-xs'
                  }`}
                >
                  {isTimerRunningOnThisProject ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Arrêter Chrono</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-[#34C759]" />
                      <span>Chronométrer</span>
                    </>
                  )}
                </button>
              </div>

              {/* Indicateurs de Temps */}
              <div className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-black/5 dark:border-white/5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {totalHours}h
                    </span>
                    <span className="text-xs text-slate-400 font-medium ml-1.5">
                      consommées
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Plafond alloué : <strong className="text-slate-900 dark:text-white">{allocatedHours}h</strong>
                    </span>
                    <div className="text-[11px] font-bold text-[#FF9F0A]">
                      {timeProgressPct}% du budget d'heures
                    </div>
                  </div>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      timeProgressPct >= 90 ? 'bg-[#FF3B30]' : timeProgressPct >= 70 ? 'bg-[#FF9F0A]' : 'bg-[#34C759]'
                    }`}
                    style={{ width: `${timeProgressPct}%` }}
                  />
                </div>
              </div>

              {/* Dernières sessions de temps enregistrées */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Dernières sessions enregistrées ({projectTimeEntries.length})
                </span>

                {projectTimeEntries.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Aucune entrée de temps enregistrée pour ce projet pour le moment.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {projectTimeEntries.slice(0, 4).map(entry => (
                      <div 
                        key={entry.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {entry.description || 'Session de travail'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Par {entry.userName} • {formatShortDateFrench(entry.date)}
                          </div>
                        </div>
                        <span className="font-bold text-[#0071E3] dark:text-[#2997FF] bg-[#0071E3]/10 px-2 py-0.5 rounded-lg">
                          {(entry.durationMinutes / 60).toFixed(1)}h
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* B. Administrateurs et Membres du Projet */}
            <div className="p-6 rounded-3xl apple-card space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0071E3] dark:text-[#2997FF]" />
                    Administrateurs & Membres du Projet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Équipe dédiée collaborant sur cet espace de travail
                  </p>
                </div>

                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="apple-btn-secondary text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Inviter</span>
                </button>
              </div>

              {/* Administrateur Lead */}
              <div className="p-3.5 rounded-2xl bg-[#0071E3]/5 dark:bg-[#2997FF]/10 border border-[#0071E3]/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={leadUser.avatar} 
                    alt={leadUser.name} 
                    className="w-10 h-10 rounded-full shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {leadUser.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[#0071E3] text-white">
                        Administrateur Lead
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {leadUser.jobTitle} • {leadUser.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Membres assignés au projet */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Membres et Collaborateurs ({currentProject.memberIds.length})
                </span>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {currentProject.memberIds.map(memId => {
                    const u = users.find(user => user.id === memId);
                    if (!u) return null;
                    return (
                      <div 
                        key={u.id}
                        className="p-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-black/5 dark:border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full" />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {u.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {u.jobTitle}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold text-slate-500 uppercase">
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
          <div className="p-6 rounded-3xl apple-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#34C759]" />
                  Forum de Discussion du Projet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Échangez, posez des questions et partagez des décisions entre membres du projet
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveProjectId(currentProject.id);
                  setActiveView('forum');
                }}
                className="apple-btn-primary text-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ouvrir le forum du projet</span>
              </button>
            </div>

            {projectTopics.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E]/50 border border-black/5 dark:border-white/5 space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aucun sujet de discussion actif pour l'instant sur ce projet.
                </p>
                <button
                  onClick={() => {
                    setActiveProjectId(currentProject.id);
                    setActiveView('forum');
                  }}
                  className="apple-btn-secondary text-xs"
                >
                  Créer le premier sujet
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {projectTopics.slice(0, 4).map(topic => (
                  <div
                    key={topic.id}
                    className="p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-black/5 dark:border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1">
                        {topic.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Par {topic.authorName} • {topic.replyCount} réponse(s)
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveProjectId(currentProject.id);
                        setActiveView('forum');
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#0071E3] transition"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* D. Jalons majeurs du projet */}
          <div className="p-6 rounded-3xl apple-card space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flag className="w-4 h-4 text-[#0071E3] dark:text-[#2997FF]" />
              Jalons Majeurs & Échéances Stratégiques
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projectMilestones.map(mls => (
                <div
                  key={mls.id}
                  className="p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-black/5 dark:border-white/5 flex items-start justify-between"
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-1.5 rounded-xl ${
                      mls.status === 'reached' 
                        ? 'bg-[#34C759]/10 text-[#34C759]' 
                        : 'bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF]'
                    }`}>
                      <Flag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {mls.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {mls.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-xs font-semibold text-slate-900 dark:text-white">
                      {formatShortDateFrench(mls.dueDate)}
                    </span>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      mls.status === 'reached'
                        ? 'bg-[#34C759]/10 text-[#34C759]'
                        : 'bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF]'
                    }`}>
                      {mls.status === 'reached' ? 'Atteint' : 'Planifié'}
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
