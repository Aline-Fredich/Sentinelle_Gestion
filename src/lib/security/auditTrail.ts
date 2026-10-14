/**
 * SENTINEL GESTION — Journal d'Audit Infalsifiable (Chaîne de Hachage SHA-256)
 * Garantit la traçabilité immuable de toutes les actions sensibles (qui a fait quoi, quand et comment).
 * Chaque bloc de journal est lié cryptographiquement au bloc précédent, rendant toute altération
 * ou suppression rétroactive immédiatement détectable.
 */

import { calculateSha256 } from './crypto.ts';

export type AuditActionType =
  | 'user_login'
  | 'user_logout'
  | 'role_change'
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'project_created'
  | 'project_archived'
  | 'budget_updated'
  | 'expense_approved'
  | 'gdpr_data_export'
  | 'gdpr_anonymization'
  | 'security_alert'
  | 'settings_updated';

export interface AuditEntry {
  id: string;
  sequenceNumber: number;
  timestamp: string;
  userId: string;
  userName: string;
  action: AuditActionType;
  entityType: 'project' | 'task' | 'user' | 'budget' | 'security' | 'system';
  entityId: string;
  details: Record<string, unknown>;
  previousHash: string;
  hash: string;
}

export interface AuditVerificationResult {
  isValid: boolean;
  totalEntries: number;
  brokenIndex?: number;
  reason?: string;
}

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

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
