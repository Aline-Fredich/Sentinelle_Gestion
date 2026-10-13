/**
 * SENTINEL GESTION — Store de Domaine : Espace de Travail & Utilisateurs
 * Gère les métadonnées de l'organisation, les membres, l'utilisateur actif et les forfaits.
 */

import { create } from 'zustand';
import { Workspace, User, WorkspaceInvitation, WorkspaceSubscription, WorkspaceRole } from '@/types/sentinel';
import { INITIAL_WORKSPACE, INITIAL_USERS, INITIAL_INVITATIONS } from '@/lib/initialData';
import { generateId } from '@/lib/idUtils';

interface WorkspaceState {
  workspace: Workspace;
  users: User[];
  currentUser: User;
  invitations: WorkspaceInvitation[];
  subscription: WorkspaceSubscription;

  setWorkspace: (workspace: Workspace) => void;
  setUsers: (users: User[]) => void;
  setCurrentUser: (user: User) => void;
  setInvitations: (invitations: WorkspaceInvitation[]) => void;
  setSubscription: (subscription: WorkspaceSubscription) => void;

  updateWorkspace: (partial: Partial<Workspace>) => void;
  inviteMember: (email: string, role: WorkspaceRole, projectId?: string) => WorkspaceInvitation;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspace: INITIAL_WORKSPACE,
  users: INITIAL_USERS,
  currentUser: INITIAL_USERS[0],
  invitations: INITIAL_INVITATIONS,
  subscription: {
    planCode: 'discovery',
    status: 'active',
    currentPeriodEnd: '2026-11-12T00:00:00Z',
    storageUsedMb: 12.4,
  },

  setWorkspace: (workspace) => set({ workspace }),
  setUsers: (users) => set({ users }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setInvitations: (invitations) => set({ invitations }),
  setSubscription: (subscription) => set({ subscription }),

  updateWorkspace: (partial) => {
    set((state) => ({
      workspace: { ...state.workspace, ...partial },
    }));
  },

  inviteMember: (email, role, projectId) => {
    const newInv: WorkspaceInvitation = {
      id: generateId('inv'),
      workspaceId: 'ws-1',
      projectId,
      email,
      role,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
      invitedBy: 'usr-1',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      invitations: [newInv, ...state.invitations],
    }));

    return newInv;
  },
}));
