/**
 * SENTINEL GESTION — Journal d'Audit Infalsifiable (Chaîne de Hachage SHA-256)
 * Garantit la traçabilité immuable de toutes les actions sensibles (qui a fait quoi, quand et comment).
 * Chaque bloc de journal est lié cryptographiquement au bloc précédent, rendant toute altération
 * ou suppression rétroactive immédiatement détectable.
 */

import { calculateSha256 } from './crypto.ts';
import type { AuditActionType, AuditEntry } from '../../types/sentinel.ts';

export type { AuditActionType, AuditEntry };

export interface AuditVerificationResult {
  isValid: boolean;
  totalEntries: number;
  brokenIndex?: number;
  reason?: string;
}

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
export const AUDIT_STORAGE_KEY = 'sentinel_audit_trail_v1';

/**
 * Sérialise un objet en JSON canonique déterministe (clés triées)
 * pour garantir la cohérence absolue du calcul de hachage.
 */
export function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(item => canonicalJsonStringify(item)).join(',')}]`;
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const entries = keys.map(k => `"${k}":${canonicalJsonStringify((obj as Record<string, unknown>)[k])}`);
  return `{${entries.join(',')}}`;
}

/**
 * Calcule le hachage cryptographique SHA-256 d'une entrée de journal.
 */
export async function computeEntryHash(entry: Omit<AuditEntry, 'hash'>): Promise<string> {
  const payload = [
    entry.sequenceNumber,
    entry.timestamp,
    entry.userId,
    entry.action,
    entry.entityType,
    entry.entityId,
    canonicalJsonStringify(entry.details),
    entry.previousHash,
  ].join('|');

  return calculateSha256(payload);
}

/**
 * Crée une nouvelle entrée d'audit infalsifiable liée à la chaîne existante.
 */
export async function createAuditEntry(
  params: {
    userId: string;
    userName: string;
    action: AuditActionType;
    entityType: AuditEntry['entityType'];
    entityId: string;
    details?: Record<string, unknown>;
  },
  existingTrail: AuditEntry[] = []
): Promise<AuditEntry> {
  const sequenceNumber = existingTrail.length + 1;
  const previousHash = existingTrail.length > 0
    ? existingTrail[existingTrail.length - 1].hash
    : GENESIS_HASH;

  const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const timestamp = new Date().toISOString();

  const entryCandidate: Omit<AuditEntry, 'hash'> = {
    id,
    sequenceNumber,
    timestamp,
    userId: params.userId,
    userName: params.userName,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details || {},
    previousHash,
  };

  const hash = await computeEntryHash(entryCandidate);

  return {
    ...entryCandidate,
    hash,
  };
}

/**
 * Vérifie l'intégrité intégrale d'un journal d'audit (audit trail).
 * Détecte toute altération de contenu, réorganisation ou suppression d'entrée.
 */
export async function verifyAuditTrailIntegrity(
  trail: AuditEntry[]
): Promise<AuditVerificationResult> {
  if (!trail || trail.length === 0) {
    return { isValid: true, totalEntries: 0 };
  }

  for (let i = 0; i < trail.length; i++) {
    const current = trail[i];

    // 1. Vérification du lien avec le bloc précédent
    const expectedPrevHash = i === 0 ? GENESIS_HASH : trail[i - 1].hash;
    if (current.previousHash !== expectedPrevHash) {
      return {
        isValid: false,
        totalEntries: trail.length,
        brokenIndex: i,
        reason: `Rupture de chaîne à l'index ${i} : le hachage précédent '${current.previousHash.slice(0, 8)}...' ne correspond pas au hachage du bloc antérieur '${expectedPrevHash.slice(0, 8)}...'.`,
      };
    }

    // 2. Vérification du numéro de séquence
    if (current.sequenceNumber !== i + 1) {
      return {
        isValid: false,
        totalEntries: trail.length,
        brokenIndex: i,
        reason: `Incohérence de séquence à l'index ${i} : numéro attendu ${i + 1}, trouvé ${current.sequenceNumber}.`,
      };
    }

    // 3. Recalcul et comparaison du hachage SHA-256
    const expectedHash = await computeEntryHash(current);
    if (current.hash !== expectedHash) {
      return {
        isValid: false,
        totalEntries: trail.length,
        brokenIndex: i,
        reason: `Altération détectée à l'index ${i} : le contenu a été modifié. Hachage enregistré '${current.hash.slice(0, 8)}...' != hachage recalculé '${expectedHash.slice(0, 8)}...'.`,
      };
    }
  }

  return {
    isValid: true,
    totalEntries: trail.length,
  };
}

/**
 * Sauvegarde une entrée d'audit dans la persistance locale (Dexie/localStorage)
 * et tente l'enregistrement synchrone ou asynchrone dans Supabase (PostgreSQL append-only).
 */
