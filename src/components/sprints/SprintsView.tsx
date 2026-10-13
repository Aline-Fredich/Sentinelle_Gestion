'use client';

import React, { useState, useMemo } from 'react';
import { 
  Zap, Calendar, Plus, Flame
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { Task, TaskStatus } from '@/types/sentinel';
import { calculateSprintBurndown } from '@/domain/burndown';

// Calcul des Story Points (Suite de Fibonacci)
const taskPointsMap: Record<string, number> = {
  'tsk-101': 5,
  'tsk-102': 8,
  'tsk-103': 3,
  'tsk-104': 5,
  'tsk-105': 8,
  'tsk-106': 2,
  'tsk-107': 3,
};

const getTaskPoints = (t: Task): number => t.storyPoints || taskPointsMap[t.id] || 3;

export function SprintsView() {
  const { 
    sprints, createSprint, updateSprintStatus, addTasksToSprint, 
    tasks, moveTaskStatus, activeProjectId 
  } = useSentinel();

  const [selectedSprintId, setSelectedSprintId] = useState<string>(sprints[0]?.id || '');
  const [showNewSprintModal, setShowNewSprintModal] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [newSprintStart, setNewSprintStart] = useState('');
  const [newSprintEnd, setNewSprintEnd] = useState('');

  const activeSprint = sprints.find(s => s.id === selectedSprintId) || sprints[0];

  // Tâches incluses dans le sprint sélectionné
  const sprintTasks = useMemo(() => {
    if (!activeSprint) return [];
    return tasks.filter(t => activeSprint.taskIds.includes(t.id));
  }, [tasks, activeSprint]);

  // Tâches du backlog (qui ne sont dans aucun sprint actif)
  const backlogTasks = useMemo(() => {
    const allSprintTaskIds = new Set(sprints.flatMap(s => s.taskIds));
    return tasks.filter(t => !allSprintTaskIds.has(t.id));
  }, [tasks, sprints]);

  const completedCount = sprintTasks.filter(t => t.status === 'done').length;
  const totalCount = sprintTasks.length;
  const sprintProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;

    const targetProj = activeProjectId === 'all' ? 'proj-1' : activeProjectId;
    const created = createSprint({
      projectId: targetProj,
      name: newSprintName,
      goal: newSprintGoal,
      startDate: newSprintStart || '2026-05-01',
      endDate: newSprintEnd || '2026-05-15',
      status: 'future',
      taskIds: [],
    });

    setSelectedSprintId(created.id);
    setShowNewSprintModal(false);
    setNewSprintName('');
    setNewSprintGoal('');
  };



  const burndownResult = useMemo(() => {
    if (!activeSprint) {
      return { totalPoints: 0, completedPoints: 0, remainingPoints: 0, points: [] };
    }
    return calculateSprintBurndown(activeSprint, sprintTasks, getTaskPoints);
  }, [activeSprint, sprintTasks]);

  const totalSprintPoints = burndownResult.totalPoints;
  const completedSprintPoints = burndownResult.completedPoints;
  const remainingSprintPoints = burndownResult.remainingPoints;
  const burndownPoints = burndownResult.points;

  return (
    <div className="space-y-6">
      {/* En-tête du module Sprints */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#0066FF] shadow-sm">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Gestion des Sprints & Méthodologie Agile
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Planifiez vos cycles itératifs (Scrum), suivez le burndown et gérez le backlog
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSprintId}
            onChange={(e) => setSelectedSprintId(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0066FF]"
          >
            {sprints.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status === 'active' ? 'En cours' : s.status === 'completed' ? 'Clôturé' : 'À venir'})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowNewSprintModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau sprint</span>
          </button>
        </div>
      </div>

      {activeSprint && (
        <>
          {/* Fiche d'avancement du Sprint Actif */}
          <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                    activeSprint.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : activeSprint.status === 'completed'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {activeSprint.status === 'active' ? 'Sprint Actif' : activeSprint.status === 'completed' ? 'Clôturé' : 'Planifié'}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Du {activeSprint.startDate} au {activeSprint.endDate}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {activeSprint.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  🎯 <strong>Objectif :</strong> {activeSprint.goal}
                </p>
              </div>

              <div className="flex items-center gap-5">
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500">Story Points (Effort)</span>
                  <div className="text-xl font-black text-[#0066FF]">
                    {completedSprintPoints} / {totalSprintPoints} SP
                  </div>
                  <span className="text-[11px] text-slate-400">{remainingSprintPoints} SP restants</span>
                </div>

                <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-4">
                  <span className="text-xs font-semibold text-slate-500">Tâches Réalisées</span>
                  <div className="text-xl font-black text-emerald-600">
                    {completedCount} / {totalCount}
                  </div>
                  <span className="text-[11px] text-slate-400">{sprintProgress}% accompli</span>
                </div>

                {activeSprint.status === 'future' && (
                  <button
                    onClick={() => updateSprintStatus(activeSprint.id, 'active')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    Démarrer le sprint
                  </button>
                )}
                {activeSprint.status === 'active' && (
                  <button
                    onClick={() => updateSprintStatus(activeSprint.id, 'completed')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    Terminer le sprint
                  </button>
                )}
              </div>
            </div>

            {/* Barre de progression des Story Points */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Progression de l'effort (Story Points)</span>
                <span>{totalSprintPoints > 0 ? Math.round((completedSprintPoints / totalSprintPoints) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#0066FF] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalSprintPoints > 0 ? Math.round((completedSprintPoints / totalSprintPoints) * 100) : 0}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Graphique Courbe Burndown (Burndown Chart) */}
          <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#FF1E27]" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Courbe Burndown du Sprint (Idéal vs Réalisé)
                </h4>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-0.5 bg-slate-400 border-t border-dashed" />
                  <span>Trajectoire idéale</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#0066FF]">
                  <span className="w-3 h-1 bg-[#0066FF] rounded-full" />
                  <span>Effort restant réel</span>
                </div>
              </div>
            </div>

            {/* Tracé SVG Responsive de la courbe Burndown */}
            <div className="h-44 w-full bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 120">
                {/* Lignes de repère horizontales */}
                <line x1="40" y1="20" x2="580" y2="20" stroke="#E2E8F0" strokeDasharray="3 3" />
                <line x1="40" y1="60" x2="580" y2="60" stroke="#E2E8F0" strokeDasharray="3 3" />
                <line x1="40" y1="100" x2="580" y2="100" stroke="#94A3B8" strokeWidth="1" />

                {/* Axe Y : Labels */}
                <text x="10" y="24" fontSize="10" fill="#94A3B8" fontWeight="bold">{totalSprintPoints} SP</text>
                <text x="10" y="64" fontSize="10" fill="#94A3B8">{Math.round(totalSprintPoints / 2)} SP</text>
                <text x="15" y="104" fontSize="10" fill="#94A3B8">0 SP</text>

                {/* Ligne Idéale : Diagonale de (40, 20) à (580, 100) */}
                <line x1="40" y1="20" x2="580" y2="100" stroke="#94A3B8" strokeWidth="2" strokeDasharray="5 5" />

                {/* Ligne Réalisée : tracé dynamique réel */}
                {burndownPoints.some(p => p.actualY !== null) && (
                  <polyline
                    fill="none"
                    stroke="#0066FF"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={burndownPoints
                      .filter(p => p.actualY !== null)
                      .map(p => `${p.x},${p.actualY}`)
                      .join(' ')}
                  />
                )}

                {/* Points réels calculés */}
                {burndownPoints
                  .filter(p => p.actualPoints !== null && p.actualY !== null)
                  .map((pt, idx) => (
                    <g key={idx}>
                      <circle cx={pt.x} cy={pt.actualY!} r="5" fill="#FFFFFF" stroke="#0066FF" strokeWidth="3" />
                      <text x={pt.x - 10} y={pt.actualY! - 9} fontSize="9" fontWeight="bold" fill="#0066FF">{pt.actualPoints} SP</text>
                    </g>
                  ))}

                {/* Axe X : Labels jours dynamiques */}
                {burndownPoints.map((pt, idx) => (
                  <text key={idx} x={pt.x} y="118" fontSize="10" fill="#64748B" fontWeight="600" textAnchor="middle">
                    {pt.dayLabel}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Tableaux des tâches du sprint & Backlog */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Colonne gauche (2 tiers) : Tâches incluses dans le sprint */}
            <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tâches engagées dans ce sprint ({sprintTasks.length})
                </h4>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {sprintTasks.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Aucune tâche n'a encore été ajoutée à ce sprint.
                  </div>
                ) : (
                  sprintTasks.map(t => (
                    <div key={t.id} className="p-4 flex items-center justify-between gap-3 hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition">
                      <div className="flex items-center gap-3">
                        <select
                          value={t.status}
                          onChange={(e) => moveTaskStatus(t.id, e.target.value as TaskStatus)}
                          className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border-0"
                        >
                          <option value="todo">À faire</option>
                          <option value="in_progress">En cours</option>
                          <option value="in_review">En revue</option>
                          <option value="done">Terminé</option>
                        </select>
                        <div>
                          <span className={`text-sm font-semibold ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                            {t.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-[#0066FF] border border-blue-200 dark:border-blue-800">
                          {getTaskPoints(t)} SP
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Colonne droite (1 tiers) : Backlog & Ajout au sprint */}
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Backlog Produit ({backlogTasks.length})
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Tâches en attente d'affectation</p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                {backlogTasks.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Le backlog est vide !
                  </div>
                ) : (
                  backlogTasks.map(t => (
                    <div key={t.id} className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                            {t.title}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-blue-600">
                            {getTaskPoints(t)} SP
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">Échéance : {t.dueDate || 'N/A'}</span>
                      </div>
                      <button
                        onClick={() => addTasksToSprint(activeSprint.id, [t.id])}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-[#0066FF] hover:bg-blue-100 transition whitespace-nowrap"
                        title="Ajouter à ce sprint"
                      >
                        + Sprint
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modale de Création de Sprint */}
      {showNewSprintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Créer un nouveau Sprint
            </h3>
            <form onSubmit={handleCreateSprint} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Nom du Sprint
                </label>
                <input
                  type="text"
                  required
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  placeholder="Ex : Sprint 3 — Intégrations API"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Objectif principal (Sprint Goal)
                </label>
                <textarea
                  rows={2}
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  placeholder="Ex : Livrer la synchronisation des données et la facturation..."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    required
                    value={newSprintStart}
                    onChange={(e) => setNewSprintStart(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    required
                    value={newSprintEnd}
                    onChange={(e) => setNewSprintEnd(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewSprintModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-blue-600 rounded-xl shadow-md"
                >
                  Créer le sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
