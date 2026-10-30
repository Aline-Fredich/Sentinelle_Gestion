'use client';

import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Layers, Clock, Users, 
  CheckCircle2, Sliders, Search, ExternalLink, 
  MessageSquare, TrendingUp, Award, Power, UserPlus
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { Project, ProjectTier } from '@/types/sentinel';

interface SuperAdminDashboardProps {
  onOpenAdminConfig?: () => void;
}

export function SuperAdminDashboard({ onOpenAdminConfig }: SuperAdminDashboardProps = {}) {
  const { 
    projects, users, timeEntries, tasks,
    updateProjectTier, setActiveProjectId, setActiveView,
    addNotification, forumTopics
  } = useSentinel();

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | ProjectTier>('all');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Calculs KPIs Globaux
  const totalProjects = projects.length;
  const standardProjectsCount = projects.filter(p => (p.tier || 'standard') === 'standard').length;
  const proProjectsCount = projects.filter(p => p.tier === 'pro').length;
  const premiumProjectsCount = projects.filter(p => p.tier === 'premium').length;

  const totalAllocatedHours = useMemo(() => {
    return projects.reduce((sum, p) => sum + (p.allocatedHours || 100), 0);
  }, [projects]);

  const totalConsumedMinutes = useMemo(() => {
    return timeEntries.reduce((sum, t) => sum + t.durationMinutes, 0);
  }, [timeEntries]);

  const totalConsumedHours = (totalConsumedMinutes / 60).toFixed(1);

  // Progression globale moyenne
  const averageProgress = useMemo(() => {
    if (projects.length === 0) return 0;
    const progressList = projects.map(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id);
      if (pTasks.length === 0) return 0;
      const doneTasks = pTasks.filter(t => t.status === 'done').length;
      return (doneTasks / pTasks.length) * 100;
    });
    const avg = progressList.reduce((a, b) => a + b, 0) / projects.length;
    return Math.round(avg);
  }, [projects, tasks]);

  // Administrateurs
  const adminUsers = useMemo(() => {
    return users.filter(u => u.role === 'admin' || u.role === 'owner' || u.role === 'super_admin');
  }, [users]);

  // Projets filtrés
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (tierFilter !== 'all' && (p.tier || 'standard') !== tierFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q);
      }
      return true;
    });
  }, [projects, tierFilter, searchQuery]);

  const handleTierChange = (project: Project, newTier: ProjectTier) => {
    updateProjectTier(project.id, newTier);
  };

  const handleOpenProjectAsAdmin = (projectId: string) => {
    setActiveProjectId(projectId);
    setActiveView('project_sheet');
  };

  const toggleMaintenance = () => {
    const next = !maintenanceMode;
    setMaintenanceMode(next);
    addNotification(
      'Mode Maintenance', 
      next ? 'Mode maintenance activé pour tous les administrateurs.' : 'Mode maintenance désactivé.', 
      'system'
    );
  };

  return (
    <div className="stack animate-in fade-in duration-200">
      {/* 1. En-tête Superviseur Global Hero */}
      <div className="panel panel--hero flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-role">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--red)] mr-1.5 inline" />
              SUPER ADMINISTRATEUR • SUPERVISEUR GLOBAL
            </span>
            <span className="status-dot" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase">
            TABLEAU DE BORD DE PILOTAGE & KPIS
          </h1>
          <p className="text-xs sm:text-sm text-[var(--white-70)] mt-1 max-w-2xl leading-relaxed">
            Supervisez l’ensemble des projets, suivez la performance globale et gérez l’attribution des formules Standard, Pro et Premium pour chaque administrateur.
          </p>
        </div>

        {/* Contrôles système rapides */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={toggleMaintenance}
            className={`btn ${maintenanceMode ? 'btn-danger' : 'btn-secondary'}`}
          >
            <Power className="w-4 h-4" />
            <span>{maintenanceMode ? 'MAINTENANCE ACTIVE' : 'ACTIVER MAINTENANCE'}</span>
          </button>

          <button
            onClick={() => setActiveView('settings')}
            className="btn btn-secondary"
          >
            <Sliders className="w-4 h-4 text-[var(--red)]" />
            <span>OPTIONS SYSTÈME</span>
          </button>
        </div>
      </div>

      {/* 2. KPIs de Supervision Globale */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Projets Totaux */}
        <div className="panel kpi">
          <div className="kpi-head">
            <span className="kpi-label">Projets Sous Supervision</span>
            <div className="kpi-icon">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="kpi-value font-mono">
            {totalProjects}
          </div>
          <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-[11px] font-mono text-[var(--white-70)]">
            <span>Std : {standardProjectsCount}</span>
            <span className="text-white">Pro : {proProjectsCount}</span>
            <span className="text-[var(--red)] font-bold">Prem : {premiumProjectsCount}</span>
          </div>
        </div>

        {/* Temps Dédié Global */}
        <div className="panel kpi">
          <div className="kpi-head">
            <span className="kpi-label">Temps Dédié Consommé</span>
            <div className="kpi-icon">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="kpi-value font-mono">
            {totalConsumedHours}H
          </div>
          <div className="pt-2 border-t border-[var(--line)] space-y-1">
            <div className="text-[11px] text-[var(--white-45)] font-mono">
              Plafond total : {totalAllocatedHours}h allouées
            </div>
            <div className="progress">
              <span style={{ width: `${Math.min(100, Math.round((Number(totalConsumedHours) / (totalAllocatedHours || 1)) * 100))}%` }} />
            </div>
          </div>
        </div>

        {/* Progression Moyenne */}
        <div className="panel kpi">
          <div className="kpi-head">
            <span className="kpi-label">Avancement Moyen</span>
            <div className="kpi-icon">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="kpi-value font-mono">
            {averageProgress}%
          </div>
          <div className="pt-2 border-t border-[var(--line)] space-y-1">
            <div className="text-[11px] text-[var(--white-45)] font-mono">
              Taux moyen d'exécution
            </div>
            <div className="progress">
              <span style={{ width: `${averageProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Écosystème & Administrateurs */}
        <div className="panel kpi">
          <div className="kpi-head">
            <span className="kpi-label">Équipe & Utilisateurs</span>
            <div className="kpi-icon">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="kpi-value font-mono">
            {users.length}
          </div>
          <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-[11px] font-mono text-[var(--white-70)]">
            <span>Admins : {adminUsers.length}</span>
            <span>Membres : {users.length - adminUsers.length}</span>
          </div>
        </div>
      </div>

      {/* 3. Section Principale : Supervision des Projets & Contrôle des Formules */}
      <div className="panel space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="panel-title text-base">
              SUPERVISION DES PROJETS & GESTION DES FORMULES
            </h2>
            <p className="text-xs text-[var(--white-70)] mt-0.5">
              Attribuez les formules <strong>STANDARD</strong>, <strong>PRO</strong> ou <strong>PREMIUM</strong> pour chaque projet.
            </p>
          </div>

          {/* Filtres & Recherche */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="input-group flex-1 sm:w-60">
              <Search className="w-4 h-4 text-[var(--red)]" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-input text-xs"
              />
            </div>

            <select
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value as 'all' | ProjectTier)}
              className="form-select font-mono text-xs w-auto"
            >
              <option value="all">TOUTES LES FORMULES</option>
              <option value="standard">STANDARD</option>
              <option value="pro">PRO</option>
              <option value="premium">PREMIUM</option>
            </select>
          </div>
        </div>

        {/* Tableau des Projets */}
        <div className="table-wrap">
          <table className="table table--wide">
            <thead>
              <tr>
                <th>PROJET & RÉF</th>
                <th>ADMINISTRATEUR LEAD</th>
                <th>AVANCEMENT</th>
                <th>TEMPS DÉDIÉ</th>
                <th>NIVEAU ACTUEL</th>
                <th>ATTRIBUER FORMULE</th>
                <th>OUVRIR</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => {
                const leadAdmin = users.find(u => u.id === project.leadUserId) || users[0];
                const projectTasks = tasks.filter(t => t.projectId === project.id);
                const doneCount = projectTasks.filter(t => t.status === 'done').length;
                const progressPct = projectTasks.length > 0 ? Math.round((doneCount / projectTasks.length) * 100) : 0;
                
                // Temps passé sur ce projet
                const projectMinutes = timeEntries
                  .filter(t => t.projectId === project.id)
                  .reduce((sum, e) => sum + e.durationMinutes, 0);
                const projectHours = (projectMinutes / 60).toFixed(1);
                const allocated = project.allocatedHours || 120;
                const currentTier = project.tier || 'standard';

                return (
                  <tr key={project.id}>
                    {/* Nom & Ref */}
                    <td>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{project.name}</span>
                          <span className="badge-role text-[9px]">
                            {project.reference}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--white-45)] mt-0.5 line-clamp-1 max-w-xs font-normal">
                          {project.description}
                        </div>
                      </div>
                    </td>

                    {/* Administrateur */}
                    <td>
                      <div className="flex items-center gap-2.5">
                        <img
                          src={leadAdmin.avatar}
                          alt={leadAdmin.name}
                          className="w-7 h-7 rounded-[var(--r-xs)] border border-[var(--line-strong)]"
                        />
                        <div>
                          <div className="text-xs font-bold text-white">
                            {leadAdmin.name}
                          </div>
                          <div className="text-[10px] text-[var(--white-45)] font-mono">
                            {leadAdmin.jobTitle}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Avancement */}
                    <td>
                      <div className="w-28 space-y-1 mx-auto">
                        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-white">
                          <span>{progressPct}%</span>
                          <span className="text-[var(--white-45)] font-normal">{doneCount}/{projectTasks.length}</span>
                        </div>
                        <div className="progress">
                          <span style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                    </td>

                    {/* Temps dédié */}
                    <td>
                      <div className="font-mono">
                        <div className="text-xs font-bold text-white">
                          {projectHours}h <span className="text-[var(--white-45)] font-normal">/ {allocated}h</span>
                        </div>
                        <div className="text-[10px] text-[var(--white-45)]">
                          {Math.round((Number(projectHours) / (allocated || 1)) * 100)}% alloué
                        </div>
                      </div>
                    </td>

                    {/* Niveau actuel */}
                    <td>
                      <span className={`badge ${currentTier === 'premium' ? 'badge--bad' : currentTier === 'pro' ? 'badge--ok' : ''} text-[10px] font-mono`}>
                        {currentTier.toUpperCase()}
                      </span>
                    </td>

                    {/* Action Super Admin : Sélecteur de Formule */}
                    <td>
                      <div className="tabs">
                        <button
                          type="button"
                          onClick={() => handleTierChange(project, 'standard')}
                          className="tab"
                          aria-selected={currentTier === 'standard'}
                        >
                          SIMPLE
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTierChange(project, 'pro')}
                          className="tab"
                          aria-selected={currentTier === 'pro'}
                        >
                          PRO
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTierChange(project, 'premium')}
                          className="tab"
                          aria-selected={currentTier === 'premium'}
                        >
                          PREMIUM
                        </button>
                      </div>
                    </td>

                    {/* Ouvrir le projet */}
                    <td>
                      <button
                        onClick={() => handleOpenProjectAsAdmin(project.id)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Ouvrir la fiche de ce projet"
                        aria-label="Ouvrir la fiche de ce projet"
                      >
                        <ExternalLink className="w-4 h-4 text-[var(--red)]" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Répertoire des Administrateurs & Supervision des Discussions */}
      <div className="grid-2">
        {/* Administrateurs de Projets */}
        <div className="panel space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="panel-title text-sm">
                RESPONSABLES DE PROJETS & ADMINISTRATEURS
              </h3>
              <div className="text-[10px] text-[var(--text-muted)] font-mono">
                {adminUsers.length} ADMINISTRATEUR(S) ENREGISTRÉ(S)
              </div>
            </div>
            {onOpenAdminConfig && (
              <button
                type="button"
                onClick={onOpenAdminConfig}
                className="btn btn-secondary btn-sm flex items-center gap-1.5"
                title="Créer ou configurer un compte administrateur"
              >
                <UserPlus className="w-3.5 h-3.5 text-[var(--brand)]" />
                <span>+ Configurer un Administrateur</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {adminUsers.map(admin => {
              const managedProjects = projects.filter(p => p.leadUserId === admin.id);
              return (
                <div 
                  key={admin.id}
                  className="p-3 rounded-[var(--r-xs)] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between transition hover:border-[var(--brand)]"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={admin.avatar} 
                      alt={admin.name} 
                      className="w-8 h-8 rounded-[var(--r-xs)] border border-[var(--border-strong)]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5 uppercase">
                        {admin.name}
                        {admin.role === 'super_admin' && (
                          <span className="badge badge-role text-[9px]">
                            SUPER ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] font-mono">
                        {admin.email} • {admin.jobTitle}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-[var(--text)] font-mono">
                      {managedProjects.length} PROJET(S)
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                      {managedProjects.map(p => p.reference).join(', ') || 'Aucun'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Supervision des Forums de Projets */}
        <div className="panel space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="panel-title text-sm">
              ACTIVITÉ RÉCENTE DU FORUM
            </h3>
            <span className="badge text-[10px] font-mono">
              {forumTopics.length} SUJETS
            </span>
          </div>

          <div className="space-y-2.5">
            {forumTopics.slice(0, 4).map(topic => {
              const project = projects.find(p => p.id === topic.projectId);
              return (
                <div 
                  key={topic.id}
                  className="p-3 rounded-[var(--r-xs)] bg-black border border-[var(--line)] flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="badge-role text-[9px]">
                        {project?.reference || 'PRJ'}
                      </span>
                      <span className="text-xs font-bold text-white line-clamp-1">
                        {topic.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--white-45)] font-mono">
                      Par {topic.authorName} • {topic.replyCount} réponse(s)
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (topic.projectId) setActiveProjectId(topic.projectId);
                      setActiveView('forum');
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    VOIR
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