export async function saveAuditEntryToPersistence(entry: AuditEntry): Promise<void> {
  // 1. Sauvegarde dans Dexie (IndexedDB)
  try {
    if (typeof window !== 'undefined') {
      const { db } = await import('../repository/dexieDb');
      if (db?.auditLogs) {
        await db.auditLogs.put(entry);
      }
    }
  } catch (dexieErr) {
    console.warn('Persistance Dexie non disponible pour le journal d audit:', dexieErr);
  }

  // 2. Sauvegarde de secours dans le localStorage (pour accès instantané hors-ligne)
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      const currentList: AuditEntry[] = raw ? JSON.parse(raw) : [];
      if (!currentList.some(item => item.id === entry.id)) {
        currentList.push(entry);
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(currentList));
      }
    } catch {
      // Ignore les quotas localStorage
    }
  }

  // 3. Enregistrement distant dans Supabase si connecté
  if (typeof window !== 'undefined') {
    try {
      const { createClient, isSupabaseConfigured } = await import('../supabase/client');
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.from('audit_logs').insert({
          id: entry.id,
          workspace_id: entry.workspaceId || null,
          user_id: entry.userId,
          action: entry.action,
          entity_type: entry.entityType,
          entity_id: entry.entityId,
          previous_hash: entry.previousHash,
          hash: entry.hash,
          metadata: {
            userName: entry.userName,
            sequenceNumber: entry.sequenceNumber,
            details: entry.details,
          },
          created_at: entry.timestamp,
        });
      }
    } catch (supaErr) {
      console.warn('Synchronisation distante du journal d audit différée:', supaErr);
    }
  }
}

/**
 * Charge l'intégralité de la piste d'audit certifiée.
 * Priorise Supabase (serveur immuable) si disponible, avec repli transparent sur Dexie / localStorage.
 */
export async function loadPersistentAuditTrail(workspaceId?: string): Promise<AuditEntry[]> {
  // 1. Essai de lecture depuis Supabase
  if (typeof window !== 'undefined') {
    try {
      const { createClient, isSupabaseConfigured } = await import('../supabase/client');
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: true });
        if (workspaceId) {
          query = query.eq('workspace_id', workspaceId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          interface SupabaseAuditRow {
            id: string | number;
            user_id?: string | null;
            action: string;
            entity_type: string;
            entity_id?: string | null;
            previous_hash?: string | null;
            hash?: string | null;
            workspace_id?: string | null;
            created_at?: string | null;
            metadata?: {
              userName?: string;
              sequenceNumber?: number;
              details?: Record<string, unknown>;
            } | null;
          }
          return (data as unknown as SupabaseAuditRow[]).map((row, idx: number) => ({
            id: String(row.id),
            sequenceNumber: Number(row.metadata?.sequenceNumber ?? (idx + 1)),
            timestamp: String(row.created_at || new Date().toISOString()),
            userId: String(row.user_id || ''),
            userName: String(row.metadata?.userName || 'Utilisateur'),
            action: row.action as AuditActionType,
            entityType: row.entity_type as AuditEntry['entityType'],
            entityId: String(row.entity_id || ''),
            details: (row.metadata?.details as Record<string, unknown>) || {},
            previousHash: String(row.previous_hash || (idx === 0 ? GENESIS_HASH : '')),
            hash: String(row.hash || ''),
            workspaceId: row.workspace_id ? String(row.workspace_id) : undefined,
          }));
        }
      }
    } catch {
      // Repli sur stockage local
    }
  }

  // 2. Repli sur Dexie (IndexedDB)
  try {
    if (typeof window !== 'undefined') {
      const { db } = await import('../repository/dexieDb');
      if (db?.auditLogs) {
        const localRecords = await db.auditLogs.toArray();
        if (localRecords && localRecords.length > 0) {
          const filtered = workspaceId
            ? localRecords.filter(r => !r.workspaceId || r.workspaceId === workspaceId)
            : localRecords;
          return filtered.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
        }
      }
    }
  } catch {
    // Repli sur localStorage
  }

  // 3. Repli ultime sur le cache localStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (raw) {
        const parsed: AuditEntry[] = JSON.parse(raw);
        const filtered = workspaceId
          ? parsed.filter(r => !r.workspaceId || r.workspaceId === workspaceId)
          : parsed;
        return filtered.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
      }
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * Enregistre un événement audité en garantissant l'enchaînement cryptographique SHA-256.
 */
export async function recordSecureAuditEvent(params: {
  userId: string;
  userName: string;
  action: AuditActionType;
  entityType: AuditEntry['entityType'];
  entityId: string;
  details?: Record<string, unknown>;
  workspaceId?: string;
}): Promise<AuditEntry> {
  const currentTrail = await loadPersistentAuditTrail(params.workspaceId);
  const newEntry = await createAuditEntry(
    {
      userId: params.userId,
      userName: params.userName,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details,
    },
    currentTrail
  );

  if (params.workspaceId) {
    newEntry.workspaceId = params.workspaceId;
  }

  await saveAuditEntryToPersistence(newEntry);
  return newEntry;
}
