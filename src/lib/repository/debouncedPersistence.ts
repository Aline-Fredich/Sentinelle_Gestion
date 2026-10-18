/**
 * SENTINEL GESTION — Persistance par Entité avec Debounce (Lot 2)
 * Remplace la sauvegarde exhaustive bloquante par une écriture différentielle ciblée.
 * Élimine le gel du thread principal et les blocages INP.
 */

import { Table } from 'dexie';

const timers: Record<string, NodeJS.Timeout> = {};

/**
 * Persiste de manière asynchrone et temporisée une collection d'entités dans Dexie.
 * N'affecte QUE la table cible sans effacement brutal (évite .clear() global).
 */
export function persistEntityDebounced<T extends { id: string }>(
  tableName: string,
  table: Table<T, string>,
  items: T[],
  delayMs = 350
): void {
  if (typeof window === 'undefined' || !table) return;

  if (timers[tableName]) {
    clearTimeout(timers[tableName]);
  }

  timers[tableName] = setTimeout(async () => {
    try {
      // Réconciliation différentielle pour éviter les verrous de transaction
      const existingKeys = new Set(await table.toCollection().primaryKeys());
      const currentKeys = new Set(items.map((i) => i.id));

      const toDelete = [...existingKeys].filter((k) => !currentKeys.has(k));
      if (toDelete.length > 0) {
        await table.bulkDelete(toDelete);
      }

      if (items.length > 0) {
        await table.bulkPut(items);
      }
    } catch (err) {
      console.warn(`[Dexie Persistence] Erreur de synchronisation ciblée sur ${tableName}:`, err);
    }
  }, delayMs);
}

/**
 * Persiste les préférences légères d'état UI dans localStorage (sans stocker de méga-payloads)
 */
export function persistUiPreferences(preferences: {
  activeProjectId?: string;
  activeView?: string;
  theme?: string;
}): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('sentinel_ui_preferences', JSON.stringify(preferences));
  } catch {
    // Quota d'espace dépassé ou navigation privée
  }
}
