/**
 * SENTINEL GESTION
 * Modèle de données TypeScript strict et complet
 * Conforme au cahier des charges et architecture SENTINEL GESTION.
 */

export type WorkspaceRole = 'super_admin' | 'owner' | 'admin' | 'project_manager' | 'member' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  avatar: string;
  jobTitle: string;
  weeklyCapacityMinutes: number; // ex: 35h = 2100 minutes
  hourlyRate?: number; // Taux horaire individuel (ex: 75 €/h)
  assignedProjectId?: string;
  isSuperAdmin?: boolean;
  password?: string;
}

export type ProjectTier = 'standard' | 'pro' | 'premium';
export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'archived';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type ProjectPriority = TaskPriority;
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';

export interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  description: string;
  order: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  iconKey?: string;
  colorKey?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  workspaceId: string;
  projectId: string;
  phaseId?: string;
  parentTaskId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeIds?: string[];
  watcherIds?: string[];
  startDate?: string; // YYYY-MM-DD
  dueDate?: string;   // YYYY-MM-DD
  completedAt?: string; // ISO string
  estimateMinutes: number;
  actualMinutes?: number;
  storyPoints?: number; // Suite de Fibonacci : 1, 2, 3, 5, 8, 13
  labels: string[];
  checklist: ChecklistItem[];
  recurrence?: { rule: string; endsAt?: string };
  customFieldValues?: Record<string, unknown>;
  attachments?: Attachment[];
  blockedReason?: string;
  order: number;
  version?: number;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type DependencyType = 
  | 'finish_to_start' 
  | 'start_to_start' 
  | 'finish_to_finish' 
  | 'start_to_finish';

export interface TaskDependency {
  id: string;
  projectId: string;
  predecessorTaskId: string;
  successorTaskId: string;
  dependencyType: DependencyType;
  lagMinutes?: number;
  createdAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  dueDate: string;
  status: 'planned' | 'reached' | 'late';
  description?: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  category: string;
  content: string;
  authorName: string;
  updatedAt: string;
  tags: string[];
}

export interface ProjectShare {
  id: string;
  projectId: string;
  sharedWithEmail: string;
  permission: 'view' | 'edit';
  token?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  reference: string;
  description: string;
  status: ProjectStatus;
  priority: TaskPriority;
  iconKey: string;
  colorKey: string;
  startDate: string;
  dueDate: string;
  leadUserId: string;
  memberIds: string[];
  githubRepoUrl?: string;
  tags: string[];
  tier?: ProjectTier;
  allocatedHours?: number;
  budget?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  workspaceId: string;
  projectId?: string;
  taskId?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  actionType: 
    | 'task_created' 
    | 'task_status_changed' 
    | 'task_completed' 
    | 'task_updated'
    | 'project_created' 
    | 'project_updated' 
    | 'dependency_added' 
    | 'comment_added' 
    | 'share_updated';
  description: string;
  createdAt: string; // ISO string
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: 'task' | 'project' | 'security' | 'system';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  iconKey: string;
  colorKey: string;
  locale?: 'fr-FR' | 'en-GB' | string;
  currency?: string;
  defaultHourlyRate?: number;
  timezone?: string;
  workingDays?: number[]; // 1..7 (1 = Lundi, 5 = Vendredi)
  workingHours?: { start: string; end: string };
  holidays?: { date: string; label: string }[];
  terminology?: Partial<Record<'project' | 'task' | 'sprint' | 'phase', { singular: string; plural: string }>>;
}

export type ActiveView = 
  | 'overview' 
  | 'project_sheet' 
  | 'tracking' 
  | 'kanban' 
  | 'sprints'
  | 'gantt' 
  | 'tasks' 
  | 'calendar' 
  | 'finance'
  | 'timetracking'
  | 'wiki'
  | 'risks'
  | 'documents' 
  | 'forum'
  | 'team' 
  | 'billing'
  | 'settings'
  | 'super_admin';

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  projectId?: string;
  email: string;
  role: WorkspaceRole;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: string;
  invitedBy: string;
  createdAt: string;
}

