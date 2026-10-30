'use client';

import React from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, 
  Calendar, CheckSquare, Plus, 
  TrendingUp, Layers, ChevronRight, Activity, FolderPlus
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { Task, TaskStatus } from '@/types/sentinel';
import { formatDayMonthFrench, formatRelativeTimeFrench, isDateOverdue } from '@/lib/dateUtils';
import confetti from 'canvas-confetti';
import { OnboardingBanner } from '@/components/onboarding/OnboardingBanner';
import { Badge } from '@/components/ui/Badge';
import { getPriorityBadgeVariant, getStatusBadgeVariant } from '@/components/ui/badgeTokens';
import { Button } from '@/components/ui/Button';

interface OverviewDashboardProps {
  onOpenTaskModal: (task?: Task, defaultStatus?: TaskStatus) => void;
  onOpenCreateProjectModal?: () => void;
}

export function OverviewDashboard({ onOpenTaskModal, onOpenCreateProjectModal }: OverviewDashboardProps) {
  const { 
    metrics, filteredTasks, moveTaskStatus, 
    workload, priorityDistribution, activities, users, projects,
    currentUser, historicalStats, projectsProgressList, statusBreakdown,
    activeProjectId, setActiveProjectId, setActiveView
  } = useSentinel();

  // Prénom de l'utilisateur
  const firstName = currentUser.name.split(' ')[0] || 'Responsable';

  // Tâches à surveiller : En retard ou Urgentes
  const watchTasks = filteredTasks.filter(t => {
    return t.status !== 'done' && (isDateOverdue(t.dueDate, t.status) || t.priority === 'urgent' || t.priority === 'high');
  }).slice(0, 8);

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
      <div className="panel panel--hero flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[var(--border)] bg-[var(--surface)] p-6 rounded-[var(--r-md)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--brand)] mb-1 uppercase tracking-wider font-mono">
            <span className="w-2 h-2 rounded-full bg-[var(--brand)] shadow-[var(--glow-sm)] animate-pulse" />
            Tableau de bord de pilotage • SENTINEL GESTION
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight font-ui">
            BONJOUR, {firstName.toUpperCase()}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 font-ui">
            Synthèse opérationnelle de vos projets et priorités de la console Sentinelle.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <select
            value={activeProjectId}
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="form-select text-xs font-semibold py-1.5 px-3 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]"
          >
            <option value="all">Périmètre : Tous les projets</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {onOpenCreateProjectModal && (
            <Button
              variant="secondary"
              size="sm"
              data-testid="btn-new-project"
              onClick={onOpenCreateProjectModal}
              icon={<FolderPlus className="w-3.5 h-3.5 text-[var(--brand)]" />}
            >
              Nouveau projet
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            data-testid="btn-new-task"
            onClick={() => onOpenTaskModal(undefined, 'todo')}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Ajouter une tâche
          </Button>
        </div>
      </div>

      {/* 7.2 Cartes de synthèse (6 indicateurs KPI stricts) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Projets Actifs */}
        <div className="panel kpi p-4 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="kpi-head flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Projets actifs</span>
            <div className="w-7 h-7 rounded-[var(--r-xs)] border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--brand)]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text)] font-mono">
            {metrics.activeProjectsCount}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] font-mono mt-1">
            sur {projects.length} total
          </div>
        </div>

        {/* 2. Tâches ouvertes */}
        <div className="panel kpi p-4 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="kpi-head flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Tâches ouvertes</span>
            <div className="w-7 h-7 rounded-[var(--r-xs)] border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--brand)]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text)] font-mono">
            {metrics.openTasksCount}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] font-mono mt-1">
            {metrics.inProgress} en cours
          </div>
        </div>

        {/* 3. Tâches terminées */}
        <div className="panel kpi p-4 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="kpi-head flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Terminées</span>
            <div className="w-7 h-7 rounded-[var(--r-xs)] border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--brand)]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text)] font-mono">
            {metrics.completed}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] font-mono mt-1">
            Livrables validés
          </div>
        </div>

        {/* 4. Tâches en retard */}
        <div className={`panel kpi p-4 rounded-[var(--r-sm)] border bg-[var(--surface)] ${
          metrics.overdue > 0 
            ? 'border-[var(--button-danger-bg)] shadow-[0_0_12px_rgba(255,0,0,0.2)]' 
            : 'border-[var(--border)]'
        }`}>
          <div className="kpi-head flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${metrics.overdue > 0 ? 'text-[var(--button-danger-bg)]' : 'text-[var(--text-muted)]'}`}>
              En retard
            </span>
            <div className={`w-7 h-7 rounded-[var(--r-xs)] border flex items-center justify-center ${
              metrics.overdue > 0 
                ? 'border-[var(--button-danger-bg)]/40 bg-[var(--button-danger-bg)]/15 text-[var(--button-danger-bg)]' 
                : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono ${metrics.overdue > 0 ? 'text-[var(--button-danger-bg)]' : 'text-[var(--text)]'}`}>
            {metrics.overdue}
          </div>
          <div className={`text-[11px] font-mono mt-1 ${metrics.overdue > 0 ? 'text-[var(--button-danger-bg)] font-bold' : 'text-[var(--text-muted)]'}`}>
            {metrics.overdue > 0 ? 'Action requise' : 'Aucun retard'}
          </div>
        </div>

        {/* 5. Échéances 7 jours */}
        <div className="panel kpi p-4 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="kpi-head flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Échéances 7j</span>
            <div className="w-7 h-7 rounded-[var(--r-xs)] border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--brand)]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text)] font-mono">
            {metrics.upcoming7DaysCount}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] font-mono mt-1">
            Jalons cibles
          </div>
        </div>

        {/* 6. Avancement moyen */}
        <div className="panel kpi p-4 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="kpi-head flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Avancement</span>
            <div className="w-7 h-7 rounded-[var(--r-xs)] border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--brand)]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text)] font-mono">
            {metrics.averageProjectProgress}%
          </div>
          <div className="w-full bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden border border-[var(--border)] mt-2">
            <div 
              className="h-full bg-[var(--brand)] transition-all duration-300" 
              style={{ width: `${metrics.averageProjectProgress}%` }} 
            />
          </div>
        </div>
      </div>

      {/* 7.3 Graphiques historiques en bâtons et Avancement réel comparé */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique A : Tâches créées vs terminées */}
        <div className="panel flex flex-col justify-between border border-[var(--border)] bg-[var(--surface)] p-5 rounded-[var(--r-md)]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="panel-title text-sm font-bold text-[var(--text)] uppercase tracking-wider">
                Flux de tâches
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)]">
                5 JOURS
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Volume comparé de flux de travail sur les 5 derniers jours
            </p>
          </div>

          {/* Histogramme comparatif */}
          <div className="py-6">
            <div className="flex items-end justify-between gap-3 h-36 px-2 border-b border-[var(--border)] pb-2">
              {historicalStats.map((item, idx) => {
                const maxVal = Math.max(...historicalStats.map(s => Math.max(s.created, s.completed, 4)));
                const hCreated = Math.round((item.created / maxVal) * 100);
                const hCompleted = Math.round((item.completed / maxVal) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="flex items-end justify-center gap-1.5 w-full h-28">
                      {/* Bâton Créées */}
                      <div 
                        className="w-3 sm:w-4 bg-[var(--brand)] rounded-t-xs hover:brightness-125 transition cursor-pointer relative group shadow-sm"
                        style={{ height: `${Math.max(12, hCreated)}%` }}
                        title={`Créées : ${item.created}`}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-mono bg-[var(--surface-raised)] border border-[var(--brand)] text-[var(--text)] px-1 rounded transition pointer-events-none z-10">
                          {item.created}
                        </span>
                      </div>
                      {/* Bâton Terminées */}
                      <div 
                        className="w-3 sm:w-4 bg-[var(--text)] rounded-t-xs hover:brightness-125 transition cursor-pointer relative group opacity-90"
                        style={{ height: `${Math.max(12, hCompleted)}%` }}
                        title={`Terminées : ${item.completed}`}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-mono bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] px-1 rounded transition pointer-events-none z-10">
                          {item.completed}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-[var(--text-muted)]">{item.period}</span>
                  </div>
                );
              })}
            </div>

            {/* Légende */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs font-mono font-bold uppercase text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[var(--brand)] shadow-xs" />
                <span>Créées</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[var(--text)]" />
                <span>Terminées</span>
              </div>
            </div>
          </div>
        </div>

        {/* Graphique B : Avancement réel comparé des projets actifs */}
        <div className="panel flex flex-col justify-between border border-[var(--border)] bg-[var(--surface)] p-5 rounded-[var(--r-md)]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="panel-title text-sm font-bold text-[var(--text)] uppercase tracking-wider">
                Avancement des projets
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)]">
                CALCUL RÉEL
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Progression calculée sur les tâches validées par projet
            </p>
          </div>

          <div className="space-y-4 my-auto py-2">
            {projectsProgressList.map(({ project, totalTasks, completedTasks, progressPercentage }) => (
              <div key={project.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-[var(--text)] truncate font-ui">
                      {project.name}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[var(--text)] flex items-center gap-1">
                    {progressPercentage}%
                    <span className="text-[11px] font-normal text-[var(--text-muted)]">
                      ({completedTasks}/{totalTasks})
                    </span>
                  </span>
                </div>

                <div className="w-full bg-[var(--surface-2)] border border-[var(--border)] h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--brand)] shadow-xs transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveView('project_sheet')}
            className="w-full text-xs text-[var(--text)] hover:text-[var(--brand)] mt-2"
            iconRight={<ChevronRight className="w-3.5 h-3.5" />}
          >
            Fiche projet détaillée
          </Button>
        </div>

        {/* Graphique C : Répartition des statuts & Priorités */}
        <div className="panel flex flex-col justify-between border border-[var(--border)] bg-[var(--surface)] p-5 rounded-[var(--r-md)]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="panel-title text-sm font-bold text-[var(--text)] uppercase tracking-wider">
                Colonnes Kanban
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)]">
                FLUX ACTIF
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Distribution dans les 4 colonnes de travail
            </p>
          </div>

          {/* Grille des statuts */}
          <div className="grid grid-cols-2 gap-2.5 my-3">
            {statusBreakdown.map(col => (
              <div 
                key={col.status} 
                className="p-3 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)]"
              >
                <div className="text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase">
                  {col.label}
                </div>
                <div className="text-xl font-mono font-bold mt-1 text-[var(--text)]">
                  {col.count}
                </div>
              </div>
            ))}
          </div>

          {/* Jauge des priorités */}
          <div className="space-y-1 pt-2 border-t border-[var(--border)] text-xs">
            <div className="flex justify-between text-[var(--text-muted)] font-mono text-[11px]">
              <span>Urgences critiques</span>
              <span className={`font-bold ${priorityDistribution.urgent.count > 0 ? 'text-[var(--button-danger-bg)]' : 'text-[var(--text)]'}`}>
                {priorityDistribution.urgent.count} URGENTE(S)
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-[var(--surface-2)] border border-[var(--border)]">
              <div style={{ width: `${priorityDistribution.urgent.percentage}%` }} className="bg-[var(--button-danger-bg)]" title="Urgente" />
              <div style={{ width: `${priorityDistribution.high.percentage}%` }} className="bg-[var(--brand)]" title="Haute" />
              <div style={{ width: `${priorityDistribution.medium.percentage}%` }} className="bg-[var(--border-strong)]" title="Moyenne" />
              <div style={{ width: `${priorityDistribution.low.percentage}%` }} className="bg-[var(--border)]" title="Basse" />
            </div>
          </div>
        </div>
      </div>

      {/* 7.4 Tableau « À surveiller » & Activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volet principal : À surveiller */}
        <div className="lg:col-span-2 panel space-y-4 border border-[var(--border)] bg-[var(--surface)] p-5 rounded-[var(--r-md)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="panel-title text-sm flex items-center gap-2 font-bold text-[var(--text)] uppercase tracking-wider">
                <span>Tâches à surveiller en priorité</span>
                <span className="text-xs font-normal text-[var(--text-muted)]">(Retards & Arbitrages)</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Tâches nécessitant un arbitrage ou une action prioritaire
              </p>
            </div>
            <Badge variant={watchTasks.length > 0 ? 'danger' : 'success'} size="sm">
              {watchTasks.length} CRITIQUE(S)
            </Badge>
          </div>

          {watchTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)] font-mono">
              Aucune tâche critique ou en retard. Tout est sous contrôle.
            </div>
          ) : (
            <div className="table-wrap border border-[var(--border)] rounded-[var(--r-sm)]">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th scope="col">TÂCHE</th>
                    <th scope="col">RESPONSABLE</th>
                    <th scope="col">PRIORITÉ</th>
                    <th scope="col">ÉCHÉANCE</th>
                    <th scope="col">STATUT</th>
                    <th scope="col">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {watchTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    const isLate = isDateOverdue(task.dueDate, task.status);

                    return (
                      <tr key={task.id}>
                        <td className="max-w-[220px] truncate text-left">
                          <button 
                            onClick={() => onOpenTaskModal(task)}
                            className="hover:text-[var(--brand)] text-left transition font-semibold text-[var(--text)] truncate block max-w-full"
                          >
                            {task.title}
                          </button>
                        </td>
                        <td>
                          {assignee ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="w-5 h-5 rounded-[var(--r-xs)] border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center text-[9px] font-mono font-bold text-[var(--brand)]">
                                {assignee.name.substring(0, 2).toUpperCase()}
                              </span>
                              <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[100px]">{assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)] font-mono">Non assigné</span>
                          )}
                        </td>
                        <td>
                          <Badge variant={getPriorityBadgeVariant(task.priority)} size="xs">
                            {task.priority.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="font-mono text-center">
                          {isLate ? (
                            <span className="text-[var(--button-danger-bg)] flex items-center justify-center gap-1 text-[11px] font-bold">
                              <AlertTriangle className="w-3 h-3 text-[var(--button-danger-bg)]" />
                              {task.dueDate ? formatDayMonthFrench(task.dueDate) : 'DÉPASSÉE'}
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)] text-[11px]">
                              {task.dueDate ? formatDayMonthFrench(task.dueDate) : '—'}
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          <Badge variant={getStatusBadgeVariant(task.status)} size="xs">
                            {task.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => handleToggleTaskDone(task)}
                          >
                            Valider
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Volet latéral : Activité récente & Charge d'équipe */}
        <div className="space-y-6">
          {/* Activité récente */}
          <div className="panel space-y-3 border border-[var(--border)] bg-[var(--surface)] p-5 rounded-[var(--r-md)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <h2 className="panel-title text-sm font-bold text-[var(--text)] uppercase tracking-wider">
                Journal d'activité
              </h2>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)]">
                DIRECT
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {activities.slice(0, 5).map(act => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs py-1 border-b border-[var(--border)] last:border-b-0">
                  <span className="w-2 h-2 rounded-full bg-[var(--brand)] mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text)] leading-snug">
                      <span className="font-semibold text-[var(--text)]">{act.userName}</span>{' '}
                      <span className="text-[var(--text-muted)]">{act.description}</span>
                    </p>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono block mt-0.5">{formatRelativeTimeFrench(act.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charge de l'équipe */}
          <div className="panel space-y-3 border border-[var(--border)] bg-[var(--surface)] p-5 rounded-[var(--r-md)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <h2 className="panel-title text-sm font-bold text-[var(--text)] uppercase tracking-wider">
                Charge équipe (35h)
              </h2>
              <button 
                type="button"
                onClick={() => setActiveView('team')}
                className="text-[10px] font-mono font-bold text-[var(--brand)] hover:underline cursor-pointer uppercase"
              >
                DÉTAIL
              </button>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {workload.slice(0, 4).map(item => (
                <div key={item.user.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text)] truncate font-ui">
                      {item.user.name}
                    </span>
                    <span className={`text-[11px] font-mono font-bold ${item.isOverloaded ? 'text-[var(--button-danger-bg)]' : 'text-[var(--text-muted)]'}`}>
                      {item.loadPercentage}% ({Math.round(item.totalMinutes / 60)}h)
                    </span>
                  </div>
                  <div className="w-full bg-[var(--surface-2)] border border-[var(--border)] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        item.isOverloaded ? 'bg-[var(--button-danger-bg)] shadow-xs' : 'bg-[var(--brand)]'
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
