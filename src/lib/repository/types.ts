/**
 * SENTINEL GESTION — Interface de Persistance Abstraite (Repository Pattern)
 * Permet l'interchangeabilité transparente entre le stockage local (Dexie / IndexedDB)
 * et le backend API en production (Prisma / PostgreSQL).
 */

export interface Repository<T extends { id: string }> {
  list(filter?: (item: T) => boolean): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(item: T): Promise<T>;
  update(id: string, partial: Partial<T>): Promise<T>;
  remove(id: string): Promise<boolean>;
  clear?(): Promise<void>;
  subscribe?(callback: (items: T[]) => void): () => void;
}
