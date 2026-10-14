'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Workspace, User, Project, ProjectPhase, Task, TaskDependency, 
  ProjectMilestone, ProjectDocument, ActivityEvent, NotificationItem, 
  ActiveView, TaskStatus, TaskPriority, ChecklistItem,
  WorkspaceInvitation, ForumTopic, ForumPost, SubscriptionPlan, WorkspaceSubscription,
  WorkspaceRole, ForumCategory,
  ProjectExpense, ProjectBudget, TimeEntry, ActiveTimer, Sprint, WikiPage, ProjectRisk, ProjectShare
} from '@/types/sentinel';
import { 
  INITIAL_WORKSPACE, INITIAL_USERS, INITIAL_PROJECTS, INITIAL_PHASES, 
  INITIAL_TASKS, INITIAL_DEPENDENCIES, INITIAL_MILESTONES, INITIAL_DOCUMENTS, 
  INITIAL_ACTIVITIES, INITIAL_NOTIFICATIONS,
  INITIAL_INVITATIONS, INITIAL_FORUM_TOPICS, INITIAL_FORUM_POSTS,
  SUBSCRIPTION_PLANS, INITIAL_SUBSCRIPTION,
  INITIAL_EXPENSES, INITIAL_BUDGETS, INITIAL_TIME_ENTRIES, INITIAL_SPRINTS, INITIAL_WIKI_PAGES, INITIAL_RISKS
} from '@/lib/initialData';
import { getTodayDateString, isDateOverdue, isDateToday, isDateUpcoming } from '@/lib/dateUtils';
import { generateId } from '@/lib/idUtils';
import { wouldCreateDependencyCycle } from '@/domain/dependencies';
import { initializeAndMigrateDatabase, db } from '@/lib/repository';
import { createLocalAvatarSvg } from '@/lib/avatarUtils';

export interface FilterState {
  memberId?: string;
  priority?: TaskPriority | 'all';
  status?: TaskStatus | 'all';
  startDate?: string;
  endDate?: string;
  includeArchived: boolean;
}

interface SentinelContextType {
  workspace: Workspace;
  users: User[];
  projects: Project[];
  phases: ProjectPhase[];
  tasks: Task[];
  dependencies: TaskDependency[];
  milestones: ProjectMilestone[];
  documents: ProjectDocument[];
  activities: ActivityEvent[];
  notifications: NotificationItem[];
  
  // Invitations, Forum et Abonnements
  invitations: WorkspaceInvitation[];
  forumTopics: ForumTopic[];
  forumPosts: ForumPost[];
  subscription: WorkspaceSubscription;
  plans: SubscriptionPlan[];
  quotas: {
    activeProjects: { used: number; max: number };
    members: { used: number; max: number };
    storage: { usedMb: number; maxMb: number };
  };

  // Navigation & vue
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  activeProjectId: string | 'all';
  setActiveProjectId: (id: string | 'all') => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;

  // Filtres & recherche
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;

  // Calculs réels dynamiques
  currentProject: Project | null;
  filteredTasks: Task[];
  metrics: {
    total: number;
    inProgress: number;
    completed: number;
    completionRate: number;
    overdue: number;
    upcoming: number;
    todayCount: number;
    activeProjectsCount: number;
    openTasksCount: number;
    upcoming7DaysCount: number;
    averageProjectProgress: number;
  };
  historicalStats: Array<{
    period: string;
    created: number;
    completed: number;
  }>;
  projectsProgressList: Array<{
    project: Project;
    totalTasks: number;
    completedTasks: number;
    progressPercentage: number;
  }>;
  statusBreakdown: Array<{
    status: TaskStatus;
    label: string;
    count: number;
    color: string;
  }>;
  trackingColumns: {
    completed: Task[];
    inProgress: Task[];
    overdue: Task[];
    upcoming: Task[];
  };
  workload: Array<{
    user: User;
    assignedTasks: Task[];
    overdueCount: number;
    totalMinutes: number;
    capacityMinutes: number;
    loadPercentage: number;
    isOverloaded: boolean;
  }>;
  priorityDistribution: {
    urgent: { count: number; percentage: number };
    high: { count: number; percentage: number };
    medium: { count: number; percentage: number };
    low: { count: number; percentage: number };
    total: number;
  };

  // Actions Tâches & Projets
  createTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId' | 'order'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  addChecklistItem: (taskId: string, title: string) => void;
  
  createProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId'>) => { success: boolean; project?: Project; error?: string };
  updateProject: (id: string, updates: Partial<Project>) => void;
  
  createPhase: (data: Omit<ProjectPhase, 'id'>) => ProjectPhase;
  updatePhase: (id: string, updates: Partial<ProjectPhase>) => void;
  deletePhase: (id: string) => void;

  addDependency: (predId: string, succId: string) => { success: boolean; error?: string };
  deleteDependency: (id: string) => void;

  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (title: string, message: string, category: NotificationItem['category']) => void;

  // Actions Membres & Invitations
  createInvitation: (email: string, role: WorkspaceRole, projectId?: string) => { success: boolean; error?: string };
  revokeInvitation: (id: string) => void;
  acceptInvitation: (id: string) => void;
  removeMember: (userId: string, reassignToUserId?: string) => { success: boolean; error?: string };
  updateUserRole: (userId: string, role: WorkspaceRole) => void;

  // Actions Forum
  createForumTopic: (data: { projectId: string; title: string; body: string; category: ForumCategory }) => ForumTopic;
  createForumPost: (topicId: string, body: string) => ForumPost;
  toggleTopicPin: (topicId: string) => void;
  markPostAsSolution: (topicId: string, postId: string) => void;
  addReactionToPost: (postId: string, emoji: string) => void;
  deleteForumTopic: (topicId: string) => void;

  // Actions Abonnements & Quotas
  upgradePlan: (planCode: 'discovery' | 'premium' | 'team') => void;
  checkQuota: (type: 'project' | 'member' | 'storage') => { allowed: boolean; message?: string };

  // 1. Finance & Budgets
  expenses: ProjectExpense[];
  budgets: ProjectBudget[];
  addExpense: (expense: Omit<ProjectExpense, 'id'>) => ProjectExpense;
  deleteExpense: (id: string) => void;
  updateBudget: (projectId: string, targetBudget: number) => void;

