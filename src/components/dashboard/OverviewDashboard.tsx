'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, ArrowUpRight, 
  Calendar, CheckSquare, Users, BarChart3, Plus, 
  TrendingUp, Shield, Layers, Eye, ChevronRight, Activity, Filter
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { Task, TaskStatus } from '@/types/sentinel';
import { formatDayMonthFrench, formatRelativeTimeFrench, isDateOverdue } from '@/lib/dateUtils';
import confetti from 'canvas-confetti';
import { OnboardingBanner } from '@/components/onboarding/OnboardingBanner';

interface OverviewDashboardProps {
  onOpenTaskModal: (task?: Task, defaultStatus?: TaskStatus) => void;
}

export function OverviewDashboard({ onOpenTaskModal }: OverviewDashboardProps) {
  const { 
    metrics, filteredTasks, moveTaskStatus, 
    workload, priorityDistribution, activities, users, projects,
    currentUser, historicalStats, projectsProgressList, statusBreakdown,
    activeProjectId, setActiveProjectId, setActiveView
  } = useSentinel();

  const [activeTab, setActiveTab] = useState<'watch' | 'activity' | 'upcoming'>('watch');

  // Prénom de l'utilisateur
  const firstName = currentUser.name.split(' ')[0] || 'Responsable';

  // Tâches à surveiller (Section 7.4) : En retard ou Urgentes
  const watchTasks = filteredTasks.filter(t => {
    return t.status !== 'done' && (isDateOverdue(t.dueDate, t.status) || t.priority === 'urgent' || t.priority === 'high');
  }).slice(0, 8);

  // Prochaines échéances des 7 jours
  const upcoming7DaysTasks = filteredTasks.filter(t => {
    return t.status !== 'done' && Boolean(t.dueDate);
  }).slice(0, 6);

  const handleToggleTaskDone = (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    moveTaskStatus(task.id, nextStatus);
    if (nextStatus === 'done') {
      try {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
      } catch {
        // Fallback
      }
    }
  };

  return (
    <div className="space-y-7">
      <OnboardingBanner />

      {/* 7.1 En-tête personnalisé et contextuel */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0066FF] dark:text-blue-400 mb-1 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
            Tableau de bord de pilotage • SENTINEL GESTION
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Voici la synthèse opérationnelle de vos projets et les priorités méritant votre attention.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={activeProjectId}
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
          >
            <option value="all">Périmètre : Tous les projets</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => onOpenTaskModal(undefined, 'todo')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-blue-600 active:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle tâche</span>
          </button>
        </div>
      </div>

      {/* 7.2 Cartes de synthèse (6 indicateurs vérifiés) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Projets Actifs */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#E4E7EC] dark:border-slate-800 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-xs font-semibold text-[#667085] dark:text-slate-400">
            <span>Projets actifs</span>
            <Layers className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#202733] dark:text-white">
            {metrics.activeProjectsCount}
          </div>
          <div className="mt-1 text-[11px] text-[#667085]">
            sur {projects.length} projet(s) au total
          </div>
        </div>

        {/* 2. Tâches ouvertes */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#E4E7EC] dark:border-slate-800 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-xs font-semibold text-[#667085] dark:text-slate-400">
            <span>Tâches ouvertes</span>
            <Clock className="w-3.5 h-3.5 text-[#0066FF]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#202733] dark:text-white">
            {metrics.openTasksCount}
          </div>
          <div className="mt-1 text-xs text-[#0066FF] dark:text-cyan-400 font-medium">
            {metrics.inProgress} en cours d’exécution
          </div>
        </div>

        {/* 3. Tâches terminées */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#E4E7EC] dark:border-slate-800 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-xs font-semibold text-[#667085] dark:text-slate-400">
            <span>Terminées</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#23845B] dark:text-emerald-400">
            {metrics.completed}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Livrables validés
          </div>
        </div>

        {/* 4. Tâches en retard */}
        <div className={`p-4 rounded-xl bg-white dark:bg-slate-900 border shadow-sm transition ${
          metrics.overdue > 0 ? 'border-rose-200 bg-rose-50/20 dark:border-rose-900/50' : 'border-[#E4E7EC] dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold text-[#667085] dark:text-slate-400">
            <span>En retard</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${metrics.overdue > 0 ? 'text-[#C83B42]' : 'text-slate-400'}`} />
          </div>
          <div className={`mt-2 text-2xl font-black ${metrics.overdue > 0 ? 'text-[#C83B42]' : 'text-slate-700 dark:text-slate-300'}`}>
            {metrics.overdue}
          </div>
          <div className="mt-1 text-[11px] text-[#C83B42] font-semibold">
            {metrics.overdue > 0 ? 'Action requise' : 'Aucun retard'}
          </div>
        </div>

        {/* 5. Échéances 7 jours */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#E4E7EC] dark:border-slate-800 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-xs font-semibold text-[#667085] dark:text-slate-400">
            <span>Échéances 7j</span>
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#D69A24]">
            {metrics.upcoming7DaysCount}
          </div>
          <div className="mt-1 text-[11px] text-[#667085]">
            jalons programmés
          </div>
        </div>

        {/* 6. Avancement moyen */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#E4E7EC] dark:border-slate-800 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-xs font-semibold text-[#667085] dark:text-slate-400">
            <span>Avancement moy.</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#3478C8]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#202733] dark:text-white">
            {metrics.averageProjectProgress}%
          </div>
          <div className="mt-1.5 w-full bg-[#EEF1F4] dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#23845B] h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.averageProjectProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 7.3 Graphiques historiques en bâtons et Avancement réel comparé */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique A : Tâches créées vs terminées (bâtons comparatifs) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E7EC] dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-[#202733] dark:text-white">
                Tâches créées vs terminées
              </h2>
              <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider bg-[#F6F7F9] dark:bg-slate-800 px-2 py-0.5 rounded">
                Bâtons récents
              </span>
            </div>
            <p className="text-xs text-[#667085] dark:text-slate-400">
              Évolution du volume de flux de travail sur les 5 derniers jours
            </p>
          </div>

          {/* Histogramme comparatif */}
          <div className="py-6">
            <div className="flex items-end justify-between gap-3 h-36 px-2 border-b border-[#E4E7EC] dark:border-slate-800 pb-2">
              {historicalStats.map((item, idx) => {
                const maxVal = Math.max(...historicalStats.map(s => Math.max(s.created, s.completed, 4)));
                const hCreated = Math.round((item.created / maxVal) * 100);
                const hCompleted = Math.round((item.completed / maxVal) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="flex items-end justify-center gap-1.5 w-full h-28">
                      {/* Bâton Créées */}
                      <div 
                        className="w-3 sm:w-4 bg-[#3478C8] rounded-t-sm hover:brightness-110 transition cursor-pointer relative group"
                        style={{ height: `${Math.max(12, hCreated)}%` }}
                        title={`Créées : ${item.created}`}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] bg-slate-800 text-white px-1 rounded transition pointer-events-none z-10">
                          {item.created}
                        </span>
                      </div>
                      {/* Bâton Terminées */}
                      <div 
                        className="w-3 sm:w-4 bg-[#23845B] rounded-t-sm hover:brightness-110 transition cursor-pointer relative group"
                        style={{ height: `${Math.max(12, hCompleted)}%` }}
                        title={`Terminées : ${item.completed}`}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] bg-slate-800 text-white px-1 rounded transition pointer-events-none z-10">
                          {item.completed}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-[#667085]">{item.period}</span>
                  </div>
                );
              })}
            </div>

            {/* Légende */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs font-medium text-[#667085]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#3478C8]" />
                <span>Tâches créées</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#23845B]" />
                <span>Tâches terminées</span>
              </div>
            </div>
          </div>
        </div>

        {/* Graphique B : Avancement réel comparé des projets actifs */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E7EC] dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-[#202733] dark:text-white">
                Avancement des projets
              </h2>
              <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider bg-[#F6F7F9] dark:bg-slate-800 px-2 py-0.5 rounded">
                Calcul réel
              </span>
            </div>
            <p className="text-xs text-[#667085] dark:text-slate-400">
              Progression calculée sur les tâches validées par projet
            </p>
          </div>

          <div className="space-y-4 my-auto py-2">
            {projectsProgressList.map(({ project, totalTasks, completedTasks, progressPercentage }) => (
              <div key={project.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-[#202733] dark:text-white truncate">
                      {project.name}
                    </span>
                  </div>
                  <span className="font-bold text-[#202733] dark:text-white flex items-center gap-1">
                    {progressPercentage}%
                    <span className="text-[11px] font-normal text-[#667085]">
                      ({completedTasks}/{totalTasks})
                    </span>
                  </span>
                </div>

                <div className="w-full bg-[#EEF1F4] dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 bg-[#23845B]"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setActiveView('project_sheet')}
            className="w-full py-2 text-xs font-semibold text-[#3478C8] hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition flex items-center justify-center gap-1"
          >
            <span>Consulter la fiche projet détaillée</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Graphique C : Répartition des statuts & Priorités */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E7EC] dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-[#202733] dark:text-white">
                Statuts & Priorités des tâches
              </h2>
              <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider bg-[#F6F7F9] dark:bg-slate-800 px-2 py-0.5 rounded">
                Flux actif
              </span>
            </div>
            <p className="text-xs text-[#667085] dark:text-slate-400">
              Distribution dans les 4 colonnes Kanban
            </p>
          </div>

          {/* Grille des statuts */}
          <div className="grid grid-cols-2 gap-2.5 my-3">
            {statusBreakdown.map(col => (
              <div 
                key={col.status} 
                className="p-3 rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-[#F6F7F9]/70 dark:bg-slate-800/40"
              >
                <div className="text-[11px] font-semibold text-[#667085] dark:text-slate-400">
                  {col.label}
                </div>
                <div className="text-xl font-black mt-1" style={{ color: col.color }}>
                  {col.count}
                </div>
              </div>
            ))}
          </div>

          {/* Jauge des priorités urgentes/hautes */}
          <div className="space-y-1 pt-1 border-t border-[#E4E7EC] dark:border-slate-800 text-xs">
            <div className="flex justify-between text-[#667085] font-medium text-[11px]">
              <span>Urgences & Risques critiques</span>
              <span className="font-bold text-[#C83B42]">{priorityDistribution.urgent.count} urgente(s)</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#EEF1F4] dark:bg-slate-800">
              <div style={{ width: `${priorityDistribution.urgent.percentage}%` }} className="bg-[#C83B42]" title="Urgente" />
              <div style={{ width: `${priorityDistribution.high.percentage}%` }} className="bg-[#D69A24]" title="Haute" />
              <div style={{ width: `${priorityDistribution.medium.percentage}%` }} className="bg-[#3478C8]" title="Moyenne" />
              <div style={{ width: `${priorityDistribution.low.percentage}%` }} className="bg-[#667085]" title="Basse" />
            </div>
          </div>
        </div>
      </div>

      {/* 7.4 Tableau « À surveiller » & Activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volet principal : À surveiller (Section 7.4) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E7EC] dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E4E7EC] dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#202733] dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C83B42]" />
                Tâches à surveiller (Retards & Priorités)
              </h2>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Tâches nécessitant une décision, un arbitrage ou une relance
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-[#C83B42] dark:bg-rose-950/40">
              {watchTasks.length} élément(s) critique(s)
            </span>
          </div>

          {watchTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#667085]">
              Aucune tâche critique ou en retard. Tout est sous contrôle ! ✨
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E4E7EC] dark:border-slate-800 text-[11px] font-semibold text-[#667085] uppercase">
                    <th className="py-2.5 pr-3">Tâche</th>
                    <th className="py-2.5 px-3">Responsable</th>
                    <th className="py-2.5 px-3">Priorité</th>
                    <th className="py-2.5 px-3">Échéance</th>
                    <th className="py-2.5 px-3">Statut</th>
                    <th className="py-2.5 pl-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC] dark:divide-slate-800">
                  {watchTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    const isLate = isDateOverdue(task.dueDate, task.status);

                    return (
                      <tr key={task.id} className="hover:bg-[#F6F7F9] dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 pr-3 font-semibold text-[#202733] dark:text-white max-w-[220px] truncate">
                          <button 
                            onClick={() => onOpenTaskModal(task)}
                            className="hover:text-[#C83B42] text-left transition"
                          >
                            {task.title}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          {assignee ? (
                            <div className="flex items-center gap-1.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={assignee.avatar} alt={assignee.name} className="w-5 h-5 rounded-full object-cover" />
                              <span className="text-[11px] text-[#667085] truncate max-w-[100px]">{assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Non assigné</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            task.priority === 'urgent'
                              ? 'bg-rose-50 text-[#C83B42] dark:bg-rose-950/50'
                              : task.priority === 'high'
                              ? 'bg-amber-50 text-[#D69A24] dark:bg-amber-950/50'
                              : 'bg-slate-100 text-[#667085] dark:bg-slate-800'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium">
                          {isLate ? (
                            <span className="text-[#C83B42] font-semibold flex items-center gap-1 text-[11px]">
                              <AlertTriangle className="w-3 h-3" />
                              {task.dueDate ? formatDayMonthFrench(task.dueDate) : 'Dépassée'}
                            </span>
                          ) : (
                            <span className="text-[#667085] text-[11px]">
                              {task.dueDate ? formatDayMonthFrench(task.dueDate) : 'Non fixée'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            {task.status === 'in_progress' ? 'En cours' : task.status === 'in_review' ? 'En revue' : 'À faire'}
                          </span>
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <button
                            onClick={() => handleToggleTaskDone(task)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#23845B] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition border border-emerald-200 dark:border-emerald-800"
                          >
                            Valider
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Volet latéral : Activité récente & Charge d'équipe (Section 7.5 & 7.3E) */}
        <div className="space-y-6">
          {/* Activité récente */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E7EC] dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#E4E7EC] dark:border-slate-800 pb-2.5">
              <h2 className="text-sm font-bold text-[#202733] dark:text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#3478C8]" />
                Activité récente
              </h2>
              <span className="text-[10px] text-[#667085]">Traçabilité</span>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {activities.slice(0, 5).map(act => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={act.userAvatar} alt={act.userName} className="w-6 h-6 rounded-full object-cover mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#202733] dark:text-slate-200 leading-snug">
                      <span className="font-semibold text-slate-900 dark:text-white">{act.userName}</span>{' '}
                      {act.description}
                    </p>
                    <span className="text-[10px] text-[#667085]">{formatRelativeTimeFrench(act.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charge de l'équipe (35h contractuelle) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E7EC] dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#E4E7EC] dark:border-slate-800 pb-2.5">
              <h2 className="text-sm font-bold text-[#202733] dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#C83B42]" />
                Charge de l’équipe (35h)
              </h2>
              <button 
                onClick={() => setActiveView('team')}
                className="text-[11px] font-medium text-[#3478C8] hover:underline"
              >
                Détail
              </button>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {workload.slice(0, 4).map(item => (
                <div key={item.user.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#202733] dark:text-slate-200 truncate">
                      {item.user.name}
                    </span>
                    <span className={`text-[11px] font-bold ${item.isOverloaded ? 'text-[#C83B42]' : 'text-[#667085]'}`}>
                      {item.loadPercentage}% ({Math.round(item.totalMinutes / 60)}h)
                    </span>
                  </div>
                  <div className="w-full bg-[#EEF1F4] dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.isOverloaded ? 'bg-[#C83B42]' : item.loadPercentage > 75 ? 'bg-[#D69A24]' : 'bg-[#23845B]'
                      }`}
                      style={{ width: `${Math.min(100, item.loadPercentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
