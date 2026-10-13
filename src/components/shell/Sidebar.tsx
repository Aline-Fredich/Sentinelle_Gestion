'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, FolderKanban, BarChart2, Calendar, FileText, 
  Users, Settings, ChevronLeft, ChevronRight, Check, ChevronDown, 
  Layers, MessageSquare, CreditCard, DollarSign, Clock, Zap, BookOpen, AlertTriangle
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { ActiveView } from '@/types/sentinel';

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}) {
  const { 
    workspace, activeView, setActiveView, currentUser, users, 
    setCurrentUser, projects, activeProjectId, setActiveProjectId,
    subscription, activeTimer
  } = useSentinel();

  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Groupes de navigation clairs et professionnels
  const navSections: Array<{
    title: string;
    items: Array<{
      id: ActiveView;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: string;
      badgeColor?: string;
    }>;
  }> = [
    {
      title: 'Vue Globale',
      items: [
        { id: 'overview', label: 'Vue d’ensemble', icon: LayoutDashboard },
        { id: 'project_sheet', label: 'Fiche projet', icon: Layers },
      ],
    },
    {
      title: 'Planification & Suivi',
      items: [
        { id: 'tracking', label: 'Tableau de suivi', icon: BarChart2 },
        { id: 'kanban', label: 'Tableau Kanban', icon: FolderKanban },
        { id: 'sprints', label: 'Sprints Agile', icon: Zap, badge: 'Scrum', badgeColor: 'bg-blue-500/20 text-blue-400' },
        { id: 'gantt', label: 'Planning Gantt', icon: Calendar },
        { id: 'calendar', label: 'Calendrier', icon: Calendar },
      ],
    },
    {
      title: 'Pilotage & Rentabilité',
      items: [
        { id: 'finance', label: 'Budgets & Dépenses', icon: DollarSign },
        { 
          id: 'timetracking', 
          label: 'Suivi du temps', 
          icon: Clock, 
          badge: activeTimer ? 'EN COURS' : undefined,
          badgeColor: 'bg-emerald-500 text-white animate-pulse'
        },
        { id: 'risks', label: 'Matrice des risques', icon: AlertTriangle },
      ],
    },
    {
      title: 'Espace Collaboratif',
      items: [
        { id: 'forum', label: 'Forum du projet', icon: MessageSquare },
        { id: 'wiki', label: 'Wiki & Base de savoir', icon: BookOpen },
        { id: 'documents', label: 'Documents & Fichiers', icon: FileText },
        { id: 'team', label: 'Équipe & Membres', icon: Users },
      ],
    },
    {
      title: 'Système',
      items: [
        { 
          id: 'billing', 
          label: 'Abonnement & Quotas', 
          icon: CreditCard, 
          badge: subscription.planCode === 'premium' ? 'PRO' : undefined,
          badgeColor: 'bg-cyan-500/20 text-cyan-300'
        },
        { id: 'settings', label: 'Paramètres', icon: Settings },
      ],
    },
  ];

  const getRouteForView = (view: ActiveView, wsSlug: string, prjId: string) => {
    const effectivePrj = prjId === 'all' ? (projects[0]?.id || 'prj-1') : prjId;
    switch (view) {
      case 'overview': return `/${wsSlug}`;
      case 'project_sheet': return `/${wsSlug}/projects/${effectivePrj}`;
      case 'tracking': return `/${wsSlug}/projects/${effectivePrj}/list`;
      case 'kanban': return `/${wsSlug}/projects/${effectivePrj}/board`;
      case 'sprints': return `/${wsSlug}/projects/${effectivePrj}/sprints`;
      case 'gantt': return `/${wsSlug}/projects/${effectivePrj}/gantt`;
      case 'calendar': return `/${wsSlug}/projects/${effectivePrj}/calendar`;
      case 'finance': return `/${wsSlug}/projects/${effectivePrj}/finance`;
      case 'timetracking': return `/${wsSlug}/projects/${effectivePrj}/time`;
      case 'risks': return `/${wsSlug}/projects/${effectivePrj}/risks`;
      case 'wiki': return `/${wsSlug}/projects/${effectivePrj}/wiki`;
      case 'team': return `/${wsSlug}/team`;
      case 'settings': return `/${wsSlug}/settings`;
      case 'billing': return `/${wsSlug}/billing`;
      default: return `/${wsSlug}`;
    }
  };

  const handleSelectView = (viewId: ActiveView) => {
    setActiveView(viewId);
    try {
      const wsSlug = workspace.slug || 'sentinel-gestion';
      const targetUrl = getRouteForView(viewId, wsSlug, activeProjectId);
      if (typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
        window.history.pushState(null, '', targetUrl);
      }
    } catch {
      // Ignore
    }
  };

  const handleProjectChange = (newPrjId: string) => {
    setActiveProjectId(newPrjId);
    try {
      const wsSlug = workspace.slug || 'sentinel-gestion';
      const targetUrl = getRouteForView(activeView, wsSlug, newPrjId);
      if (typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
        window.history.pushState(null, '', targetUrl);
      }
    } catch {
      // Ignore
    }
  };

  return (
    <aside
      className={`relative flex flex-col bg-[#0B132B] text-slate-200 border-r border-slate-800 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* En-tête : Logo Officiel SENTINEL GESTION */}
      <div className="h-20 px-4 flex items-center justify-between border-b border-slate-800 bg-[#080E1A]">
        {!isCollapsed ? (
          <div className="relative flex-1">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="flex items-center gap-3 w-full text-left p-1.5 rounded-xl hover:bg-slate-800/80 transition group"
            >
              {/* Logo officiel carré avec bordure neon */}
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-blue-500/40 p-1 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/sentinel-logo.jpg" 
                  alt="Sentinel Gestion Logo" 
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="block text-base font-black tracking-wider text-blue-400 group-hover:text-blue-300 transition">
                    SENTINEL
                  </span>
                  <span className="text-[10px] font-bold tracking-widest text-[#FF1E27] uppercase">
                    GESTION
                  </span>
                </div>
                <span className="block text-xs text-slate-400 truncate">
                  {workspace.name}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
            </button>

            {/* Menu Espace */}
            {showWorkspaceMenu && (
              <div className="absolute left-0 top-16 w-64 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Espaces de travail
                </div>
                <button
                  onClick={() => setShowWorkspaceMenu(false)}
                  className="flex items-center justify-between w-full px-3 py-2.5 text-xs font-medium text-white bg-slate-800/80 hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/sentinel-logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <span>{workspace.name}</span>
                  </div>
                  <Check className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-blue-500/40 p-1 flex items-center justify-center shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sentinel-logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
          </div>
        )}
      </div>

      {/* Sélecteur de projet rapide (quand non réduit) */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/60">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Projet en cours
          </label>
          <select
            value={activeProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-800/90 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les projets réunis</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Menu principal réorganisé avec typographie augmentée */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navSections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400/90">
                {sec.title}
              </div>
            )}
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectView(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#0066FF] text-white shadow-lg shadow-blue-600/30 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.badgeColor || 'bg-blue-500/20 text-blue-300'}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Profil utilisateur en bas */}
      <div className="p-3 border-t border-slate-800 bg-[#080E1A] relative">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-800 transition text-left ${
              isCollapsed ? 'justify-center mx-auto' : 'flex-1'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/40"
            />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-white truncate">
                  {currentUser.name}
                </span>
                <span className="block text-xs text-slate-400 truncate">
                  {currentUser.jobTitle}
                </span>
              </div>
            )}
          </button>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Réduire le volet"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Menu changement d'utilisateur */}
        {showUserMenu && !isCollapsed && (
          <div className="absolute left-3 bottom-20 w-64 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95">
            <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Changer de compte actif
            </div>
            {users.map(u => {
              const roleLabels: Record<string, string> = {
                owner: 'Propriétaire',
                admin: 'Administrateur',
                project_manager: 'Chef de projet',
                member: 'Membre',
                viewer: 'Lecteur',
              };
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    setCurrentUser(u);
                    setShowUserMenu(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-left transition ${
                    currentUser.id === u.id ? 'bg-blue-600/30 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">{u.name}</div>
                    <div className="text-[11px] text-slate-400">{u.jobTitle} • {roleLabels[u.role] || u.role}</div>
                  </div>
                  {currentUser.id === u.id && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bouton de ré-agrandissement si volet réduit */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute -right-3 top-24 w-7 h-7 rounded-full bg-[#0066FF] text-white flex items-center justify-center shadow-lg hover:bg-blue-600 transition"
          title="Agrandir la barre latérale"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </aside>
  );
}