  // 2. Suivi du Temps (Time Tracking)
  timeEntries: TimeEntry[];
  activeTimer: ActiveTimer | null;
  startTimer: (projectId: string, taskId?: string, description?: string) => void;
  stopTimer: () => TimeEntry | null;
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => TimeEntry;
  deleteTimeEntry: (id: string) => void;

  // 3. Sprints Agile
  sprints: Sprint[];
  createSprint: (sprint: Omit<Sprint, 'id'>) => Sprint;
  updateSprintStatus: (id: string, status: Sprint['status']) => void;
  addTasksToSprint: (sprintId: string, taskIds: string[]) => void;

  // 4. Wiki & Base de Connaissances
  wikiPages: WikiPage[];
  createWikiPage: (page: Omit<WikiPage, 'id' | 'updatedAt'>) => WikiPage;
  updateWikiPage: (id: string, updates: Partial<WikiPage>) => void;
  deleteWikiPage: (id: string) => void;

  // 5. Risques & Matrice 5x5
  risks: ProjectRisk[];
  createRisk: (risk: Omit<ProjectRisk, 'id' | 'createdAt'>) => ProjectRisk;
  updateRiskStatus: (id: string, status: ProjectRisk['status']) => void;
  deleteRisk: (id: string) => void;

  // 6. Partages de projet
  shares: ProjectShare[];
  addProjectShare: (projectId: string, email: string, permission: 'view' | 'edit') => ProjectShare;
  revokeProjectShare: (id: string) => void;

  importTasksFromCSV: (tasksData: Partial<Task>[]) => { imported: number; errors: string[] };
  resetToFactoryData: () => void;
}

const SentinelContext = createContext<SentinelContextType | null>(null);

const STORAGE_KEY = 'sentinel_gestion_state_v1';
const LEGACY_STORAGE_KEYS = ['sentinel_de_gestion_state_v1', 'software_gestion_state_v1'];

