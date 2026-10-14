/**
 * SENTINEL GESTION — Mode Hors-Ligne & Synchronisation Bidirectionnelle
 * File d'attente d'actions mutatives, détection réseau et résolution de conflits
 * basée sur la stratégie Last-Write-Wins (LWW) avec horodatage vectoriel.
 */

export type MutationType = 'CREATE' | 'UPDATE' | 'DELETE';
export type MutationEntity = 'task' | 'project' | 'expense' | 'timeEntry' | 'document' | 'risk';

export interface PendingMutation {
  id: string;
  type: MutationType;
  entity: MutationEntity;
  entityId: string;
  payload: Record<string, unknown>;
  clientTimestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  hasErrors: boolean;
}

const STORAGE_KEY_QUEUE = 'sentinel_offline_mutation_queue_v1';
const STORAGE_KEY_LAST_SYNC = 'sentinel_last_sync_timestamp';

/**
 * Récupère la liste des mutations en attente depuis le stockage local.
 */
export function getPendingMutations(): PendingMutation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
    if (!raw) return [];
    return JSON.parse(raw) as PendingMutation[];
  } catch (err) {
    console.error('Erreur lors de la lecture de la file d’attente hors-ligne:', err);
    return [];
  }
}

/**
 * Sauvegarde la file d'attente dans le stockage local.
 */
export function savePendingMutations(queue: PendingMutation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
  } catch (err) {
    console.error('Erreur lors de la sauvegarde de la file d’attente hors-ligne:', err);
  }
}

/**
 * Enfile une nouvelle mutation opérationnelle réalisée en mode déconnecté ou optimiste.
 */
export function enqueueMutation(
  mutation: Omit<PendingMutation, 'id' | 'clientTimestamp' | 'retryCount' | 'status'>
): PendingMutation {
  const queue = getPendingMutations();

  // Optimisation : si une mise à jour sur la même entité existe déjà en file,
  // on peut fusionner les payloads pour réduire le trafic de réconciliation
  const existingIndex = queue.findIndex(
    m => m.entity === mutation.entity && m.entityId === mutation.entityId && m.type === 'UPDATE' && mutation.type === 'UPDATE'
  );

  const newEntry: PendingMutation = {
    ...mutation,
    id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    clientTimestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  if (existingIndex >= 0) {
    queue[existingIndex] = {
      ...queue[existingIndex],
      payload: { ...queue[existingIndex].payload, ...mutation.payload },
      clientTimestamp: Date.now(),
    };
  } else {
    queue.push(newEntry);
  }

  savePendingMutations(queue);
  return newEntry;
}

/**
 * Stratégie de résolution de conflit Last-Write-Wins (LWW) :
 * Compare les horodatages client et serveur pour déterminer quelle version prévaut.
 */
export function resolveConflictLww<T extends { updatedAt?: string | number }>(
  localVersion: T,
  remoteVersion: T
): { winningVersion: T; source: 'local' | 'remote' } {
  const getTimestamp = (val: string | number | undefined): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const parsed = Date.parse(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const localTime = getTimestamp(localVersion.updatedAt);
  const remoteTime = getTimestamp(remoteVersion.updatedAt);

  if (localTime >= remoteTime) {
    return { winningVersion: localVersion, source: 'local' };
  }
  return { winningVersion: remoteVersion, source: 'remote' };
}

/**
 * Dépile et traite les mutations hors-ligne via un exécuteur asynchrone fourni.
 */
export async function flushSyncQueue(
  executor: (mutation: PendingMutation) => Promise<boolean>
): Promise<{ processed: number; failed: number; remaining: number }> {
  const queue = getPendingMutations();
  if (queue.length === 0) {
    return { processed: 0, failed: 0, remaining: 0 };
  }

  const remainingQueue: PendingMutation[] = [];
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      item.status = 'syncing';
      const success = await executor(item);
      if (success) {
        processed++;
      } else {
        item.status = 'failed';
        item.retryCount += 1;
        failed++;
        // Conserve les mutations en échec avec un nombre d'essais raisonnable (< 5)
        if (item.retryCount < 5) {
          remainingQueue.push(item);
        }
      }
    } catch (err) {
      item.status = 'failed';
      item.retryCount += 1;
      item.error = (err as Error).message;
      failed++;
      if (item.retryCount < 5) {
        remainingQueue.push(item);
      }
    }
  }

  savePendingMutations(remainingQueue);

  if (typeof window !== 'undefined' && processed > 0) {
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());
  }

  return {
    processed,
    failed,
    remaining: remainingQueue.length,
  };
}
