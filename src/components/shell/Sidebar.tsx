'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, FolderKanban, BarChart2, Calendar, FileText, 
  Users, Settings, ChevronLeft, ChevronRight, Check, ChevronDown, 
  Layers, MessageSquare, CreditCard, DollarSign, Clock, Zap, BookOpen, AlertTriangle,
  ShieldCheck, Plus, Palette, LogOut
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { ActiveView } from '@/types/sentinel';

export interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onOpenAuthModal?: () => void;
  onOpenCreateProjectModal?: () => void;
  onLogout?: () => void;
}

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
  onOpenAuthModal,
  onOpenCreateProjectModal,
  onLogout,
}: SidebarProps) {
  const { 
    workspace, activeView, setActiveView, currentUser, users, 
    setCurrentUser, projects, activeProjectId, setActiveProjectId,
    subscription, activeTimer
  } = useSentinel();

  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Navigation structurée selon Lot 1 : Projet / Travail quotidien / Administration / Plus
  const isOperatorSuperAdmin = currentUser.role === 'super_admin' || currentUser.isSuperAdmin;

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
      title: 'Projet',
      items: [
        { id: 'overview', label: 'Vue d’ensemble', icon: LayoutDashboard },
        { id: 'project_sheet', label: 'Fiche projet', icon: Layers },
        { id: 'gantt', label: 'Planning Gantt', icon: Calendar },
      ],
    },
    {
      title: 'Travail quotidien',
      items: [
        { id: 'kanban', label: 'Tableau Kanban', icon: FolderKanban },
        { id: 'tracking', label: 'Liste & Suivi', icon: BarChart2 },
        { id: 'sprints', label: 'Sprints Agile', icon: Zap, badge: 'Scrum', badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold' },
        { id: 'calendar', label: 'Calendrier', icon: Calendar },
        { 
          id: 'timetracking', 
          label: 'Suivi du temps', 
          icon: Clock, 
          badge: activeTimer ? 'EN COURS' : undefined,
          badgeColor: 'bg-emerald-500 text-white animate-pulse font-bold'
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        { id: 'finance', label: 'Finances & Budgets', icon: DollarSign, badge: 'FCFA', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' },
        { id: 'team', label: 'Équipe & Membres', icon: Users },
        { 
          id: 'billing', 
          label: 'Abonnement & Quotas', 
          icon: CreditCard, 
          badge: subscription.planCode === 'premium' ? 'PRO' : undefined,
          badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold'
        },
        { id: 'settings', label: 'Paramètres', icon: Settings },
      ],
    },
    {
      title: 'Plus',
      items: [
        { id: 'documents', label: 'Documents & Fichiers', icon: FileText },
        { id: 'wiki', label: 'Wiki & Base de savoir', icon: BookOpen },
        { id: 'forum', label: 'Forum du projet', icon: MessageSquare },
        { id: 'risks', label: 'Matrice des risques', icon: AlertTriangle },
        ...(isOperatorSuperAdmin
          ? [
              { 
                id: 'super_admin' as ActiveView, 
                label: 'Opérateur SaaS (Super Admin)', 
                icon: ShieldCheck, 
                badge: 'SaaS',
                badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold'
              },
            ]
          : []),
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
      className={`relative flex flex-col bg-[var(--surface)] text-[var(--text)] border-r border-[var(--border)] transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* En-tête : Logo Officiel SENTINEL GESTION */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)]">
        {!isCollapsed ? (
          <div className="relative flex-1">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="flex items-center gap-3 w-full text-left p-1 rounded-md hover:bg-[var(--surface)] transition group"
            >
              {/* Logo officiel carré avec bordure dynamique du thème 1px */}
              <div className="w-10 h-10 rounded-md bg-[var(--surface)] border border-[var(--brand)] p-1 flex items-center justify-center flex-shrink-0 shadow-[var(--shadow)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/sentinel-logo.jpg" 
                  alt="Sentinel Gestion Logo" 
                  className="w-full h-full object-contain rounded-sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="block text-sm font-bold tracking-wider text-[var(--text)] uppercase font-ui">
                    SENTINEL
                  </span>
                  <span className="text-[10px] font-bold tracking-widest text-[var(--brand)] uppercase font-mono">
                    GESTION
                  </span>
                </div>
                <span className="block text-xs text-[var(--text-muted)] truncate font-mono">
                  {workspace.name && workspace.name.toUpperCase() !== 'SENTINEL GESTION' 
                    ? workspace.name 
                    : 'Poste de Pilotage'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text)] transition" />
            </button>

            {/* Menu Espace */}
            {showWorkspaceMenu && (
              <div className="absolute left-0 top-14 w-60 bg-[var(--surface)] rounded-md shadow-[var(--shadow)] border border-[var(--border)] py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                  Espace de travail actif
                </div>
                <button
                  onClick={() => setShowWorkspaceMenu(false)}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-[var(--text)] bg-[var(--surface-2)] border-l-2 border-[var(--brand)]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded border border-[var(--brand)] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/sentinel-logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <span>{workspace.name}</span>
                  </div>
                  <Check className="w-4 h-4 text-[var(--brand)]" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto">
            <div className="w-10 h-10 rounded-md bg-[#000000] border border-[var(--color-primary)] p-1 flex items-center justify-center shadow-[var(--glow-sm)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sentinel-logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Sélecteur de projet rapide & Création de projet */}
      {!isCollapsed ? (
        <div className="px-3 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
              Projet actif
            </label>
            {onOpenCreateProjectModal && (
              <button
                type="button"
                onClick={onOpenCreateProjectModal}
                className="text-[10px] font-bold text-[var(--brand)] hover:underline uppercase flex items-center gap-0.5"
                title="Créer un nouveau projet"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>Nouveau</span>
              </button>
            )}
          </div>
          <select
            data-testid="select-active-project"
            value={activeProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition"
          >
            <option value="all">Tous les projets réunis</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        onOpenCreateProjectModal && (
          <div className="px-2 py-2 border-b border-[var(--border)] flex justify-center">
            <button
              type="button"
              onClick={onOpenCreateProjectModal}
              className="w-9 h-9 rounded-md bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--brand)] hover:bg-[var(--surface-raised)] text-[var(--brand)] flex items-center justify-center transition shadow-sm"
              title="Créer un nouveau projet"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )
      )}

      {/* Menu principal */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {navSections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2.5 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                {sec.title}
              </div>
            )}
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  data-testid={`nav-${item.id}`}
                  onClick={() => handleSelectView(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  aria-label={isCollapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 w-full px-3 min-h-[44px] rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'border border-[var(--brand)] bg-[var(--surface-2)] text-[var(--text)] shadow-[var(--glow-sm)] font-bold'
                      : 'border border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`} />
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded border border-[var(--brand)] text-[var(--brand)] bg-[var(--surface-raised)] text-[10px] font-mono font-bold uppercase">
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
      <div className="p-2.5 border-t border-[var(--border)] bg-[var(--surface)] relative">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-2.5 p-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--brand)] bg-[var(--surface-2)] transition text-left ${
              isCollapsed ? 'justify-center mx-auto' : 'flex-1'
            }`}
          >
            {/* Avatar carré bordé de la couleur de thème */}
            <div className="w-8 h-8 rounded-md border border-[var(--brand)] bg-[var(--surface-raised)] flex items-center justify-center text-xs font-bold font-mono text-[var(--text)] flex-shrink-0">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-[var(--text)] truncate">
                  {currentUser.name}
                </span>
                <span className="block text-[10px] text-[var(--brand)] uppercase font-mono font-bold truncate">
                  {currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.jobTitle}
                </span>
              </div>
            )}
          </button>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 ml-1.5 text-[var(--text-muted)] hover:text-[var(--text)] rounded hover:bg-[var(--surface-2)] transition"
              title="Réduire le volet"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Menu changement d'utilisateur */}
        {showUserMenu && !isCollapsed && (
          <div className="absolute left-2 bottom-16 w-64 bg-[var(--surface-raised)] rounded-md shadow-2xl border border-[var(--border-strong)] p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
            <div className="px-2 py-1 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
              Changer de compte
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {users.map(u => {
                const roleLabels: Record<string, string> = {
                  super_admin: 'Super Admin',
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
                      if (u.role === 'super_admin' || u.isSuperAdmin) {
                        setActiveView('super_admin');
                      }
                    }}
                    className={`flex items-center justify-between w-full px-2.5 py-2 rounded text-xs font-medium text-left transition ${
                      currentUser.id === u.id 
                        ? 'bg-[var(--surface-2)] border border-[var(--brand)] text-[var(--text)] font-bold' 
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] border border-transparent'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-[var(--text)]">{u.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">{roleLabels[u.role] || u.role}</div>
                    </div>
                    {currentUser.id === u.id && <Check className="w-3.5 h-3.5 text-[var(--brand)]" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setShowUserMenu(false);
                handleSelectView('settings');
              }}
              className="w-full mt-2 pt-2 border-t border-[var(--border)] px-2.5 py-1.5 text-xs font-bold text-[var(--text)] hover:text-[var(--brand)] hover:bg-[var(--surface-2)] rounded transition text-left flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-[var(--brand)]" />
                <span>Apparence & Thèmes</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-[var(--brand)] shadow-sm" />
            </button>

            {currentUser.role === 'super_admin' && (
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  handleSelectView('super_admin');
                }}
                className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold text-[var(--brand)] hover:underline text-left flex items-center justify-between"
              >
                <span>Console Super Admin</span>
                <ShieldCheck className="w-3.5 h-3.5" />
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                data-testid="btn-sidebar-logout"
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout();
                }}
                className="w-full mt-1 pt-1.5 border-t border-[var(--border)] px-2.5 py-1.5 text-xs font-bold text-[#FF5A61] hover:text-[#FF0000] hover:bg-[rgba(255,0,0,0.1)] rounded transition text-left flex items-center justify-between"
              >
                <span>Déconnexion</span>
                <LogOut className="w-3.5 h-3.5 text-[#FF0000]" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bouton de ré-agrandissement si volet réduit */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute -right-3 top-20 w-6 h-6 rounded bg-[var(--color-primary)] text-white flex items-center justify-center shadow-[var(--glow-sm)] hover:bg-[var(--color-primary-hover)] transition"
          title="Agrandir la barre latérale"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </aside>
  );
}
