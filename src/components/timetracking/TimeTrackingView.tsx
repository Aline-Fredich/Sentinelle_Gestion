'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Play, Square, Plus, Trash2
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { getTodayDateString } from '@/lib/dateUtils';

// Jours de la semaine de référence
const WEEK_DAYS = [
  { label: 'Lun', date: '2026-10-06' },
  { label: 'Mar', date: '2026-10-07' },
  { label: 'Mer', date: '2026-10-08' },
  { label: 'Jeu', date: '2026-10-09' },
  { label: 'Ven', date: '2026-10-10' },
  { label: 'Sam', date: '2026-10-11' },
  { label: 'Dim', date: '2026-10-12' },
];

export function TimeTrackingView() {
  const { 
    activeProjectId, tasks, users,
    timeEntries, activeTimer, startTimer, stopTimer, addTimeEntry, deleteTimeEntry,
    currentUser
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
    <div className="space-y-6">
      {/* En-tête du module Suivi du Temps */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#0066FF] shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Suivi du Temps & Feuilles de Temps
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chronométrez vos travaux en direct ou déclarez vos heures pour mesurer la charge réelle
            </p>
          </div>
        </div>
      </div>

      {/* Carte du Chronomètre Interactif en Direct */}
      <div className="p-6 bg-gradient-to-r from-blue-900/10 via-slate-900/5 to-slate-900/10 dark:from-blue-950/40 dark:to-slate-900 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-ping" />
              Chronomètre en Direct
            </span>
            <div className="text-4xl font-mono font-black text-slate-900 dark:text-white tracking-widest">
              {formatTimerClock(timerSeconds)}
            </div>
            <p className="text-xs text-slate-500">
              {activeTimer 
                ? `Enregistrement en cours : ${activeTimer.description}` 
                : 'Prêt à décompter le temps pour la tâche active'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTimer ? (
              <button
                onClick={stopTimer}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF1E27] hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Arrêter et enregistrer</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const targetProj = activeProjectId === 'all' ? 'proj-1' : activeProjectId;
                  startTimer(targetProj, undefined, 'Session de travail');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Démarrer le chronomètre</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Volume d'Heures Passé</span>
          <div className="mt-2 text-2xl font-black text-[#0066FF]">
            {totalHours} h
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{totalMinutes} minutes cumulées</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Coût Main d'Œuvre Valorisé</span>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {Math.round(totalValorizedCost).toLocaleString('fr-FR')} €
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Taux moyen calculé à 75 € / heure</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sessions Enregistrées</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {projectTimeEntries.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Feuilles de temps validées</span>
        </div>
      </div>

      {/* Saisie Manuelle & Répartition par Membre */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Colonne gauche : Formulaire d'ajout manuel rapide */}
        <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#0066FF]" />
            Déclarer des heures manuellement
          </h3>

          <form onSubmit={handleManualAdd} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Tâche concernée (optionnel)
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">Sélectionner une tâche...</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Description de l'activité
              </label>
              <input
                type="text"
                required
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="Ex : Révision de code, réunion de sprint..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Nombre d'heures
                </label>
                <input
                  type="number"
                  step="0.25"
                  required
                  value={manualDurationHours}
                  onChange={(e) => setManualDurationHours(e.target.value)}
                  placeholder="Ex : 2.5"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#0066FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Ajouter à ma feuille de temps
            </button>
          </form>

          {/* Répartition par membre */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Temps cumulé par membre
            </h4>
            {memberBreakdown.map((m, idx) => {
              const h = (m.minutes / 60).toFixed(1);
              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.avatar} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{m.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{h} h</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Colonne droite : Onglets Feuille de Temps Hebdo & Sessions */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('timesheet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'timesheet'
                    ? 'bg-[#0066FF] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Feuille de Temps Hebdomadaire
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'sessions'
                    ? 'bg-[#0066FF] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Journal des Sessions ({projectTimeEntries.length})
              </button>
            </div>

            <span className="text-xs font-semibold text-slate-500">
              Semaine du 6 au 12 Octobre
            </span>
          </div>

          {/* VUE 1 : FEUILLE DE TEMPS HEBDOMADAIRE (MATRICE 7 JOURS) */}
          {activeTab === 'timesheet' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 min-w-[200px]">Tâche / Activité</th>
                    {WEEK_DAYS.map(d => (
                      <th key={d.date} className="py-3 px-3 text-center w-16">
                        <div>{d.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{d.date.slice(8)}/10</div>
                      </th>
                    ))}
                    <th className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white w-20">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {weeklyGridData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Aucune heure enregistrée pour cette semaine.
                      </td>
                    </tr>
                  ) : (
                    weeklyGridData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {row.title}
                        </td>
                        {WEEK_DAYS.map(d => {
                          const val = row.hoursByDay[d.date] || 0;
                          return (
                            <td key={d.date} className="py-3 px-3 text-center">
                              {val > 0 ? (
                                <span className="font-mono font-bold text-[#0066FF] bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                                  {val}h
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/40">
                          {row.total.toFixed(1)}h
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {weeklyGridData.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 font-bold text-xs">
                      <td className="py-3 px-4 text-slate-900 dark:text-white">
                        Total Heures Déclarées
                      </td>
                      {WEEK_DAYS.map(d => (
                        <td key={d.date} className="py-3 px-3 text-center font-mono text-[#0066FF]">
                          {(dailyTotals[d.date] || 0).toFixed(1)}h
                        </td>
                      ))}
                      <td className="py-3 px-4 text-center font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
                        {totalHours}h
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : (
            /* VUE 2 : JOURNAL DÉTAILLÉ DES SESSIONS */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Collaborateur</th>
                    <th className="py-3 px-4">Activité & Tâche</th>
                    <th className="py-3 px-4 text-center">Durée</th>
                    <th className="py-3 px-4 text-right">Coût</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {projectTimeEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        Aucune session de travail consignée.
                      </td>
                    </tr>
                  ) : (
                    projectTimeEntries.map(entry => {
                      const hours = (entry.durationMinutes / 60).toFixed(1);
                      const cost = Math.round((entry.durationMinutes / 60) * (entry.hourlyRate || 75));
                      return (
                        <tr key={entry.id} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 text-xs text-slate-500">{entry.date}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white text-xs">
                            {entry.userName}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <span className="font-medium text-slate-800 dark:text-slate-200 block">
                              {entry.description}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-[#0066FF]">
                            {hours} h
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                            {cost} €
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => deleteTimeEntry(entry.id)}
                              className="p-1.5 text-slate-400 hover:text-[#FF1E27] rounded-lg transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
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
