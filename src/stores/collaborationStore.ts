/**
 * SENTINEL GESTION — Store de Domaine : Collaboration & Notifications
 * Gère le fil d'audit d'activité, les alertes, le forum de discussion et les partages.
 */

import { create } from 'zustand';
import { ActivityEvent, NotificationItem, ForumTopic, ProjectShare } from '@/types/sentinel';
import { INITIAL_ACTIVITIES, INITIAL_NOTIFICATIONS, INITIAL_FORUM_TOPICS } from '@/lib/initialData';
import { generateId } from '@/lib/idUtils';

interface CollaborationState {
  activity: ActivityEvent[];
  notifications: NotificationItem[];
  forumTopics: ForumTopic[];
  shares: ProjectShare[];

  setActivity: (activity: ActivityEvent[]) => void;
  setNotifications: (notifications: NotificationItem[]) => void;
  setForumTopics: (forumTopics: ForumTopic[]) => void;
  setShares: (shares: ProjectShare[]) => void;

  logActivity: (
    user: { id: string; name: string; avatar: string },
    actionType: ActivityEvent['actionType'],
    description: string,
    projectId?: string,
    taskId?: string
  ) => void;

  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  addProjectShare: (projectId: string, email: string, permission: 'view' | 'edit') => ProjectShare;
  revokeProjectShare: (id: string) => void;
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
  activity: INITIAL_ACTIVITIES,
  notifications: INITIAL_NOTIFICATIONS,
  forumTopics: INITIAL_FORUM_TOPICS,
  shares: [],

  setActivity: (activity) => set({ activity }),
  setNotifications: (notifications) => set({ notifications }),
  setForumTopics: (forumTopics) => set({ forumTopics }),
  setShares: (shares) => set({ shares }),

  logActivity: (user, actionType, description, projectId, taskId) => {
    const newEvt: ActivityEvent = {
      id: generateId('act'),
      workspaceId: 'ws-1',
      projectId,
      taskId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      actionType,
      description,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      activity: [newEvt, ...state.activity].slice(0, 200), // conservation des 200 derniers événements
    }));
  },

  markNotificationAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllNotificationsAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  addProjectShare: (projectId, email, permission) => {
    const newShare: ProjectShare = {
      id: generateId('shr'),
      projectId,
      sharedWithEmail: email,
      permission,
      token: generateId('tok'),
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      shares: [newShare, ...state.shares],
    }));

    return newShare;
  },

  revokeProjectShare: (id) => {
    set((state) => ({
      shares: state.shares.filter((s) => s.id !== id),
    }));
  },
}));
