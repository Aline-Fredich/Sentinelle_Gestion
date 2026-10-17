'use client';

import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Activity, Layers, Clock, Users, ArrowUpRight, 
  Sparkles, CheckCircle2, AlertTriangle, Settings2, Sliders, 
  Search, Filter, ExternalLink, ShieldAlert, Zap, MessageSquare,
  TrendingUp, Award, Power
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { Project, ProjectTier, User } from '@/types/sentinel';

export function SuperAdminDashboard() {
  const { 
    projects, users, timeEntries, tasks, risks,
    updateProjectTier, setActiveProjectId, setActiveView,
    addNotification, forumTopics
  } = useSentinel();

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | ProjectTier>('all');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. En-tête Superviseur Global Apple */}
      <div className="p-7 rounded-3xl apple-glass shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Super Administrateur • Superviseur Global
            </span>
            <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Tableau de Bord de Pilotage & KPIs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Supervisez l’ensemble des projets, suivez la performance globale et gérez l’attribution des formules Standard, Pro et Premium pour chaque administrateur.
          </p>
        </div>

        {/* Contrôles système rapides */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={toggleMaintenance}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition ${
              maintenanceMode
                ? 'bg-[#FF3B30] text-white shadow-md shadow-red-500/20'
                : 'apple-btn-secondary text-xs'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{maintenanceMode ? 'Maintenance Active' : 'Activer Maintenance'}</span>
          </button>

          <button
            onClick={() => setActiveView('settings')}
            className="apple-btn-secondary text-xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Options Système</span>
          </button>
        </div>
      </div>

      {/* 2. KPIs de Supervision Globale (Cartes Apple) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Projets Totaux & Répartition */}
        <div className="p-6 rounded-3xl apple-card relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Projets Sous Supervision</span>
            <Layers className="w-4 h-4 text-[#0071E3] dark:text-[#2997FF]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalProjects}
            </span>
            <span className="text-xs font-semibold text-slate-400">projets</span>
          </div>
          <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Standard : <strong className="text-slate-700 dark:text-slate-200">{standardProjectsCount}</strong></span>
            <span className="text-[#0071E3] font-semibold">Pro : {proProjectsCount}</span>
            <span className="text-[#34C759] font-semibold">Premium : {premiumProjectsCount}</span>
          </div>
        </div>

        {/* Temps Dédié Global */}
        <div className="p-6 rounded-3xl apple-card relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Temps Dédié Consommé</span>
            <Clock className="w-4 h-4 text-[#FF9F0A]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalConsumedHours}h
            </span>
            <span className="text-xs font-semibold text-slate-400">/ {totalAllocatedHours}h allouées</span>
          </div>
          <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[#FF9F0A] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((Number(totalConsumedHours) / (totalAllocatedHours || 1)) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Progression Moyenne */}
        <div className="p-6 rounded-3xl apple-card relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Avancement Moyen</span>
            <TrendingUp className="w-4 h-4 text-[#34C759]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {averageProgress}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              Global
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[#34C759] h-full rounded-full transition-all duration-500"
                style={{ width: `${averageProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Écosystème & Administrateurs */}
        <div className="p-6 rounded-3xl apple-card relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Équipe & Administrateurs</span>
            <Users className="w-4 h-4 text-[#AF52DE]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {users.length}
            </span>
            <span className="text-xs font-semibold text-slate-400">utilisateurs</span>
          </div>
          <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Admins : <strong className="text-slate-800 dark:text-slate-200">{adminUsers.length}</strong></span>
            <span>Membres : <strong className="text-slate-800 dark:text-slate-200">{users.length - adminUsers.length}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Section Principale : Supervision des Projets & Contrôle des Formules (Standard / Pro / Premium) */}
      <div className="p-7 rounded-3xl apple-card space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#0071E3] dark:text-[#2997FF]" />
              Supervision des Projets & Gestion des Formules
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Faites passer un projet de <strong>Simple (Standard)</strong> à <strong>Pro</strong> ou <strong>Premium</strong> en un clic.
            </p>
          </div>

          {/* Filtres & Recherche Apple */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="apple-input w-full pl-8 text-xs"
              />
            </div>

            <select
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value as 'all' | ProjectTier)}
              className="apple-input text-xs font-medium"
            >
              <option value="all">Toutes les formules</option>
              <option value="standard">Standard</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>

        {/* Tableau Apple des Projets */}
        <div className="overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10">
          <table className="sentinel-table">
            <thead>
              <tr>
                <th>Projet & Réf</th>
                <th>Administrateur Référent</th>
                <th>Avancement</th>
                <th>Temps Dédié</th>
                <th>Niveau Actuel</th>
                <th className="text-right">Action Super Admin : Attribuer Formule</th>
                <th>Ouvrir</th>
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
                  <tr key={project.id} className="transition">
                    {/* Nom & Ref */}
                    <td>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{project.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {project.reference}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-xs">
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
                          className="w-7 h-7 rounded-full shadow-sm"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {leadAdmin.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {leadAdmin.jobTitle}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Avancement */}
                    <td>
                      <div className="w-28 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          <span>{progressPct}%</span>
                          <span className="text-[10px] text-slate-400">{doneCount}/{projectTasks.length}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              progressPct >= 80 ? 'bg-[#34C759]' : progressPct >= 40 ? 'bg-[#0071E3]' : 'bg-[#FF9F0A]'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Temps dédié */}
                    <td>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {projectHours}h <span className="text-slate-400 font-normal">/ {allocated}h</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Math.round((Number(projectHours) / (allocated || 1)) * 100)}% alloué
                        </div>
                      </div>
                    </td>

                    {/* Niveau actuel */}
                    <td>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                        currentTier === 'premium'
                          ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/30'
                          : currentTier === 'pro'
                          ? 'bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] border-[#0071E3]/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {currentTier}
                      </span>
                    </td>

                    {/* Action Super Admin : Sélecteur de Formule */}
                    <td className="text-right">
                      <div className="inline-flex p-1 rounded-xl bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-black/5 dark:border-white/10 gap-1">
                        <button
                          type="button"
                          onClick={() => handleTierChange(project, 'standard')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
                            currentTier === 'standard'
                              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          Simple
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTierChange(project, 'pro')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
                            currentTier === 'pro'
                              ? 'bg-[#0071E3] text-white shadow-sm'
                              : 'text-slate-500 hover:text-[#0071E3]'
                          }`}
                        >
                          Pro
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTierChange(project, 'premium')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
                            currentTier === 'premium'
                              ? 'bg-[#34C759] text-white shadow-sm'
                              : 'text-slate-500 hover:text-[#34C759]'
                          }`}
                        >
                          Premium
                        </button>
                      </div>
                    </td>

                    {/* Ouvrir le projet */}
                    <td>
                      <button
                        onClick={() => handleOpenProjectAsAdmin(project.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#0071E3] hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Ouvrir la fiche de ce projet"
                      >
                        <ExternalLink className="w-4 h-4" />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Administrateurs de Projets */}
        <div className="p-7 rounded-3xl apple-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0071E3] dark:text-[#2997FF]" />
              Administrateurs & Responsables de Projets
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              {adminUsers.length} administrateurs
            </span>
          </div>

          <div className="space-y-3">
            {adminUsers.map(admin => {
              const managedProjects = projects.filter(p => p.leadUserId === admin.id);
              return (
                <div 
                  key={admin.id}
                  className="p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-black/5 dark:border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={admin.avatar} 
                      alt={admin.name} 
                      className="w-9 h-9 rounded-full shadow-sm"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {admin.name}
                        {admin.role === 'super_admin' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 font-extrabold uppercase">
                            Super Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {admin.email} • {admin.jobTitle}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {managedProjects.length} projet(s)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {managedProjects.map(p => p.reference).join(', ') || 'Aucun'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Supervision des Forums de Projets */}
        <div className="p-7 rounded-3xl apple-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#34C759]" />
              Activité des Forums & Discussions Projets
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              {forumTopics.length} discussions
            </span>
          </div>

          <div className="space-y-3">
            {forumTopics.slice(0, 4).map(topic => {
              const project = projects.find(p => p.id === topic.projectId);
              return (
                <div 
                  key={topic.id}
                  className="p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-black/5 dark:border-white/5 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-[#0071E3] dark:text-[#2997FF] bg-[#0071E3]/10 px-1.5 py-0.5 rounded">
                        {project?.reference || 'Projet'}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {topic.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Par {topic.authorName} • {topic.replyCount} réponse(s)
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (topic.projectId) setActiveProjectId(topic.projectId);
                      setActiveView('forum');
                    }}
                    className="apple-btn-secondary text-[11px] py-1 px-3"
                  >
                    Voir Forum
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
