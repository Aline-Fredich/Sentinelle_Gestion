'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Play, Square, Plus, Trash2
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { getTodayDateString } from '@/lib/dateUtils';
import { formatCurrency } from '@/lib/currencyUtils';

// Jours de la semaine de référence
const WEEK_DAYS = [
  { label: 'LUN', date: '2026-10-06' },
  { label: 'MAR', date: '2026-10-07' },
  { label: 'MER', date: '2026-10-08' },
  { label: 'JEU', date: '2026-10-09' },
  { label: 'VEN', date: '2026-10-10' },
  { label: 'SAM', date: '2026-10-11' },
  { label: 'DIM', date: '2026-10-12' },
];

export function TimeTrackingView() {
  const { 
    activeProjectId, tasks, users,
    timeEntries, activeTimer, startTimer, stopTimer, addTimeEntry, deleteTimeEntry,
    currentUser, workspace
  } = useSentinel();

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [descriptionInput, setDescriptionInput] = useState<string>('');
  const [manualDurationHours, setManualDurationHours] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(getTodayDateString());
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  // Décompte chrono si actif
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTimer) {
      const updateTime = () => {
        const start = new Date(activeTimer.startedAt).getTime();
        setTimerSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
      };
      updateTime();
      interval = setInterval(updateTime, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  const formatTimerClock = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const projectTimeEntries = useMemo(() => {
    return activeProjectId === 'all'
      ? timeEntries
      : timeEntries.filter(t => t.projectId === activeProjectId);
  }, [timeEntries, activeProjectId]);

  const totalMinutes = useMemo(() => {
    return projectTimeEntries.reduce((sum, t) => sum + t.durationMinutes, 0);
  }, [projectTimeEntries]);

  const totalHours = (totalMinutes / 60).toFixed(1);

  const [activeTab, setActiveTab] = useState<'timesheet' | 'sessions'>('timesheet');

  // Calculs de la feuille de temps hebdomadaire
  const weeklyGridData = useMemo(() => {
    const rows: Array<{
      taskId?: string;
      title: string;
      hoursByDay: Record<string, number>;
      total: number;
    }> = [];

    projectTimeEntries.forEach(entry => {
      let row = rows.find(r => r.taskId === entry.taskId && r.title === entry.description);
      if (!row) {
        row = {
          taskId: entry.taskId,
          title: entry.description,
          hoursByDay: {
            '2026-10-06': 0, '2026-10-07': 0, '2026-10-08': 0,
            '2026-10-09': 0, '2026-10-10': 0, '2026-10-11': 0, '2026-10-12': 0,
          },
          total: 0,
        };
        rows.push(row);
      }
      const hrs = entry.durationMinutes / 60;
      if (row.hoursByDay[entry.date] !== undefined) {
        row.hoursByDay[entry.date] += hrs;
      }
      row.total += hrs;
    });

    return rows;
  }, [projectTimeEntries]);

  // Totaux par jour
  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    WEEK_DAYS.forEach(d => {
      totals[d.date] = weeklyGridData.reduce((sum, r) => sum + (r.hoursByDay[d.date] || 0), 0);
    });
    return totals;
  }, [weeklyGridData]);

  const totalValorizedCost = useMemo(() => {
    return projectTimeEntries.reduce((sum, t) => sum + (t.durationMinutes / 60) * (t.hourlyRate || 75), 0);
  }, [projectTimeEntries]);

  // Répartition par membre
  const memberBreakdown = useMemo(() => {
    const map: Record<string, { name: string; minutes: number; avatar: string }> = {};
    projectTimeEntries.forEach(t => {
      if (!map[t.userId]) {
        const userObj = users.find(u => u.id === t.userId);
        map[t.userId] = {
          name: t.userName,
          minutes: 0,
          avatar: userObj?.avatar || '',
        };
      }
      map[t.userId].minutes += t.durationMinutes;
    });
    return Object.values(map);
  }, [projectTimeEntries, users]);

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = parseFloat(manualDurationHours);
    if (isNaN(hrs) || hrs <= 0) return;

    const targetProj = activeProjectId === 'all' ? 'proj-1' : activeProjectId;
    addTimeEntry({
      projectId: targetProj,
      taskId: selectedTaskId || undefined,
      userId: currentUser.id,
      userName: currentUser.name,
      description: descriptionInput || 'Session de travail manuelle',
      durationMinutes: Math.round(hrs * 60),
      date: manualDate,
      hourlyRate: 75,
    });

    setDescriptionInput('');
    setManualDurationHours('');
    setSelectedTaskId('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* En-tête du module Suivi du Temps */}
      <div className="panel flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] border border-red bg-red/10 flex items-center justify-center text-red">
            <Clock className="w-5 h-5 text-red" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red shadow-[var(--glow-sm)]" />
              <h1 className="text-base font-bold text-white uppercase tracking-wider">
                SUIVI DU TEMPS & FEUILLES DE TEMPS
              </h1>
            </div>
            <p className="text-xs text-white/45 mt-0.5">
              Chronométrez vos travaux en direct ou déclarez vos heures pour mesurer la charge réelle
            </p>
          </div>
        </div>
      </div>

      {/* Carte du Chronomètre Interactif en Direct - Bloc Hero */}
      <div className="panel panel--hero">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-micro font-bold uppercase tracking-wider text-red flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-red shadow-[var(--glow-sm)] animate-ping" />
              CHRONOMÈTRE EN DIRECT (CONSOLE TECHNIQUE)
            </span>
            <div className="text-4xl font-mono font-bold text-white tracking-widest">
              {formatTimerClock(timerSeconds)}
            </div>
            <p className="text-xs text-white/45 font-mono">
              {activeTimer 
                ? `Enregistrement en cours : ${activeTimer.description}` 
                : 'Prêt à décompter le temps pour la tâche active'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTimer ? (
              <button
                onClick={stopTimer}
                className="btn btn-danger btn-lg"
              >
                <Square className="w-4 h-4 fill-current text-white" />
                <span>ARRÊTER ET ENREGISTRER</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const targetProj = activeProjectId === 'all' ? 'proj-1' : activeProjectId;
                  startTimer(targetProj, undefined, 'Session de travail');
                }}
                className="btn btn-primary btn-lg"
              >
                <Play className="w-4 h-4 fill-current text-white" />
                <span>DÉMARRER LE CHRONOMÈTRE</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid-auto">
        <div className="panel kpi">
          <div className="kpi-head">
            <span className="kpi-label">Volume d'Heures Passé</span>
            <div className="kpi-icon">
              <Clock className="w-4 h-4 text-red" />
            </div>
          </div>
          <div className="kpi-value font-mono">
            {totalHours} h
          </div>
          <span className="kpi-delta font-mono">{totalMinutes} minutes cumulées</span>
        </div>

        <div className="panel kpi">
          <div className="kpi-head">
            <span className="kpi-label">Coût Main d'Œuvre</span>
            <div className="kpi-icon">
              <Clock className="w-4 h-4 text-red" />
            </div>
          </div>
          <div className="kpi-value font-mono">
            {formatCurrency(totalValorizedCost, workspace.currency || 'FCFA')}
          </div>
          <span className="kpi-delta">Taux calculé à {formatCurrency(workspace.defaultHourlyRate || 15000, workspace.currency || 'FCFA')}/h</span>
        </div>

        <div className="panel kpi">
          <div className="kpi-head">
            <span className="kpi-label">Sessions Enregistrées</span>
            <div className="kpi-icon">
              <Clock className="w-4 h-4 text-red" />
            </div>
          </div>
          <div className="kpi-value font-mono">
            {projectTimeEntries.length}
          </div>
          <span className="kpi-delta">Feuilles de temps validées</span>
        </div>
      </div>

      {/* Saisie Manuelle & Répartition par Membre */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Colonne gauche : Formulaire d'ajout manuel rapide */}
        <div className="panel space-y-4">
          <h3 className="panel-title mb-0">
            <Plus className="w-4 h-4 text-red" />
            DÉCLARER DES HEURES
          </h3>

          <form onSubmit={handleManualAdd} className="space-y-3.5">
            <div className="form-group mb-0">
              <label className="form-label">
                Tâche concernée (optionnel)
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="form-select uppercase font-bold text-xs"
              >
                <option value="">Sélectionner une tâche...</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">
                Description de l'activité
              </label>
              <input
                type="text"
                required
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="Ex : Révision de code, réunion de sprint..."
                className="form-input text-xs"
              />
            </div>

            <div className="form-row">
              <div className="form-group mb-0">
                <label className="form-label">
                  Nombre d'heures
                </label>
                <input
                  type="number"
                  step="0.25"
                  required
                  value={manualDurationHours}
                  onChange={(e) => setManualDurationHours(e.target.value)}
                  placeholder="Ex : 2.5"
                  className="form-input font-mono font-bold text-xs"
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="form-input font-mono text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
            >
              AJOUTER À LA FEUILLE DE TEMPS
            </button>
          </form>

          {/* Répartition par membre */}
          <div className="pt-4 border-t border-[#242424] space-y-3">
            <h4 className="text-micro font-bold text-white/45 uppercase tracking-wider">
              Temps cumulé par membre
            </h4>
            {memberBreakdown.map((m, idx) => {
              const h = (m.minutes / 60).toFixed(1);
              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-[4px] border border-red bg-red/10 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                      {m.name.charAt(0)}
                    </span>
                    <span className="font-bold text-white uppercase">{m.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{h} h</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Colonne droite : Onglets Feuille de Temps Hebdo & Sessions */}
        <div className="lg:col-span-2 panel space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-[#242424] pb-3 gap-2">
            <div className="tabs">
              <button
                onClick={() => setActiveTab('timesheet')}
                aria-selected={activeTab === 'timesheet'}
                className="tab"
              >
                FEUILLE DE TEMPS HEBDOMADAIRE
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                aria-selected={activeTab === 'sessions'}
                className="tab"
              >
                JOURNAL DES SESSIONS ({projectTimeEntries.length})
              </button>
            </div>

            <span className="tag-mono text-white/45">
              SEMAINE DU 6 AU 12 OCTOBRE
            </span>
          </div>

          {/* VUE 1 : FEUILLE DE TEMPS HEBDOMADAIRE */}
          {activeTab === 'timesheet' ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="min-w-[200px] text-left">TÂCHE / ACTIVITÉ</th>
                    {WEEK_DAYS.map(d => (
                      <th key={d.date} className="w-16">
                        <div>{d.label}</div>
                        <div className="text-[9px] text-white/70 font-mono font-normal">{d.date.slice(8)}/10</div>
                      </th>
                    ))}
                    <th className="w-20 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyGridData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="table-empty">
                        Aucune heure enregistrée pour cette semaine.
                      </td>
                    </tr>
                  ) : (
                    weeklyGridData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="font-bold text-white uppercase text-left">
                          {row.title}
                        </td>
                        {WEEK_DAYS.map(d => {
                          const val = row.hoursByDay[d.date] || 0;
                          return (
                            <td key={d.date} className="font-mono text-center">
                              {val > 0 ? (
                                <span className="font-bold text-red">
                                  {val}h
                                </span>
                              ) : (
                                <span className="cell-dim">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="font-mono font-bold text-white text-right">
                          {row.total.toFixed(1)}h
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {weeklyGridData.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-[#242424] font-bold text-xs bg-[#0D0D0D]">
                      <td className="text-white uppercase text-left">
                        Total Heures Déclarées
                      </td>
                      {WEEK_DAYS.map(d => (
                        <td key={d.date} className="text-center font-mono text-red">
                          {(dailyTotals[d.date] || 0).toFixed(1)}h
                        </td>
                      ))}
                      <td className="text-right font-mono font-bold text-white">
                        {totalHours}h
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : (
            /* VUE 2 : JOURNAL DÉTAILLÉ DES SESSIONS */
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>COLLABORATEUR</th>
                    <th>ACTIVITÉ & TÂCHE</th>
                    <th>DURÉE</th>
                    <th>COÛT</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {projectTimeEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-empty">
                        Aucune session de travail consignée.
                      </td>
                    </tr>
                  ) : (
                    projectTimeEntries.map(entry => {
                      const hours = (entry.durationMinutes / 60).toFixed(1);
                      const cost = Math.round((entry.durationMinutes / 60) * (entry.hourlyRate || 75));
                      return (
                        <tr key={entry.id}>
                          <td className="font-mono text-white/70">{entry.date}</td>
                          <td className="font-bold text-white uppercase">
                            {entry.userName}
                          </td>
                          <td className="text-left font-medium text-white/70">
                            {entry.description}
                          </td>
                          <td className="font-mono font-bold text-red">
                            {hours} h
                          </td>
                          <td className="font-mono font-bold text-white text-right">
                            {formatCurrency(cost, workspace.currency || 'FCFA')}
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => deleteTimeEntry(entry.id)}
                              className="btn btn-ghost btn-sm p-1.5 text-white/45 hover:text-red"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