export type ForumCategory = 'general' | 'qa' | 'decisions' | 'announcements';

export interface ForumTopic {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  body: string;
  category: ForumCategory;
  isPinned: boolean;
  solutionPostId?: string;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ForumPost {
  id: string;
  topicId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  body: string;
  isSolution?: boolean;
  reactions: Record<string, string[]>; // emoji key -> userIds array
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  code: 'discovery' | 'premium' | 'team';
  name: string;
  tagline: string;
  priceMonth: number;
  currency: string;
  maxProjects: number;
  maxMembers: number;
  maxStorageMb: number;
  features: string[];
  isPopular?: boolean;
}

export interface WorkspaceSubscription {
  planCode: 'discovery' | 'premium' | 'team';
  status: 'active' | 'trialing' | 'canceled';
  currentPeriodEnd: string;
  storageUsedMb: number;
}

// ---------------------------------------------------------------------------
// NOUVEAUX MODULES PROFESSIONNELS : GESTION UNIVERSALE
// ---------------------------------------------------------------------------

// 1. Finance & Budgets
export interface ProjectExpense {
  id: string;
  projectId: string;
  title: string;
  category: 'labor' | 'software' | 'hardware' | 'consulting' | 'marketing' | 'other';
  amount: number;
  date: string;
  status: 'planned' | 'paid' | 'pending';
  receiptUrl?: string;
  createdBy: string;
}

export interface ProjectBudget {
  projectId: string;
  targetBudget: number;
  currency: string;
}

// 2. Suivi du Temps (Time Tracking)
export interface TimeEntry {
  id: string;
  taskId?: string;
  projectId: string;
  userId: string;
  userName: string;
  description: string;
  durationMinutes: number;
  date: string; // YYYY-MM-DD
  hourlyRate?: number;
  createdAt: string;
}

export interface ActiveTimer {
  taskId?: string;
  projectId: string;
  startedAt: string; // ISO timestamp
  description: string;
}

// 3. Sprints & Méthodologie Agile
export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'future' | 'active' | 'completed';
  taskIds: string[];
}

// 4. Wiki & Base de Connaissances
export interface WikiPage {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  content: string;
  category: 'architecture' | 'meeting_notes' | 'specifications' | 'onboarding' | 'guides';
  iconKey?: string;
  authorName: string;
  updatedAt: string;
  pinned?: boolean;
}

// 5. Gestion des Risques & Matrice 5x5
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ProjectRisk {
  id: string;
  projectId: string;
  title: string;
  description: string;
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  severity: RiskSeverity;
  status: 'identified' | 'mitigating' | 'materialized' | 'closed';
  ownerId: string;
  mitigationPlan: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 6. Pièces jointes & Modèles de Projet Configurables (Section 1.4)
// ---------------------------------------------------------------------------

export interface Attachment {
  id: string;
  name: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface WorkflowStatus {
  id: string;
  name: string;
  category: 'todo' | 'in_progress' | 'done' | 'canceled';
  color: string;
  wipLimit?: number;
  order: number;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'select' | 'multi_select' | 'user' | 'checkbox' | 'url' | 'formula';
  options?: { id: string; label: string; color?: string }[];
  appliesTo: 'task' | 'project' | 'risk';
  required?: boolean;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  methodology: 'scrum' | 'kanban' | 'waterfall' | 'hybrid' | 'ticketing' | 'recurring_ops';
  taskStatuses: WorkflowStatus[];
  customFields: CustomFieldDefinition[];
  defaultPhases: Omit<ProjectPhase, 'id' | 'projectId'>[];
  defaultLabels: string[];
  iconKey?: string;
  colorKey?: string;
}

export interface AuditLogEntry {
  id: string;
  workspaceId: string;
  actorId: string;
  actorName?: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'restore' | 'login' | 'share' | 'export';
  changes?: { field: string; from: unknown; to: unknown }[];
  ip?: string;
  at: string;
}

export interface MemberRate {
  userId: string;
  hourlyRate: number;
  currency: string;
  validFrom: string;
}


