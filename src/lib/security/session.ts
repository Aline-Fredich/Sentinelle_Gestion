/**
 * SENTINEL GESTION — Gestion des Sessions et Contrôle d'Accès par Rôles (RBAC)
 * Définition stricte des privilèges et politique de sécurité des sessions utilisateurs.
 */

import type { WorkspaceRole } from '../../types/sentinel.ts';

export type SecurityPermission =
  | 'workspace:manage'
  | 'project:create'
  | 'project:edit'
  | 'project:delete'
  | 'budget:view'
  | 'budget:edit'
  | 'task:create'
  | 'task:edit'
  | 'task:delete'
  | 'audit:view'
  | 'gdpr:export'
  | 'gdpr:anonymize';

const ROLE_PERMISSIONS: Record<WorkspaceRole, readonly SecurityPermission[]> = {
  super_admin: [
    'workspace:manage',
    'project:create',
    'project:edit',
    'project:delete',
    'budget:view',
    'budget:edit',
    'task:create',
    'task:edit',
    'task:delete',
    'audit:view',
    'gdpr:export',
    'gdpr:anonymize',
  ],
  owner: [
    'workspace:manage',
    'project:create',
    'project:edit',
    'project:delete',
    'budget:view',
    'budget:edit',
    'task:create',
    'task:edit',
    'task:delete',
    'audit:view',
    'gdpr:export',
    'gdpr:anonymize',
  ],
  admin: [
    'workspace:manage',
    'project:create',
    'project:edit',
    'project:delete',
    'budget:view',
    'budget:edit',
    'task:create',
    'task:edit',
    'task:delete',
    'audit:view',
    'gdpr:export',
    'gdpr:anonymize',
  ],
  project_manager: [
    'project:create',
    'project:edit',
    'budget:view',
    'budget:edit',
    'task:create',
    'task:edit',
    'task:delete',
    'gdpr:export',
  ],
  member: [
    'task:create',
    'task:edit',
    'gdpr:export',
  ],
  viewer: [
    'gdpr:export',
  ],
};

/**
 * Vérifie si un rôle possède une permission opérationnelle donnée.
 */
export function hasPermission(role: WorkspaceRole, permission: SecurityPermission): boolean {
  const allowed = ROLE_PERMISSIONS[role];
  return allowed ? allowed.includes(permission) : false;
}

export interface UserSession {
  userId: string;
  role: WorkspaceRole;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
}

export const SESSION_CONFIG = {
  /** Durée maximale d'inactivité avant déconnexion automatique (8 heures) */
  INACTIVITY_TIMEOUT_MS: 8 * 60 * 60 * 1000,
  /** Durée de vie absolue du jeton de session (7 jours) */
  SESSION_LIFETIME_MS: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Crée une nouvelle session sécurisée.
 */
export function createSession(userId: string, role: WorkspaceRole): UserSession {
  const now = Date.now();
  return {
    userId,
    role,
    createdAt: now,
    lastActivityAt: now,
    expiresAt: now + SESSION_CONFIG.SESSION_LIFETIME_MS,
  };
}

/**
 * Vérifie la validité d'une session (expiration absolue ou inactivité prolongée).
 */
export function isSessionValid(session: UserSession | null | undefined): boolean {
  if (!session) return false;
  const now = Date.now();

  // Dépassement de la durée de vie absolue
  if (now > session.expiresAt) return false;

  // Dépassement de la durée d'inactivité
  if (now - session.lastActivityAt > SESSION_CONFIG.INACTIVITY_TIMEOUT_MS) return false;

  return true;
}

/**
 * Met à jour l'horodatage d'activité d'une session active.
 */
export function touchSession(session: UserSession): UserSession {
  return {
    ...session,
    lastActivityAt: Date.now(),
  };
}