export function SentinelProvider({ children }: { children: React.ReactNode }) {
  // Données de base
  const [workspace] = useState<Workspace>(INITIAL_WORKSPACE);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Thomas Laurent (Owner)
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [phases, setPhases] = useState<ProjectPhase[]>(INITIAL_PHASES);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [dependencies, setDependencies] = useState<TaskDependency[]>(INITIAL_DEPENDENCIES);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>(INITIAL_MILESTONES);
  const [documents, setDocuments] = useState<ProjectDocument[]>(INITIAL_DOCUMENTS);
  const [activities, setActivities] = useState<ActivityEvent[]>(INITIAL_ACTIVITIES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Nouveaux modules : Invitations, Forum, Abonnements
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>(INITIAL_INVITATIONS);
  const [forumTopics, setForumTopics] = useState<ForumTopic[]>(INITIAL_FORUM_TOPICS);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(INITIAL_FORUM_POSTS);
  const [subscription, setSubscription] = useState<WorkspaceSubscription>(INITIAL_SUBSCRIPTION);
  const [plans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);

  // Nouveaux modules : Finance, Temps, Sprints, Wiki, Risques, Partages
  const [expenses, setExpenses] = useState<ProjectExpense[]>(INITIAL_EXPENSES);
  const [budgets, setBudgets] = useState<ProjectBudget[]>(INITIAL_BUDGETS);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(INITIAL_TIME_ENTRIES);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>(INITIAL_SPRINTS);
  const [wikiPages, setWikiPages] = useState<WikiPage[]>(INITIAL_WIKI_PAGES);
  const [risks, setRisks] = useState<ProjectRisk[]>(INITIAL_RISKS);
  const [shares, setShares] = useState<ProjectShare[]>([]);

  // Navigation & Sélection - Initialisation dynamique au premier projet
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [activeProjectId, setActiveProjectId] = useState<string | 'all'>(INITIAL_PROJECTS[0]?.id || 'prj-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<FilterState>({
    priority: 'all',
    status: 'all',
    includeArchived: false,
  });

  // Chargement depuis localStorage côté client avec migration des anciennes clés
  useEffect(() => {
    try {
      let saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        for (const legacyKey of LEGACY_STORAGE_KEYS) {
          const legacy = localStorage.getItem(legacyKey);
          if (legacy) {
            saved = legacy;
            break;
          }
        }
      }

      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.projects) setProjects(parsed.projects);
        if (parsed.phases) setPhases(parsed.phases);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.dependencies) setDependencies(parsed.dependencies);
        if (parsed.milestones) setMilestones(parsed.milestones);
        if (parsed.documents) setDocuments(parsed.documents);
        if (parsed.activities) setActivities(parsed.activities);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.users) setUsers(parsed.users);
        if (parsed.invitations) setInvitations(parsed.invitations);
        if (parsed.forumTopics) setForumTopics(parsed.forumTopics);
        if (parsed.forumPosts) setForumPosts(parsed.forumPosts);
        if (parsed.subscription) setSubscription(parsed.subscription);
        if (parsed.activeProjectId) setActiveProjectId(parsed.activeProjectId);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.budgets) setBudgets(parsed.budgets);
        if (parsed.timeEntries) setTimeEntries(parsed.timeEntries);
        if (parsed.activeTimer) setActiveTimer(parsed.activeTimer);
        if (parsed.sprints) setSprints(parsed.sprints);
        if (parsed.wikiPages) setWikiPages(parsed.wikiPages);
        if (parsed.risks) setRisks(parsed.risks);
        if (parsed.shares) setShares(parsed.shares);
      }
    } catch {
      // Ignorer les erreurs de parsing localStorage
    }

    // Initialisation et migration IndexedDB Dexie
    initializeAndMigrateDatabase().catch(console.error);
  }, []);

  // Sauvegarde automatique exhaustive lors des mutations (localStorage + Dexie)
  const persistState = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        projects,
        phases,
        tasks,
        dependencies,
        milestones,
        documents,
        activities,
        notifications,
        users,
        invitations,
        forumTopics,
        forumPosts,
        subscription,
        activeProjectId,
        expenses,
        budgets,
        timeEntries,
        activeTimer,
        sprints,
        wikiPages,
        risks,
        shares,
      }));
    } catch {
      // Fallback si quota dépassé
    }

    // Persistance asynchrone sécurisée dans IndexedDB Dexie
    if (typeof window !== 'undefined') {
      db.transaction('rw', [
        db.projects, db.phases, db.tasks, db.dependencies,
        db.milestones, db.documents, db.expenses, db.timeEntries,
        db.sprints, db.wikiPages, db.risks, db.shares
      ], async () => {
        await db.projects.clear();
        if (projects.length > 0) await db.projects.bulkPut(projects);
        await db.phases.clear();
        if (phases.length > 0) await db.phases.bulkPut(phases);
        await db.tasks.clear();
        if (tasks.length > 0) await db.tasks.bulkPut(tasks);
        await db.dependencies.clear();
        if (dependencies.length > 0) await db.dependencies.bulkPut(dependencies);
        await db.milestones.clear();
        if (milestones.length > 0) await db.milestones.bulkPut(milestones);
        await db.documents.clear();
        if (documents.length > 0) await db.documents.bulkPut(documents);
        await db.expenses.clear();
        if (expenses.length > 0) await db.expenses.bulkPut(expenses);
        await db.timeEntries.clear();
        if (timeEntries.length > 0) await db.timeEntries.bulkPut(timeEntries);
        await db.sprints.clear();
        if (sprints.length > 0) await db.sprints.bulkPut(sprints);
        await db.wikiPages.clear();
        if (wikiPages.length > 0) await db.wikiPages.bulkPut(wikiPages);
        await db.risks.clear();
        if (risks.length > 0) await db.risks.bulkPut(risks);
        await db.shares.clear();
        if (shares.length > 0) await db.shares.bulkPut(shares);
      }).catch(err => {
        console.warn('Synchronisation Dexie:', err);
      });
    }
  }, [
    projects, phases, tasks, dependencies, milestones, documents,
    activities, notifications, users, invitations, forumTopics,
    forumPosts, subscription, activeProjectId, expenses, budgets,
    timeEntries, activeTimer, sprints, wikiPages, risks, shares
  ]);

  useEffect(() => {
    persistState();
  }, [persistState]);

  const resetFilters = useCallback(() => {
    setFilters({
      priority: 'all',
      status: 'all',
      includeArchived: false,
      memberId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setSearchQuery('');
  }, []);

  // Projet actif courant
  const currentProject = useMemo(() => {
    if (activeProjectId === 'all') return null;
    return projects.find(p => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  // Filtrage des tâches
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Périmètre projet
      if (activeProjectId !== 'all' && t.projectId !== activeProjectId) {
        return false;
      }
      // Recherche
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchLabels = t.labels.some(l => l.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchLabels) return false;
      }
      // Filtre intervenant
      if (filters.memberId && t.assigneeId !== filters.memberId) {
        return false;
      }
      // Filtre priorité
      if (filters.priority && filters.priority !== 'all' && t.priority !== filters.priority) {
        return false;
      }
      // Filtre statut
      if (filters.status && filters.status !== 'all' && t.status !== filters.status) {
        return false;
      }
      // Filtre date début
      if (filters.startDate && t.startDate && t.startDate < filters.startDate) {
        return false;
      }
      // Filtre date fin / échéance
      if (filters.endDate && t.dueDate && t.dueDate > filters.endDate) {
        return false;
      }
      return true;
    });
  }, [tasks, activeProjectId, searchQuery, filters]);

  // Calcul des quotas et limites
  const currentPlan = useMemo(() => {
    return plans.find(p => p.code === subscription.planCode) || plans[0];
  }, [plans, subscription.planCode]);

  const activeProjectsCount = useMemo(() => {
    return projects.filter(p => p.status === 'active').length;
  }, [projects]);

  const quotas = useMemo(() => {
    return {
      activeProjects: {
        used: activeProjectsCount,
        max: currentPlan.maxProjects,
      },
      members: {
        used: users.length,
        max: currentPlan.maxMembers,
      },
      storage: {
        usedMb: subscription.storageUsedMb,
        maxMb: currentPlan.maxStorageMb,
      },
    };
  }, [activeProjectsCount, currentPlan, users.length, subscription.storageUsedMb]);

  const checkQuota = useCallback((type: 'project' | 'member' | 'storage'): { allowed: boolean; message?: string } => {
    const nextPlan = currentPlan.code === 'discovery' ? 'Premium ou Entreprise' : 'Entreprise (Team)';
    if (type === 'project') {
      if (quotas.activeProjects.used >= quotas.activeProjects.max) {
        return {
          allowed: false,
          message: `Limite de projets actifs atteinte (${quotas.activeProjects.used}/${quotas.activeProjects.max}) pour le forfait ${currentPlan.name}. Passez au forfait ${nextPlan} pour créer des projets sans limite.`,
        };
      }
    } else if (type === 'member') {
      if (quotas.members.used >= quotas.members.max) {
        return {
          allowed: false,
          message: `Limite de collaborateurs atteinte (${quotas.members.used}/${quotas.members.max}) pour le forfait ${currentPlan.name}. Passez au forfait ${nextPlan} pour inviter d’autres membres.`,
        };
      }
    } else if (type === 'storage') {
      if (quotas.storage.usedMb >= quotas.storage.maxMb) {
        return {
          allowed: false,
          message: `Espace de stockage saturé (${quotas.storage.usedMb}/${quotas.storage.maxMb} Mo). Passez au forfait ${nextPlan} pour débloquer davantage d’espace.`,
        };
      }
    }
    return { allowed: true };
  }, [quotas, currentPlan]);

  // Calculs réels dynamiques
  const metrics = useMemo(() => {
    const list = filteredTasks;
    const total = list.length;
    const inProgress = list.filter(t => t.status === 'in_progress').length;
    const completed = list.filter(t => t.status === 'done').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const overdue = list.filter(t => isDateOverdue(t.dueDate, t.status)).length;
    const upcoming = list.filter(t => isDateUpcoming(t.dueDate, t.status)).length;
    const todayCount = list.filter(t => isDateToday(t.dueDate) || isDateToday(t.startDate)).length;
    const openTasksCount = list.filter(t => t.status !== 'done').length;
    const upcoming7DaysCount = list.filter(t => t.dueDate && isDateUpcoming(t.dueDate, t.status)).length;

    // Calcul de l'avancement moyen des projets
    const activePrjs = projects.filter(p => p.status === 'active');
    let avgProgress = 0;
    if (activePrjs.length > 0) {
      const sumProgress = activePrjs.reduce((acc, p) => {
        const prjTasks = tasks.filter(t => t.projectId === p.id);
        if (prjTasks.length === 0) return acc;
        const done = prjTasks.filter(t => t.status === 'done').length;
        return acc + Math.round((done / prjTasks.length) * 100);
      }, 0);
      avgProgress = Math.round(sumProgress / activePrjs.length);
    }

    return { 
      total, 
      inProgress, 
      completed, 
      completionRate, 
      overdue, 
      upcoming, 
      todayCount,
      activeProjectsCount,
      openTasksCount,
      upcoming7DaysCount,
      averageProjectProgress: avgProgress
    };
  }, [filteredTasks, activeProjectsCount, projects, tasks]);

  // Liste de l'avancement réel de chaque projet
  const projectsProgressList = useMemo(() => {
    return projects.map(p => {
      const prjTasks = tasks.filter(t => t.projectId === p.id);
      const totalTasks = prjTasks.length;
      const completedTasks = prjTasks.filter(t => t.status === 'done').length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      return {
        project: p,
        totalTasks,
        completedTasks,
        progressPercentage,
      };
    });
  }, [projects, tasks]);

  // Données historiques réelles des créations et complétions sur 7 jours glissants
  const historicalStats = useMemo(() => {
    const today = new Date();
    const frenchShortMonths = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const days: Array<{ label: string; dateStr: string }> = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const label = `${d.getDate()} ${frenchShortMonths[d.getMonth()]}`;
      days.push({ label, dateStr });
    }

    return days.map(d => {
      const created = filteredTasks.filter(t => t.createdAt && t.createdAt.startsWith(d.dateStr)).length;
      const completed = filteredTasks.filter(t => t.completedAt && t.completedAt.startsWith(d.dateStr)).length;
      return {
        period: d.label,
        created,
        completed,
      };
    });
  }, [filteredTasks]);

  // Répartition des tâches par statut
  const statusBreakdown = useMemo(() => {
    const list = filteredTasks;
    const todoCount = list.filter(t => t.status === 'todo').length;
    const inProgCount = list.filter(t => t.status === 'in_progress').length;
    const inRevCount = list.filter(t => t.status === 'in_review').length;
    const doneCount = list.filter(t => t.status === 'done').length;
    return [
      { status: 'todo' as TaskStatus, label: 'À faire', count: todoCount, color: '#667085' },
      { status: 'in_progress' as TaskStatus, label: 'En cours', count: inProgCount, color: '#3478C8' },
      { status: 'in_review' as TaskStatus, label: 'En revue', count: inRevCount, color: '#D69A24' },
      { status: 'done' as TaskStatus, label: 'Terminé', count: doneCount, color: '#23845B' },
    ];
  }, [filteredTasks]);

  // Colonnes du Tableau de suivi (section 29-31 de la spécification)
  // Règle de classification stricte :
  // 1. Terminé : status === 'done'
  // 2. En retard : non terminé + échéance passée (dueDate < today)
  // 3. En cours : status === 'in_progress' ET non en retard
  // 4. À venir : tout le reste (status !== 'done' et non en retard)
  const trackingColumns = useMemo(() => {
    const completed: Task[] = [];
    const overdue: Task[] = [];
    const inProgress: Task[] = [];
    const upcoming: Task[] = [];

    for (const task of filteredTasks) {
      if (task.status === 'done') {
        completed.push(task);
      } else if (isDateOverdue(task.dueDate, task.status)) {
        overdue.push(task);
      } else if (task.status === 'in_progress') {
        inProgress.push(task);
      } else {
        upcoming.push(task);
      }
    }

    return { completed, overdue, inProgress, upcoming };
  }, [filteredTasks]);

  // Charge de travail d'équipe réelle (section 11)
  const workload = useMemo(() => {
    return users.map(user => {
      const assigned = filteredTasks.filter(t => t.assigneeId === user.id && t.status !== 'done');
      const totalMinutes = assigned.reduce((acc, t) => acc + (t.estimateMinutes || 0), 0);
      const capacityMinutes = user.weeklyCapacityMinutes || 2100;
      const loadPercentage = capacityMinutes > 0 ? Math.round((totalMinutes / capacityMinutes) * 100) : 0;
      const overdueCount = assigned.filter(t => isDateOverdue(t.dueDate, t.status)).length;

      return {
        user,
        assignedTasks: assigned,
        overdueCount,
        totalMinutes,
        capacityMinutes,
        loadPercentage,
        isOverloaded: loadPercentage > 100,
      };
    });
  }, [users, filteredTasks]);

  // Répartition des priorités réelle (section 12)
  const priorityDistribution = useMemo(() => {
    const total = filteredTasks.length;
    const urgentCount = filteredTasks.filter(t => t.priority === 'urgent').length;
    const highCount = filteredTasks.filter(t => t.priority === 'high').length;
    const mediumCount = filteredTasks.filter(t => t.priority === 'medium').length;
    const lowCount = filteredTasks.filter(t => t.priority === 'low').length;

    return {
      urgent: { count: urgentCount, percentage: total > 0 ? Math.round((urgentCount / total) * 100) : 0 },
      high: { count: highCount, percentage: total > 0 ? Math.round((highCount / total) * 100) : 0 },
      medium: { count: mediumCount, percentage: total > 0 ? Math.round((mediumCount / total) * 100) : 0 },
      low: { count: lowCount, percentage: total > 0 ? Math.round((lowCount / total) * 100) : 0 },
      total,
    };
  }, [filteredTasks]);

  // Logger d'activité interne
  const logActivity = useCallback((
    actionType: ActivityEvent['actionType'], 
    description: string, 
    taskId?: string, 
    projectId?: string
  ) => {
    const newAct: ActivityEvent = {
      id: generateId('act'),
      workspaceId: workspace.id,
      projectId: projectId || (activeProjectId !== 'all' ? activeProjectId : undefined),
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      actionType,
      description,
      createdAt: new Date().toISOString(),
    };
    setActivities(prev => [newAct, ...prev].slice(0, 200));
  }, [workspace.id, activeProjectId, currentUser]);

  // Gestion des notifications
  const addNotification = useCallback((title: string, message: string, category: NotificationItem['category']) => {
    const newNotif: NotificationItem = {
      id: generateId('notif'),
      userId: currentUser.id,
      title,
      message,
      category,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, [currentUser.id]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // CRUD Tâches
  const createTask = useCallback((data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId' | 'order'>): Task => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...data,
      id: generateId('tsk'),
      workspaceId: workspace.id,
      order: tasks.length + 1,
      createdAt: now,
      updatedAt: now,
      completedAt: data.status === 'done' ? now : undefined,
    };
    setTasks(prev => [newTask, ...prev]);
    logActivity('task_created', `a créé la tâche « ${newTask.title} »`, newTask.id, newTask.projectId);
    addNotification('Nouvelle tâche', `La tâche « ${newTask.title} » a été enregistrée avec succès.`, 'task');
    return newTask;
  }, [workspace.id, tasks.length, logActivity, addNotification]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    let oldTask: Task | undefined;
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      oldTask = t;
      const now = new Date().toISOString();
      const updated = { ...t, ...updates, updatedAt: now };
      if (updates.status === 'done' && t.status !== 'done') {
        updated.completedAt = now;
      } else if (updates.status && updates.status !== 'done') {
        updated.completedAt = undefined;
      }
      return updated;
    }));

    if (oldTask) {
      const prevTask = oldTask as Task;
      let desc = `a mis à jour la tâche « ${prevTask.title} »`;
      if (updates.status && updates.status !== prevTask.status) {
        const labels: Record<TaskStatus, string> = {
          todo: 'À faire',
          in_progress: 'En cours',
          in_review: 'En revue',
          done: 'Terminé',
        };
        desc = `a passé le statut de « ${prevTask.title} » de « ${labels[prevTask.status]} » à « ${labels[updates.status]} »`;
      } else if (updates.dueDate && updates.dueDate !== prevTask.dueDate) {
        desc = `a modifié l’échéance de « ${prevTask.title} » au ${updates.dueDate}`;
      } else if (updates.title && updates.title !== prevTask.title) {
        desc = `a renommé la tâche « ${prevTask.title} » en « ${updates.title} »`;
      }
      logActivity('task_updated', desc, id, prevTask.projectId);
    }
  }, [logActivity]);

  const deleteTask = useCallback((id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    setDependencies(prev => prev.filter(d => d.predecessorTaskId !== id && d.successorTaskId !== id));
    logActivity('task_updated', `a supprimé la tâche « ${taskToDelete.title} »`, undefined, taskToDelete.projectId);
  }, [tasks, logActivity]);

  const moveTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const statusLabels: Record<TaskStatus, string> = {
      todo: 'À faire',
      in_progress: 'En cours',
      in_review: 'En revue',
      done: 'Terminé',
    };

    const now = new Date().toISOString();
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        status: newStatus,
        updatedAt: now,
        completedAt: newStatus === 'done' ? now : undefined,
      };
    }));

    logActivity('task_status_changed', `a déplacé « ${task.title} » vers ${statusLabels[newStatus]}`, taskId, task.projectId);
  }, [tasks, logActivity]);

  const toggleChecklistItem = useCallback((taskId: string, itemId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const updatedChecklist = t.checklist.map(c => c.id === itemId ? { ...c, isCompleted: !c.isCompleted } : c);
      return {
        ...t,
        checklist: updatedChecklist,
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const addChecklistItem = useCallback((taskId: string, title: string) => {
    if (!title.trim()) return;
    const newItem: ChecklistItem = {
      id: generateId('chk'),
      title: title.trim(),
      isCompleted: false,
    };
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        checklist: [...t.checklist, newItem],
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  // CRUD Projets avec vérification de quota
  const createProject = useCallback((data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId'>): { success: boolean; project?: Project; error?: string } => {
    const quotaCheck = checkQuota('project');
    if (!quotaCheck.allowed) {
      addNotification('Quota atteint', quotaCheck.message || 'Limite de projets atteinte.', 'system');
      return { success: false, error: quotaCheck.message };
    }
    const now = new Date().toISOString();
    const newProject: Project = {
      ...data,
      id: generateId('prj'),
      workspaceId: workspace.id,
      createdAt: now,
      updatedAt: now,
    };
    setProjects(prev => [newProject, ...prev]);
    logActivity('project_created', `a créé le projet « ${newProject.name} »`, undefined, newProject.id);
    addNotification('Nouveau projet', `Le projet « ${newProject.name} » est maintenant configuré.`, 'project');
    return { success: true, project: newProject };
  }, [workspace.id, logActivity, addNotification, checkQuota]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
    logActivity('project_updated', `a mis à jour les paramètres du projet`, undefined, id);
  }, [logActivity]);

  // Actions Membres & Invitations
  const createInvitation = useCallback((email: string, role: WorkspaceRole, projectId?: string): { success: boolean; error?: string } => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Veuillez saisir une adresse email valide.' };
    }
    const quotaCheck = checkQuota('member');
    if (!quotaCheck.allowed) {
      addNotification('Limite atteinte', quotaCheck.message || 'Quota d’invitations atteint.', 'system');
      return { success: false, error: quotaCheck.message };
    }
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours
    const newInv: WorkspaceInvitation = {
      id: generateId('inv'),
      workspaceId: workspace.id,
      projectId,
      email: email.trim().toLowerCase(),
      role,
      status: 'pending',
      expiresAt: expires.toISOString(),
      invitedBy: currentUser.id,
      createdAt: now.toISOString(),
    };
    setInvitations(prev => [newInv, ...prev]);
    logActivity('share_updated', `a envoyé une invitation à ${newInv.email} (${role})`);
    addNotification('Invitation envoyée', `Un lien d’accès sécurisé a été généré pour ${newInv.email}.`, 'security');
    return { success: true };
  }, [workspace.id, currentUser.id, logActivity, addNotification, checkQuota]);

  const revokeInvitation = useCallback((id: string) => {
    setInvitations(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'revoked' } : inv));
    logActivity('share_updated', `a révoqué une invitation d’accès`);
    addNotification('Invitation révoquée', `L’invitation a été annulée avec succès.`, 'security');
  }, [logActivity, addNotification]);

  const acceptInvitation = useCallback((id: string) => {
    const inv = invitations.find(i => i.id === id);
    if (!inv || inv.status !== 'pending') return;
    
    // Créer un utilisateur membre
    const newUser: User = {
      id: generateId('u'),
      name: inv.email.split('@')[0].replace('.', ' '),
      email: inv.email,
      role: inv.role,
      avatar: createLocalAvatarSvg(inv.email.split('@')[0], '#0066FF', '#00D2FF'),
      jobTitle: inv.role === 'admin' ? 'Administrateur' : inv.role === 'project_manager' ? 'Chef de projet' : 'Membre collaborateur',
      weeklyCapacityMinutes: 2100,
      hourlyRate: workspace.defaultHourlyRate || 75,
    };
    setUsers(prev => [...prev, newUser]);
    setInvitations(prev => prev.map(i => i.id === id ? { ...i, status: 'accepted' } : i));
    logActivity('share_updated', `Le collaborateur ${newUser.name} a rejoint l’espace.`);
    addNotification('Nouveau membre', `${newUser.name} fait désormais partie de l’équipe.`, 'security');
  }, [invitations, workspace.defaultHourlyRate, logActivity, addNotification]);

  const removeMember = useCallback((userId: string, reassignToUserId?: string): { success: boolean; error?: string } => {
    if (userId === currentUser.id && currentUser.role === 'owner') {
      return { success: false, error: 'Le propriétaire de l’espace ne peut pas se retirer lui-même.' };
    }
    const memberToRemove = users.find(u => u.id === userId);
    if (!memberToRemove) return { success: false, error: 'Membre introuvable.' };

    // Réattribution des tâches actives du membre pour préserver l'historique
    setTasks(prev => prev.map(t => {
      if (t.assigneeId === userId) {
        return {
          ...t,
          assigneeId: reassignToUserId || undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    }));

    // Retrait de la liste d'utilisateurs
    setUsers(prev => prev.filter(u => u.id !== userId));
    logActivity('share_updated', `a retiré le collaborateur ${memberToRemove.name} de l’espace.`);
    addNotification('Membre retiré', `L’accès de ${memberToRemove.name} a été révoqué en toute sécurité.`, 'security');
    return { success: true };
  }, [currentUser, users, logActivity, addNotification]);

  const updateUserRole = useCallback((userId: string, role: WorkspaceRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    logActivity('share_updated', `a mis à jour le rôle d’un collaborateur vers ${role}.`);
    addNotification('Rôle modifié', `Les permissions ont été mises à jour.`, 'security');
  }, [logActivity, addNotification]);

  // Actions Forum
  const createForumTopic = useCallback((data: { projectId: string; title: string; body: string; category: ForumCategory }): ForumTopic => {
    const now = new Date().toISOString();
    const newTopic: ForumTopic = {
      id: generateId('topic'),
      projectId: data.projectId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      title: data.title.trim(),
      body: data.body.trim(),
      category: data.category,
      isPinned: false,
      replyCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    setForumTopics(prev => [newTopic, ...prev]);
    logActivity('comment_added', `a ouvert la discussion « ${newTopic.title} »`, undefined, data.projectId);
    addNotification('Nouveau sujet', `Une nouvelle discussion a été publiée dans le forum.`, 'project');
    return newTopic;
  }, [currentUser, logActivity, addNotification]);

  const createForumPost = useCallback((topicId: string, body: string): ForumPost => {
    const now = new Date().toISOString();
    const newPost: ForumPost = {
      id: generateId('post'),
      topicId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      body: body.trim(),
      reactions: {},
      createdAt: now,
      updatedAt: now,
    };
    setForumPosts(prev => [...prev, newPost]);
    setForumTopics(prev => prev.map(t => t.id === topicId ? { ...t, replyCount: t.replyCount + 1, updatedAt: now } : t));
    logActivity('comment_added', `a répondu dans une discussion du projet.`);
    return newPost;
  }, [currentUser, logActivity]);

  const toggleTopicPin = useCallback((topicId: string) => {
    setForumTopics(prev => prev.map(t => t.id === topicId ? { ...t, isPinned: !t.isPinned } : t));
  }, []);

  const markPostAsSolution = useCallback((topicId: string, postId: string) => {
    setForumTopics(prev => prev.map(t => t.id === topicId ? { ...t, solutionPostId: postId } : t));
    setForumPosts(prev => prev.map(p => p.id === postId ? { ...p, isSolution: true } : (p.topicId === topicId ? { ...p, isSolution: false } : p)));
    addNotification('Solution validée', `Une réponse a été marquée comme solution officielle.`, 'project');
  }, [addNotification]);

  const addReactionToPost = useCallback((postId: string, emoji: string) => {
    setForumPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      const reactions = { ...post.reactions };
      const userList = reactions[emoji] || [];
      if (userList.includes(currentUser.id)) {
        reactions[emoji] = userList.filter(id => id !== currentUser.id);
      } else {
        reactions[emoji] = [...userList, currentUser.id];
      }
      return { ...post, reactions };
    }));
  }, [currentUser.id]);

  const deleteForumTopic = useCallback((topicId: string) => {
    setForumTopics(prev => prev.filter(t => t.id !== topicId));
    setForumPosts(prev => prev.filter(p => p.topicId !== topicId));
    logActivity('comment_added', `a supprimé un sujet du forum.`);
  }, [logActivity]);

  // CRUD Phases
  const createPhase = useCallback((data: Omit<ProjectPhase, 'id'>): ProjectPhase => {
    const newPhase: ProjectPhase = {
      ...data,
      id: generateId('phase'),
    };
    setPhases(prev => [...prev, newPhase]);
    return newPhase;
  }, []);

  const updatePhase = useCallback((id: string, updates: Partial<ProjectPhase>) => {
    setPhases(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePhase = useCallback((id: string) => {
    setPhases(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.map(t => t.phaseId === id ? { ...t, phaseId: undefined } : t));
  }, []);

  // Dépendances strictes anti-cycle via le domaine métier pur (B1: pas d'ID en dur)
  const addDependency = useCallback((predId: string, succId: string): { success: boolean; error?: string } => {
    if (predId === succId) {
      return { success: false, error: 'Une tâche ne peut pas dépendre d’elle-même.' };
    }

    const exists = dependencies.some(d => d.predecessorTaskId === predId && d.successorTaskId === succId);
    if (exists) {
      return { success: false, error: 'Cette dépendance existe déjà.' };
    }

    if (wouldCreateDependencyCycle(dependencies, predId, succId)) {
      return { 
        success: false, 
        error: 'Dépendance refusée : cet enchaînement créerait une boucle circulaire interdite.' 
      };
    }

    const fallbackProjectId = projects[0]?.id || INITIAL_PROJECTS[0]?.id || 'prj-1';
    const newDep: TaskDependency = {
      id: generateId('dep'),
      projectId: activeProjectId !== 'all' ? activeProjectId : fallbackProjectId,
      predecessorTaskId: predId,
      successorTaskId: succId,
      dependencyType: 'finish_to_start',
      createdAt: new Date().toISOString(),
    };

    setDependencies(prev => [...prev, newDep]);
    logActivity('dependency_added', `a lié deux tâches dans le diagramme de Gantt`);
    return { success: true };
  }, [dependencies, activeProjectId, projects, logActivity]);

  const deleteDependency = useCallback((id: string) => {
    setDependencies(prev => prev.filter(d => d.id !== id));
  }, []);

  // Import de tâches CSV (B1: pas d'ID en dur, B12: IDs uniques)
  const importTasksFromCSV = useCallback((tasksData: Partial<Task>[]): { imported: number; errors: string[] } => {
    const errors: string[] = [];
    const validTasks: Task[] = [];
    const now = new Date().toISOString();
    const fallbackProjectId = projects[0]?.id || INITIAL_PROJECTS[0]?.id || 'prj-1';

    tasksData.forEach((row, idx) => {
      const lineNum = idx + 1;
      if (!row.title || !row.title.trim()) {
        errors.push(`Ligne ${lineNum} : Le titre de la tâche est obligatoire.`);
        return;
      }

      const newTask: Task = {
        id: generateId(`tsk-imp-${idx}`),
        workspaceId: workspace.id,
        projectId: row.projectId || (activeProjectId !== 'all' ? activeProjectId : fallbackProjectId),
        phaseId: row.phaseId,
        title: row.title.trim(),
        description: row.description || '',
        status: (['todo', 'in_progress', 'in_review', 'done'].includes(row.status as string)) ? (row.status as TaskStatus) : 'todo',
        priority: (['urgent', 'high', 'medium', 'low'].includes(row.priority as string)) ? (row.priority as TaskPriority) : 'medium',
        assigneeId: row.assigneeId,
        startDate: row.startDate,
        dueDate: row.dueDate,
        estimateMinutes: row.estimateMinutes || 120,
        labels: row.labels || ['Import CSV'],
        checklist: row.checklist || [],
        order: tasks.length + idx + 1,
        createdAt: now,
        updatedAt: now,
      };
      validTasks.push(newTask);
    });

    if (validTasks.length > 0) {
      setTasks(prev => [...validTasks, ...prev]);
      logActivity('task_created', `a importé ${validTasks.length} tâche(s) par fichier CSV.`);
      addNotification('Import réussi', `${validTasks.length} tâche(s) ont été intégrées dans le projet.`, 'task');
    }

    return { imported: validTasks.length, errors };
  }, [workspace.id, activeProjectId, projects, tasks.length, logActivity, addNotification]);

  // Réinitialisation aux données d'origine (B4: tous les domaines, aucune clé résiduelle)
  const resetToFactoryData = useCallback(() => {
    setProjects(INITIAL_PROJECTS);
    setPhases(INITIAL_PHASES);
    setTasks(INITIAL_TASKS);
    setDependencies(INITIAL_DEPENDENCIES);
    setMilestones(INITIAL_MILESTONES);
    setDocuments(INITIAL_DOCUMENTS);
    setActivities(INITIAL_ACTIVITIES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setInvitations(INITIAL_INVITATIONS);
    setForumTopics(INITIAL_FORUM_TOPICS);
    setForumPosts(INITIAL_FORUM_POSTS);
    setSubscription(INITIAL_SUBSCRIPTION);
    setExpenses(INITIAL_EXPENSES);
    setBudgets(INITIAL_BUDGETS);
    setTimeEntries(INITIAL_TIME_ENTRIES);
    setActiveTimer(null);
    setSprints(INITIAL_SPRINTS);
    setWikiPages(INITIAL_WIKI_PAGES);
    setRisks(INITIAL_RISKS);
    setShares([]);
    setActiveProjectId(INITIAL_PROJECTS[0]?.id || 'prj-1');
    resetFilters();
    try {
      localStorage.removeItem(STORAGE_KEY);
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        localStorage.removeItem(legacyKey);
      }
    } catch {
      // Ignorer
    }
  }, [resetFilters]);

  // Actions Abonnements
  const upgradePlan = useCallback((planCode: 'discovery' | 'premium' | 'team') => {
    setSubscription(prev => ({
      ...prev,
      planCode,
      status: 'active',
    }));
    const targetPlan = plans.find(p => p.code === planCode);
    logActivity('share_updated', `a mis à niveau l’abonnement vers ${targetPlan?.name || planCode}.`);
    addNotification('Abonnement activé', `Félicitations ! Votre forfait ${targetPlan?.name} est maintenant actif.`, 'system');
  }, [plans, logActivity, addNotification]);

  // 1. Actions Finance
  const addExpense = useCallback((data: Omit<ProjectExpense, 'id'>) => {
    const newExp: ProjectExpense = {
      ...data,
      id: generateId('exp'),
    };
    setExpenses(prev => [newExp, ...prev]);
    logActivity('task_updated', `a ajouté une dépense de ${data.amount}€ (${data.title}).`);
    return newExp;
  }, [logActivity]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const updateBudget = useCallback((projectId: string, targetBudget: number) => {
    const curr = workspace.currency || '€';
    setBudgets(prev => {
      const idx = prev.findIndex(b => b.projectId === projectId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], targetBudget };
        return next;
      }
      return [...prev, { projectId, targetBudget, currency: curr }];
    });
  }, [workspace.currency]);

  // 2. Actions Suivi du Temps (B7: Taux horaire dynamique)
  const startTimer = useCallback((projectId: string, taskId?: string, description?: string) => {
    setActiveTimer({
      projectId,
      taskId,
      startedAt: new Date().toISOString(),
      description: description || 'Session de travail active',
    });
    addNotification('Chronomètre démarré', 'Votre temps est actuellement décompté en direct.', 'task');
  }, [addNotification]);

  const stopTimer = useCallback(() => {
    if (!activeTimer) return null;
    const diffMs = Date.now() - new Date(activeTimer.startedAt).getTime();
    const durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    const currentRate = currentUser.hourlyRate || workspace.defaultHourlyRate || 75;
    const entry: TimeEntry = {
      id: generateId('time'),
      projectId: activeTimer.projectId,
      taskId: activeTimer.taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      description: activeTimer.description,
      durationMinutes,
      date: getTodayDateString(),
      hourlyRate: currentRate,
      createdAt: new Date().toISOString(),
    };
    setTimeEntries(prev => [entry, ...prev]);
    setActiveTimer(null);
    addNotification('Temps enregistré', `${durationMinutes} min comptabilisées pour votre projet.`, 'task');
    return entry;
  }, [activeTimer, currentUser, workspace.defaultHourlyRate, addNotification]);

  const addTimeEntry = useCallback((entry: Omit<TimeEntry, 'id' | 'createdAt'>) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: generateId('time'),
      createdAt: new Date().toISOString(),
    };
    setTimeEntries(prev => [newEntry, ...prev]);
    return newEntry;
  }, []);

  const deleteTimeEntry = useCallback((id: string) => {
    setTimeEntries(prev => prev.filter(t => t.id !== id));
  }, []);

  // 3. Actions Sprints
  const createSprint = useCallback((data: Omit<Sprint, 'id'>) => {
    const newSprint: Sprint = {
      ...data,
      id: generateId('sprint'),
    };
    setSprints(prev => [...prev, newSprint]);
    return newSprint;
  }, []);

  const updateSprintStatus = useCallback((id: string, status: Sprint['status']) => {
    setSprints(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  }, []);

  const addTasksToSprint = useCallback((sprintId: string, taskIds: string[]) => {
    setSprints(prev => prev.map(s => s.id === sprintId ? { ...s, taskIds: Array.from(new Set([...s.taskIds, ...taskIds])) } : s));
  }, []);

  // 4. Actions Wiki
  const createWikiPage = useCallback((data: Omit<WikiPage, 'id' | 'updatedAt'>) => {
    const newPage: WikiPage = {
      ...data,
      id: generateId('wiki'),
      updatedAt: new Date().toISOString(),
    };
    setWikiPages(prev => [newPage, ...prev]);
    return newPage;
  }, []);

  const updateWikiPage = useCallback((id: string, updates: Partial<WikiPage>) => {
    setWikiPages(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
  }, []);

  const deleteWikiPage = useCallback((id: string) => {
    setWikiPages(prev => prev.filter(p => p.id !== id));
  }, []);

  // 5. Actions Risques
  const createRisk = useCallback((data: Omit<ProjectRisk, 'id' | 'createdAt'>) => {
    const newRisk: ProjectRisk = {
      ...data,
      id: generateId('risk'),
      createdAt: new Date().toISOString(),
    };
    setRisks(prev => [newRisk, ...prev]);
    return newRisk;
  }, []);

  const updateRiskStatus = useCallback((id: string, status: ProjectRisk['status']) => {
    setRisks(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }, []);

  const deleteRisk = useCallback((id: string) => {
    setRisks(prev => prev.filter(r => r.id !== id));
  }, []);

  // 6. Actions Partages de Projet (B8)
  const addProjectShare = useCallback((projectId: string, email: string, permission: 'view' | 'edit'): ProjectShare => {
    const token = generateId('tok');
    const newShare: ProjectShare = {
      id: generateId('sh'),
      projectId,
      sharedWithEmail: email.trim().toLowerCase(),
      permission,
      token,
      createdAt: new Date().toISOString(),
    };
    setShares(prev => [...prev, newShare]);
    logActivity('share_updated', `a accordé un accès (${permission === 'edit' ? 'Modification' : 'Lecture seule'}) à ${newShare.sharedWithEmail}`, undefined, projectId);
    addNotification('Partage activé', `Accès sécurisé généré pour ${newShare.sharedWithEmail}.`, 'project');
    return newShare;
  }, [logActivity, addNotification]);

  const revokeProjectShare = useCallback((id: string) => {
    const share = shares.find(s => s.id === id);
    setShares(prev => prev.filter(s => s.id !== id));
    if (share) {
      logActivity('share_updated', `a révoqué l’accès de ${share.sharedWithEmail}`, undefined, share.projectId);
      addNotification('Partage révoqué', `Accès retiré pour ${share.sharedWithEmail}.`, 'security');
    }
  }, [shares, logActivity, addNotification]);

  return (
    <SentinelContext.Provider value={{
      workspace,
      users,
      projects,
      phases,
      tasks,
      dependencies,
      milestones,
      documents,
      activities,
      notifications,
      
      invitations,
      forumTopics,
      forumPosts,
      subscription,
      plans,
      quotas,

      // Nouveaux modules
      expenses,
      budgets,
      addExpense,
      deleteExpense,
      updateBudget,

      timeEntries,
      activeTimer,
      startTimer,
      stopTimer,
      addTimeEntry,
      deleteTimeEntry,

      sprints,
      createSprint,
      updateSprintStatus,
      addTasksToSprint,

      wikiPages,
      createWikiPage,
      updateWikiPage,
      deleteWikiPage,

      risks,
      createRisk,
      updateRiskStatus,
      deleteRisk,

      // Partages
      shares,
      addProjectShare,
      revokeProjectShare,

      activeView,
      setActiveView,
      activeProjectId,
      setActiveProjectId,
      currentUser,
      setCurrentUser,

      searchQuery,
      setSearchQuery,
      filters,
      setFilters,
      resetFilters,

      currentProject,
      filteredTasks,
      metrics,
      historicalStats,
      projectsProgressList,
      statusBreakdown,
      trackingColumns,
      workload,
      priorityDistribution,

      createTask,
      updateTask,
      deleteTask,
      moveTaskStatus,
      toggleChecklistItem,
      addChecklistItem,

      createProject,
      updateProject,
      createPhase,
      updatePhase,
      deletePhase,

      addDependency,
      deleteDependency,

      markNotificationAsRead,
      markAllNotificationsAsRead,
      addNotification,

      createInvitation,
      revokeInvitation,
      acceptInvitation,
      removeMember,
      updateUserRole,

      createForumTopic,
      createForumPost,
      toggleTopicPin,
      markPostAsSolution,
      addReactionToPost,
      deleteForumTopic,

      upgradePlan,
      checkQuota,

      importTasksFromCSV,
      resetToFactoryData,
    }}>
      {children}
    </SentinelContext.Provider>
  );
}

export function useSentinel() {
  const context = useContext(SentinelContext);
  if (!context) {
    throw new Error('useSentinel doit être utilisé au sein d’un SentinelProvider');
  }
  return context;
}
