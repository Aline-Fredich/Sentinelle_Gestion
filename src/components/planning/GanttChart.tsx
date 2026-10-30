'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar, ChevronRight, ChevronDown, Plus, 
  ArrowRight, AlertCircle, Link2, Trash2, CheckCircle2, Clock, X 
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { Task, ProjectPhase, TaskDependency } from '@/types/sentinel';
import { renderSentinelIcon } from '@/lib/iconRegistry';
import { formatDayMonthFrench, getTodayDateString, daysBetweenDates } from '@/lib/dateUtils';
import { calculateCriticalPathMethod } from '@/domain/dependencies';

interface GanttChartProps {
  onOpenTaskModal: (task?: Task) => void;
  onOpenIconPicker?: (phaseId: string) => void;
}

export function GanttChart({ onOpenTaskModal, onOpenIconPicker }: GanttChartProps) {
  const { 
    currentProject, phases, filteredTasks, dependencies, 
    addDependency, deleteDependency, createPhase, users 
  } = useSentinel();

  const [zoomLevel, setZoomLevel] = useState<'day' | 'week'>('day');
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    'phase-1': true,
    'phase-2': true,
    'phase-3': true,
  });

  const [showAddDepModal, setShowAddDepModal] = useState(false);
  const [predTaskId, setPredTaskId] = useState('');
  const [succTaskId, setSuccTaskId] = useState('');
  const [depError, setDepError] = useState('');

  const [showNewPhaseModal, setShowNewPhaseModal] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseDesc, setNewPhaseDesc] = useState('');
  const [newPhaseStart, setNewPhaseStart] = useState(getTodayDateString());
  const [newPhaseEnd, setNewPhaseEnd] = useState('');

  const [showOnlyCriticalPath, setShowOnlyCriticalPath] = useState(false);

  // Calcul CPM de la méthode du chemin critique
  const cpmResult = useMemo(() => {
    return calculateCriticalPathMethod(filteredTasks, dependencies);
  }, [filteredTasks, dependencies]);

  const today = getTodayDateString();

  // Période globale du calendrier Gantt
  const ganttStartDate = useMemo(() => {
    let earliest = '2026-10-01';
    filteredTasks.forEach(t => {
      if (t.startDate && t.startDate < earliest) earliest = t.startDate;
    });
    return earliest;
  }, [filteredTasks]);

  const totalDays = 55; // Horizon de visualisation

  // Génération des jours de l'axe temporel
  const calendarDays = useMemo(() => {
    const list: Array<{ dateStr: string; dayNumber: number; isToday: boolean; isWeekend: boolean }> = [];
    const baseDate = new Date(ganttStartDate);
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayOfWeek = d.getDay();
      list.push({
        dateStr,
        dayNumber: d.getDate(),
        isToday: dateStr === today,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }
    return list;
  }, [ganttStartDate, today, totalDays]);

  const dayWidthPx = zoomLevel === 'day' ? 36 : 24;

  const togglePhaseExpand = (phaseId: string) => {
    setExpandedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  const handleAddDependency = (e: React.FormEvent) => {
    e.preventDefault();
    setDepError('');
    if (!predTaskId || !succTaskId) {
      setDepError('Veuillez sélectionner la tâche précédente et la tâche suivante.');
      return;
    }
    const res = addDependency(predTaskId, succTaskId);
    if (!res.success) {
      setDepError(res.error || 'Erreur lors de l’ajout de la liaison.');
      return;
    }
    setShowAddDepModal(false);
    setPredTaskId('');
    setSuccTaskId('');
  };

  const handleCreatePhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseName.trim()) return;
    createPhase({
      projectId: currentProject ? currentProject.id : 'prj-1',
      name: newPhaseName.trim(),
      description: newPhaseDesc.trim(),
      order: phases.length + 1,
      startDate: newPhaseStart,
      endDate: newPhaseEnd || newPhaseStart,
      iconKey: 'layers',
    });
    setShowNewPhaseModal(false);
    setNewPhaseName('');
    setNewPhaseDesc('');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Barre de contrôle du Gantt */}
      <div className="panel flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] border border-red bg-red/10 flex items-center justify-center text-red">
            <Calendar className="w-5 h-5 text-red" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red shadow-[var(--glow-sm)]" />
              <h1 className="text-base font-bold text-white uppercase tracking-wider">
                DIAGRAMME DE GANTT INTERACTIF
              </h1>
            </div>
            <p className="text-xs text-white/45">
              Phases hiérarchiques, durées et liens de dépendances sans boucles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="tabs">
            <button
              onClick={() => setZoomLevel('day')}
              aria-selected={zoomLevel === 'day'}
              className="tab"
            >
              JOUR
            </button>
            <button
              onClick={() => setZoomLevel('week')}
              aria-selected={zoomLevel === 'week'}
              className="tab"
            >
              SEMAINE
            </button>
          </div>

          {/* Chemin critique CPM toggle */}
          <button
            type="button"
            onClick={() => setShowOnlyCriticalPath(prev => !prev)}
            className={`btn btn-sm ${showOnlyCriticalPath ? 'btn-primary bg-red border-red text-white' : 'btn-secondary'}`}
            title="Mettre en évidence ou filtrer les tâches sur le chemin critique CPM"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>CHEMIN CRITIQUE ({cpmResult.criticalTaskIds.length})</span>
          </button>

          {/* Dépendance */}
          <button
            data-testid="btn-add-dep-modal"
            onClick={() => setShowAddDepModal(true)}
            className="btn btn-secondary btn-sm"
          >
            <Link2 className="w-3.5 h-3.5 text-red" />
            <span>LIER DES TÂCHES</span>
          </button>

          {/* Nouvelle phase */}
          <button
            onClick={() => setShowNewPhaseModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>NOUVELLE PHASE</span>
          </button>
        </div>
      </div>

      {/* Conteneur principal du Gantt avec défilement synchronisé */}
      <div className="panel p-0 overflow-hidden flex flex-col border-[#242424]">
        <div className="overflow-x-auto flex">
          {/* Colonne de gauche fixe : Arborescence des phases et tâches */}
          <div className="w-80 sm:w-96 flex-shrink-0 border-r border-[#242424] bg-[#050505] select-none">
            {/* En-tête gauche */}
            <div className="h-12 px-4 flex items-center font-bold text-micro uppercase tracking-wider text-white border-b border-[#242424] bg-red">
              PHASES & TÂCHES
            </div>

            {/* Lignes de l'arborescence */}
            <div className="divide-y divide-[#242424]">
              {phases.map(phase => {
                const phaseTasks = filteredTasks.filter(t => t.phaseId === phase.id);
                const isExpanded = expandedPhases[phase.id] ?? true;
                const completedTasks = phaseTasks.filter(t => t.status === 'done').length;
                const phaseProgress = phaseTasks.length > 0 ? Math.round((completedTasks / phaseTasks.length) * 100) : 0;

                return (
                  <div key={phase.id}>
                    {/* Ligne de Phase */}
                    <div className="h-10 px-3 flex items-center justify-between bg-[#0D0D0D] border-b border-[#242424]">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => togglePhaseExpand(phase.id)}
                          className="p-1 text-white/70 hover:text-white"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => onOpenIconPicker && onOpenIconPicker(phase.id)}
                          title="Modifier l'icône de la phase"
                          className="text-red hover:scale-110 transition"
                        >
                          {renderSentinelIcon(phase.iconKey || 'layers', 'w-4 h-4')}
                        </button>
                        <span className="text-xs font-bold text-white uppercase tracking-wide truncate">
                          {phase.name}
                        </span>
                      </div>
                      <span className="badge-rate font-mono">
                        {phaseProgress}%
                      </span>
                    </div>

                    {/* Tâches sous la phase */}
                    {isExpanded && (
                      <div className="divide-y divide-[#242424]">
                        {phaseTasks.length === 0 ? (
                          <div className="h-8 pl-10 pr-3 flex items-center text-micro text-white/45 italic">
                            Aucune tâche rattachée
                          </div>
                        ) : (
                          phaseTasks.map(task => {
                            const assignee = users.find(u => u.id === task.assigneeId);
                            return (
                              <div
                                key={task.id}
                                onClick={() => onOpenTaskModal(task)}
                                className="h-10 pl-8 pr-3 flex items-center justify-between hover:bg-red/10 cursor-pointer transition text-xs group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-2 h-2 rounded-full ${
                                    task.status === 'done' ? 'bg-white' : 'bg-red'
                                  }`} />
                                  <span className="text-white group-hover:text-red font-medium truncate uppercase tracking-wide text-micro">
                                    {task.title}
                                  </span>
                                </div>
                                {assignee && (
                                  <span className="w-5 h-5 rounded-[4px] border border-red bg-red/10 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                                    {assignee.name.charAt(0)}
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Zone droite : Axe temporel & Barres horizontales */}
          <div className="flex-1 overflow-x-auto min-w-[700px] relative select-none bg-black">
            {/* Axe des jours */}
            <div className="h-12 border-b border-[#242424] flex bg-[#050505]">
              {calendarDays.map(day => (
                <div
                  key={day.dateStr}
                  style={{ width: `${dayWidthPx}px` }}
                  className={`flex-shrink-0 flex flex-col items-center justify-center border-r border-[#242424] font-mono text-[10px] ${
                    day.isToday
                      ? 'bg-red text-white font-bold'
                      : day.isWeekend
                      ? 'bg-[#0D0D0D] text-white/30'
                      : 'text-white/70'
                  }`}
                  title={day.dateStr}
                >
                  <span>{day.dayNumber}</span>
                </div>
              ))}
            </div>

            {/* Lignes horizontales pour phases et tâches */}
            <div className="divide-y divide-[#242424] relative">
              {phases.map(phase => {
                const phaseTasks = filteredTasks.filter(t => t.phaseId === phase.id);
                const isExpanded = expandedPhases[phase.id] ?? true;

                // Calcul position de la phase
                const phaseStartDiff = daysBetweenDates(ganttStartDate, phase.startDate || ganttStartDate) - 1;
                const phaseDuration = daysBetweenDates(phase.startDate || ganttStartDate, phase.endDate || phase.startDate || ganttStartDate);

                return (
                  <div key={phase.id}>
                    {/* Barre de Phase */}
                    <div className="h-10 relative flex items-center bg-[#0D0D0D]/40 border-b border-[#242424]">
                      <div
                        style={{
                          left: `${Math.max(0, phaseStartDiff) * dayWidthPx}px`,
                          width: `${Math.max(1, phaseDuration) * dayWidthPx}px`,
                        }}
                        className="absolute h-3.5 rounded-[3px] bg-white/20 border border-white/40"
                        title={`Phase : ${phase.name}`}
                      />
                    </div>

                    {/* Barres des tâches */}
                    {isExpanded && phaseTasks.map(task => {
                      const isCritical = cpmResult.criticalTaskIds.includes(task.id);
                      if (showOnlyCriticalPath && !isCritical) {
                        return null;
                      }

                      const sched = cpmResult.schedules.get(task.id);
                      const taskStart = task.startDate || ganttStartDate;
                      const taskEnd = task.dueDate || taskStart;
                      const startOffset = Math.max(0, daysBetweenDates(ganttStartDate, taskStart) - 1);
                      const duration = Math.max(1, daysBetweenDates(taskStart, taskEnd));
                      const isDone = task.status === 'done';

                      return (
                        <div key={task.id} className="h-10 relative flex items-center border-b border-[#242424]/60">
                          <div
                            onClick={() => onOpenTaskModal(task)}
                            style={{
                              left: `${startOffset * dayWidthPx}px`,
                              width: `${duration * dayWidthPx}px`,
                            }}
                            className={`absolute h-6 rounded-[4px] px-2 flex items-center shadow-sm cursor-pointer transition-all hover:scale-[1.02] border ${
                              isCritical
                                ? 'bg-[#FF3366] border-[#FF3366] text-white shadow-[0_0_12px_rgba(255,51,102,0.6)] ring-1 ring-white/50'
                                : isDone
                                ? 'bg-black border-white text-white'
                                : 'bg-red border-red text-white shadow-[0_0_8px_rgba(255,0,0,0.4)]'
                            }`}
                            title={`${task.title} (${taskStart} -> ${taskEnd})${isCritical ? ' [CHEMIN CRITIQUE CPM - Marge Totale: 0j]' : ` [Marge Totale: ${sched?.totalFloat ?? 0}j, Libre: ${sched?.freeFloat ?? 0}j]`}`}
                          >
                            <span className="text-[10px] font-bold uppercase truncate font-mono flex items-center gap-1">
                              {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                              {task.title}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Liste des dépendances actives */}
        {dependencies.length > 0 && (
          <div className="p-4 border-t border-[#242424] bg-[#050505]">
            <h4 className="text-micro font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-red" />
              LIAISONS DE DÉPENDANCES FIN → DÉBUT ENREGISTRÉES
            </h4>
            <div className="flex flex-wrap gap-2">
              {dependencies.map(dep => {
                const pred = filteredTasks.find(t => t.id === dep.predecessorTaskId);
                const succ = filteredTasks.find(t => t.id === dep.successorTaskId);
                if (!pred || !succ) return null;
                return (
                  <div
                    key={dep.id}
                    className="card-inner flex items-center gap-2 py-1 px-2.5 text-xs font-mono"
                  >
                    <span className="font-bold text-white truncate max-w-[140px] uppercase">
                      {pred.title}
                    </span>
                    <ArrowRight className="w-3 h-3 text-red flex-none" />
                    <span className="font-bold text-white truncate max-w-[140px] uppercase">
                      {succ.title}
                    </span>
                    <button
                      onClick={() => deleteDependency(dep.id)}
                      className="text-white/45 hover:text-red ml-1"
                      title="Supprimer la liaison"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal Ajout de Dépendance */}
      {showAddDepModal && (
        <div className="modal-overlay" onClick={() => setShowAddDepModal(false)} role="dialog" aria-modal="true">
          <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242424] mb-4">
              <div>
                <h3 className="modal-title mb-0">
                  AJOUTER UNE DÉPENDANCE FIN → DÉBUT
                </h3>
                <p className="text-micro text-white/45 mt-0.5">
                  La tâche suivante ne pourra débuter qu’après achèvement de la précédente.
                </p>
              </div>
              <button
                onClick={() => setShowAddDepModal(false)}
                className="btn btn-ghost btn-sm p-1"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {depError && (
              <div 
                data-testid="dep-error-message"
                className="alert alert--error mb-3 text-xs"
              >
                {depError}
              </div>
            )}

            <form onSubmit={handleAddDependency} className="space-y-4 text-xs">
              <div className="form-group mb-0">
                <label className="form-label">
                  Tâche précédente (Prédécesseur)
                </label>
                <select
                  data-testid="select-pred-task"
                  value={predTaskId}
                  onChange={(e) => setPredTaskId(e.target.value)}
                  className="form-select uppercase font-bold"
                >
                  <option value="">SÉLECTIONNER UNE TÂCHE...</option>
                  {filteredTasks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">
                  Tâche suivante (Successeur)
                </label>
                <select
                  data-testid="select-succ-task"
                  value={succTaskId}
                  onChange={(e) => setSuccTaskId(e.target.value)}
                  className="form-select uppercase font-bold"
                >
                  <option value="">SÉLECTIONNER UNE TÂCHE...</option>
                  {filteredTasks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions pt-4 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setShowAddDepModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  ANNULER
                </button>
                <button
                  type="submit"
                  data-testid="btn-submit-dep"
                  className="btn btn-primary btn-sm"
                >
                  VALIDER LA LIAISON
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nouvelle Phase */}
      {showNewPhaseModal && (
        <div className="modal-overlay" onClick={() => setShowNewPhaseModal(false)} role="dialog" aria-modal="true">
          <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242424] mb-4">
              <div>
                <h3 className="modal-title mb-0">
                  AJOUTER UNE PHASE DE PROJET
                </h3>
                <p className="text-micro text-white/45 mt-0.5">
                  Organisez vos livrables par étapes chronologiques.
                </p>
              </div>
              <button
                onClick={() => setShowNewPhaseModal(false)}
                className="btn btn-ghost btn-sm p-1"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            <form onSubmit={handleCreatePhase} className="space-y-4 text-xs">
              <div className="form-group mb-0">
                <label className="form-label">
                  Nom de la phase <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPhaseName}
                  onChange={(e) => setNewPhaseName(e.target.value)}
                  placeholder="Ex: Analyse & Spécifications..."
                  className="form-input"
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newPhaseDesc}
                  onChange={(e) => setNewPhaseDesc(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div className="form-row">
                <div className="form-group mb-0">
                  <label className="form-label">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={newPhaseStart}
                    onChange={(e) => setNewPhaseStart(e.target.value)}
                    className="form-input font-mono"
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={newPhaseEnd}
                    onChange={(e) => setNewPhaseEnd(e.target.value)}
                    className="form-input font-mono"
                  />
                </div>
              </div>

              <div className="modal-actions pt-4 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setShowNewPhaseModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  ANNULER
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  CRÉER LA PHASE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
