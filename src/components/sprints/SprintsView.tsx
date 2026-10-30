'use client';

import React, { useState, useMemo } from 'react';
import { 
  Zap, Calendar, Plus, Flame, X
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* En-tête du module Sprints */}
      <div className="panel flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] border border-red bg-red/10 flex items-center justify-center text-red">
            <Zap className="w-5 h-5 text-red" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red shadow-[var(--glow-sm)]" />
              <h1 className="text-base font-bold text-white uppercase tracking-wider">
                GESTION DES SPRINTS & MÉTHODOLOGIE AGILE
              </h1>
            </div>
            <p className="text-xs text-white/45 mt-0.5">
              Planifiez vos cycles itératifs (Scrum), suivez le burndown et gérez le backlog
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSprintId}
            onChange={(e) => setSelectedSprintId(e.target.value)}
            className="form-select uppercase font-bold text-xs w-auto py-1.5"
          >
            {sprints.map(s => (
              <option key={s.id} value={s.id}>
                {s.name.toUpperCase()} ({s.status === 'active' ? 'EN COURS' : s.status === 'completed' ? 'CLÔTURÉ' : 'À VENIR'})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowNewSprintModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>NOUVEAU SPRINT</span>
          </button>
        </div>
      </div>

      {activeSprint && (
        <>
          {/* Fiche d'avancement du Sprint Actif */}
          <div className="panel space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={activeSprint.status === 'active' ? 'badge badge--ok text-[10px]' : 'badge text-[10px]'}>
                    {activeSprint.status === 'active' ? 'SPRINT ACTIF' : activeSprint.status === 'completed' ? 'CLÔTURÉ' : 'PLANIFIÉ'}
                  </span>
                  <span className="text-micro font-mono text-white/45 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-red" />
                    DU {activeSprint.startDate} AU {activeSprint.endDate}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide mt-1">
                  {activeSprint.name}
                </h3>
                <p className="text-xs text-white/70 mt-1">
                  🎯 <strong>OBJECTIF :</strong> {activeSprint.goal}
                </p>
              </div>

              <div className="flex items-center gap-5">
                <div className="text-right">
                  <span className="kpi-label">Story Points</span>
                  <div className="text-lg font-mono font-bold text-white">
                    {completedSprintPoints} / {totalSprintPoints} SP
                  </div>
                  <span className="kpi-delta font-mono">{remainingSprintPoints} SP restants</span>
                </div>

                <div className="text-right border-l border-[#242424] pl-4">
                  <span className="kpi-label">Tâches Réalisées</span>
                  <div className="text-lg font-mono font-bold text-white">
                    {completedCount} / {totalCount}
                  </div>
                  <span className="kpi-delta font-mono">{sprintProgress}% accompli</span>
                </div>

                {activeSprint.status === 'future' && (
                  <button
                    onClick={() => updateSprintStatus(activeSprint.id, 'active')}
                    className="btn btn-primary btn-sm"
                  >
                    DÉMARRER LE SPRINT
                  </button>
                )}
                {activeSprint.status === 'active' && (
                  <button
                    onClick={() => updateSprintStatus(activeSprint.id, 'completed')}
                    className="btn btn-secondary btn-sm"
                  >
                    TERMINER LE SPRINT
                  </button>
                )}
              </div>
            </div>

            {/* Progression des Story Points */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-micro font-mono text-white/70 uppercase">
                <span>Progression de l'effort</span>
                <span>{totalSprintPoints > 0 ? Math.round((completedSprintPoints / totalSprintPoints) * 100) : 0}%</span>
              </div>
              <div className="progress">
                <span style={{ width: `${totalSprintPoints > 0 ? Math.round((completedSprintPoints / totalSprintPoints) * 100) : 0}%` }} />
              </div>
            </div>
          </div>

          {/* Graphique Courbe Burndown (Règle 10 : Rouge, Blanc, Pointillé) */}
          <div className="panel space-y-4">
            <div className="flex items-center justify-between border-b border-[#242424] pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red" />
                <h4 className="panel-title mb-0">
                  COURBE BURNDOWN DU SPRINT (IDÉAL VS RÉALISÉ)
                </h4>
              </div>
              <div className="flex items-center gap-4 text-micro font-mono uppercase">
                <div className="flex items-center gap-1.5 text-white/45">
                  <span className="w-3 h-0.5 border-t border-dashed border-white" />
                  <span>Trajectoire idéale</span>
                </div>
                <div className="flex items-center gap-1.5 text-red font-bold">
                  <span className="w-3 h-1 bg-red rounded-full" />
                  <span>Effort réel restant</span>
                </div>
              </div>
            </div>

            {/* Tracé SVG Responsive Conforme Section 10 */}
            <div className="h-44 w-full bg-black rounded-[4px] p-3 border border-[#242424]">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 120">
                {/* Grille : pointillés rgba(255,255,255,0.08) */}
                <line x1="40" y1="20" x2="580" y2="20" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <line x1="40" y1="60" x2="580" y2="60" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <line x1="40" y1="100" x2="580" y2="100" stroke="#242424" strokeWidth="1" />

                {/* Axe Y : Labels mono blanc 45% */}
                <text x="10" y="24" fontSize="10" fill="rgba(255,255,255,0.45)" fontFamily="var(--font-mono)">{totalSprintPoints} SP</text>
                <text x="10" y="64" fontSize="10" fill="rgba(255,255,255,0.45)" fontFamily="var(--font-mono)">{Math.round(totalSprintPoints / 2)} SP</text>
                <text x="15" y="104" fontSize="10" fill="rgba(255,255,255,0.45)" fontFamily="var(--font-mono)">0 SP</text>

                {/* 2e Série : Trajectoire idéale en blanc pointillé */}
                <line x1="40" y1="20" x2="580" y2="100" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4 4" />

                {/* Courbe principale : Couleur primaire du thème avec halo drop-shadow */}
                {burndownPoints.some(p => p.actualY !== null) && (
                  <polyline
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="drop-shadow(0 0 6px var(--color-primary))"
                    points={burndownPoints
                      .filter(p => p.actualY !== null)
                      .map(p => `${p.x},${p.actualY}`)
                      .join(' ')}
                  />
                )}

                {/* Points pleins couleur primaire 4px */}
                {burndownPoints
                  .filter(p => p.actualPoints !== null && p.actualY !== null)
                  .map((pt, idx) => (
                    <g key={idx}>
                      <circle cx={pt.x} cy={pt.actualY!} r="4" fill="var(--color-primary)" stroke="#FFFFFF" strokeWidth="1.5" />
                      <text x={pt.x - 10} y={pt.actualY! - 9} fontSize="9" fontWeight="bold" fill="var(--color-primary)" fontFamily="var(--font-mono)">{pt.actualPoints} SP</text>
                    </g>
                  ))}

                {/* Axe X : Labels jours dynamiques */}
                {burndownPoints.map((pt, idx) => (
                  <text key={idx} x={pt.x} y="118" fontSize="10" fill="rgba(255,255,255,0.45)" fontFamily="var(--font-mono)" textAnchor="middle">
                    {pt.dayLabel}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Tableaux des tâches du sprint & Backlog */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Colonne gauche (2 tiers) : Tâches incluses dans le sprint */}
            <div className="lg:col-span-2 panel space-y-4">
              <h4 className="panel-title mb-0">
                TÂCHES ENGAGÉES DANS CE SPRINT ({sprintTasks.length})
              </h4>

              <div className="divide-y divide-[#242424]">
                {sprintTasks.length === 0 ? (
                  <div className="table-empty">
                    Aucune tâche n'a encore été ajoutée à ce sprint.
                  </div>
                ) : (
                  sprintTasks.map(t => (
                    <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <select
                          value={t.status}
                          onChange={(e) => moveTaskStatus(t.id, e.target.value as TaskStatus)}
                          className="form-select py-1 px-2 text-micro w-auto uppercase font-bold"
                        >
                          <option value="todo">À FAIRE</option>
                          <option value="in_progress">EN COURS</option>
                          <option value="in_review">EN REVUE</option>
                          <option value="done">TERMINÉ</option>
                        </select>
                        <div>
                          <span className={`text-xs font-bold uppercase tracking-wide ${t.status === 'done' ? 'line-through text-white/45' : 'text-white'}`}>
                            {t.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="badge font-mono">
                          {getTaskPoints(t)} SP
                        </span>
                        <span className={t.priority === 'urgent' ? 'badge badge--bad' : 'badge'}>
                          {t.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Colonne droite (1 tiers) : Backlog & Ajout au sprint */}
            <div className="panel space-y-4">
              <div className="border-b border-[#242424] pb-3">
                <h4 className="panel-title mb-0">
                  BACKLOG PRODUIT ({backlogTasks.length})
                </h4>
                <p className="text-micro text-white/45 mt-0.5">Tâches en attente d'affectation</p>
              </div>

              <div className="divide-y divide-[#242424] max-h-96 overflow-y-auto pr-1">
                {backlogTasks.length === 0 ? (
                  <div className="table-empty py-8">
                    Le backlog est vide !
                  </div>
                ) : (
                  backlogTasks.map(t => (
                    <div key={t.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white uppercase truncate">
                            {t.title}
                          </span>
                          <span className="tag-mono text-[10px]">
                            {getTaskPoints(t)} SP
                          </span>
                        </div>
                        <span className="text-micro font-mono text-white/45">ÉCHÉANCE : {t.dueDate || 'N/A'}</span>
                      </div>
                      <button
                        onClick={() => addTasksToSprint(activeSprint.id, [t.id])}
                        className="btn btn-secondary btn-sm"
                        title="Ajouter à ce sprint"
                      >
                        + SPRINT
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
        <div className="modal-overlay" onClick={() => setShowNewSprintModal(false)} role="dialog" aria-modal="true">
          <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242424] mb-4">
              <h3 className="modal-title mb-0">
                CRÉER UN NOUVEAU SPRINT
              </h3>
              <button
                onClick={() => setShowNewSprintModal(false)}
                className="btn btn-ghost btn-sm p-1"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            <form onSubmit={handleCreateSprint} className="space-y-4">
              <div className="form-group mb-0">
                <label className="form-label">
                  Nom du Sprint <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  placeholder="Ex : Sprint 3 — Intégrations API"
                  className="form-input"
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">
                  Objectif principal (Sprint Goal)
                </label>
                <textarea
                  rows={2}
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  placeholder="Ex : Livrer la synchronisation des données et la facturation..."
                  className="form-textarea"
                />
              </div>

              <div className="form-row">
                <div className="form-group mb-0">
                  <label className="form-label">
                    Date de début
                  </label>
                  <input
                    type="date"
                    required
                    value={newSprintStart}
                    onChange={(e) => setNewSprintStart(e.target.value)}
                    className="form-input font-mono"
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    required
                    value={newSprintEnd}
                    onChange={(e) => setNewSprintEnd(e.target.value)}
                    className="form-input font-mono"
                  />
                </div>
              </div>

              <div className="modal-actions pt-4 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setShowNewSprintModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  ANNULER
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  CRÉER LE SPRINT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
