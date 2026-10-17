'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar, ChevronRight, ChevronDown, Plus, 
  ArrowRight, AlertCircle, Link2, Trash2, CheckCircle2, Clock 
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { Task, ProjectPhase, TaskDependency } from '@/types/sentinel';
import { renderSentinelIcon } from '@/lib/iconRegistry';
import { formatDayMonthFrench, getTodayDateString, daysBetweenDates } from '@/lib/dateUtils';

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

  const today = getTodayDateString();

  // Période globale du calendrier Gantt (ex: du 1er octobre au 30 novembre)
  const ganttStartDate = useMemo(() => {
    let earliest = '2026-10-01';
    filteredTasks.forEach(t => {
      if (t.startDate && t.startDate < earliest) earliest = t.startDate;
    });
    return earliest;
  }, [filteredTasks]);

  const totalDays = 55; // Horizon de visualisation de ~2 mois

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
    <div className="space-y-4">
      {/* Barre de contrôle du Gantt */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0066FF] dark:text-cyan-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Diagramme de Gantt interactif
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Phases hiérarchiques, durées et liens de dépendances sans boucles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setZoomLevel('day')}
              className={`px-3 py-1 rounded-lg transition ${
                zoomLevel === 'day' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Jour
            </button>
            <button
              onClick={() => setZoomLevel('week')}
              className={`px-3 py-1 rounded-lg transition ${
                zoomLevel === 'week' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semaine
            </button>
          </div>

          {/* Dépendance */}
          <button
            data-testid="btn-add-dep-modal"
            onClick={() => setShowAddDepModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Lier des tâches</span>
          </button>

          {/* Nouvelle phase */}
          <button
            onClick={() => setShowNewPhaseModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0066FF] hover:bg-blue-700 rounded-xl shadow-md transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle phase</span>
          </button>
        </div>
      </div>

      {/* Conteneur principal du Gantt avec défilement synchronisé */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex">
          {/* Colonne de gauche fixe : Arborescence des phases et tâches */}
          <div className="w-80 sm:w-96 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 select-none">
            {/* En-tête gauche */}
            <div className="h-12 px-4 flex items-center font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              Phases & Tâches
            </div>

            {/* Lignes de l'arborescence */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {phases.map(phase => {
                const phaseTasks = filteredTasks.filter(t => t.phaseId === phase.id);
                const isExpanded = expandedPhases[phase.id] ?? true;
                const completedTasks = phaseTasks.filter(t => t.status === 'done').length;
                const phaseProgress = phaseTasks.length > 0 ? Math.round((completedTasks / phaseTasks.length) * 100) : 0;

                return (
                  <div key={phase.id}>
                    {/* Ligne de Phase */}
                    <div className="h-10 px-3 flex items-center justify-between bg-slate-100/70 dark:bg-slate-800/50 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => togglePhaseExpand(phase.id)}
                          className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => onOpenIconPicker && onOpenIconPicker(phase.id)}
                          title="Modifier l'icône de la phase"
                          className="text-[#0066FF] dark:text-cyan-400 hover:scale-110 transition"
                        >
                          {renderSentinelIcon(phase.iconKey || 'layers', 'w-4 h-4')}
                        </button>
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {phase.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {phaseProgress}%
                      </span>
                    </div>

                    {/* Tâches sous la phase */}
                    {isExpanded && (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                        {phaseTasks.length === 0 ? (
                          <div className="h-8 pl-10 pr-3 flex items-center text-[11px] text-slate-400 italic">
                            Aucune tâche rattachée
                          </div>
                        ) : (
                          phaseTasks.map(task => {
                            const assignee = users.find(u => u.id === task.assigneeId);
                            return (
                              <div
                                key={task.id}
                                onClick={() => onOpenTaskModal(task)}
                                className="h-10 pl-8 pr-3 flex items-center justify-between hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer transition text-xs group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-2 h-2 rounded-full ${
                                    task.status === 'done' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'
                                  }`} />
                                  <span className="text-slate-800 dark:text-slate-200 group-hover:text-[#0066FF] dark:group-hover:text-cyan-400 font-medium truncate">
                                    {task.title}
                                  </span>
                                </div>
                                {assignee && (
                                  <img
                                    src={assignee.avatar}
                                    alt={assignee.name}
                                    title={assignee.name}
                                    className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                                  />
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
          <div className="flex-1 overflow-x-auto min-w-[700px] relative select-none">
            {/* Axe des jours */}
            <div className="h-12 border-b border-slate-200 dark:border-slate-800 flex bg-slate-50/80 dark:bg-slate-900/80">
              {calendarDays.map(day => (
                <div
                  key={day.dateStr}
                  style={{ width: `${dayWidthPx}px` }}
                  className={`flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-800 text-[10px] ${
                    day.isToday
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-[#0066FF] dark:text-cyan-400 font-bold'
                      : day.isWeekend
                      ? 'bg-slate-100/40 dark:bg-slate-800/20 text-slate-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title={day.dateStr}
                >
                  <span>{day.dayNumber}</span>
                </div>
              ))}
            </div>

            {/* Lignes horizontales pour phases et tâches */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 relative">
              {phases.map(phase => {
                const phaseTasks = filteredTasks.filter(t => t.phaseId === phase.id);
                const isExpanded = expandedPhases[phase.id] ?? true;

                // Calcul position de la phase
                const phaseStartDiff = daysBetweenDates(ganttStartDate, phase.startDate || ganttStartDate) - 1;
                const phaseDuration = daysBetweenDates(phase.startDate || ganttStartDate, phase.endDate || phase.startDate || ganttStartDate);

                return (
                  <div key={phase.id}>
                    {/* Barre de Phase */}
                    <div className="h-10 relative flex items-center bg-slate-100/40 dark:bg-slate-800/30">
                      <div
                        style={{
                          left: `${Math.max(0, phaseStartDiff) * dayWidthPx}px`,
                          width: `${Math.max(1, phaseDuration) * dayWidthPx}px`,
                        }}
                        className="absolute h-4 rounded-md bg-slate-400 dark:bg-slate-600 opacity-70"
                        title={`Phase : ${phase.name}`}
                      />
                    </div>

                    {/* Barres des tâches */}
                    {isExpanded && phaseTasks.map(task => {
                      const taskStart = task.startDate || ganttStartDate;
                      const taskEnd = task.dueDate || taskStart;
                      const startOffset = Math.max(0, daysBetweenDates(ganttStartDate, taskStart) - 1);
                      const duration = Math.max(1, daysBetweenDates(taskStart, taskEnd));
                      const isDone = task.status === 'done';

                      return (
                        <div key={task.id} className="h-10 relative flex items-center">
                          <div
                            onClick={() => onOpenTaskModal(task)}
                            style={{
                              left: `${startOffset * dayWidthPx}px`,
                              width: `${duration * dayWidthPx}px`,
                            }}
                            className={`absolute h-6 rounded-lg px-2 flex items-center shadow-sm cursor-pointer transition-all hover:scale-[1.02] ${
                              isDone
                                ? 'bg-emerald-500 text-white'
                                : task.status === 'in_progress'
                                ? 'bg-[#0066FF] text-white'
                                : 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white'
                            }`}
                            title={`${task.title} (${taskStart} -> ${taskEnd})`}
                          >
                            <span className="text-[10px] font-semibold truncate">
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
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-[#0066FF]" />
              Liaisons de dépendances Fin → Début enregistrées
            </h4>
            <div className="flex flex-wrap gap-2">
              {dependencies.map(dep => {
                const pred = filteredTasks.find(t => t.id === dep.predecessorTaskId);
                const succ = filteredTasks.find(t => t.id === dep.successorTaskId);
                if (!pred || !succ) return null;
                return (
                  <div
                    key={dep.id}
                    className="flex items-center gap-2 px-2.5 py-1 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                      {pred.title}
                    </span>
                    <ArrowRight className="w-3 h-3 text-[#0066FF]" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                      {succ.title}
                    </span>
                    <button
                      onClick={() => deleteDependency(dep.id)}
                      className="text-slate-400 hover:text-rose-500 ml-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ajouter une dépendance Fin → Début
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                La tâche suivante ne pourra débuter qu’après achèvement de la précédente.
              </p>
            </div>

            {depError && (
              <div 
                data-testid="dep-error-message"
                className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl"
              >
                {depError}
              </div>
            )}

            <form onSubmit={handleAddDependency} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Tâche précédente (Prédécesseur)
                </label>
                <select
                  data-testid="select-pred-task"
                  value={predTaskId}
                  onChange={(e) => setPredTaskId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">Sélectionner une tâche...</option>
                  {filteredTasks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Tâche suivante (Successeur)
                </label>
                <select
                  data-testid="select-succ-task"
                  value={succTaskId}
                  onChange={(e) => setSuccTaskId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">Sélectionner une tâche...</option>
                  {filteredTasks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDepModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  data-testid="btn-submit-dep"
                  className="px-4 py-1.5 font-semibold text-white bg-[#0066FF] hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Valider la liaison
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nouvelle Phase */}
      {showNewPhaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ajouter une phase de projet
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Organisez vos livrables par étapes chronologiques.
              </p>
            </div>

            <form onSubmit={handleCreatePhase} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nom de la phase
                </label>
                <input
                  type="text"
                  required
                  value={newPhaseName}
                  onChange={(e) => setNewPhaseName(e.target.value)}
                  placeholder="Ex: Analyse & Spécifications..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newPhaseDesc}
                  onChange={(e) => setNewPhaseDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={newPhaseStart}
                    onChange={(e) => setNewPhaseStart(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={newPhaseEnd}
                    onChange={(e) => setNewPhaseEnd(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewPhaseModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-[#0066FF] hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Créer la phase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
