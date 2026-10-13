/**
 * SENTINEL GESTION
 * Générateur d'identifiants uniques non collisionnels (UUID v4 / standard sécurisé).
 * Remplace Date.now() pour garantir l'unicité stricte de chaque entité.
 */

export function generateId(prefix: string = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  const rand = Math.random().toString(36).substring(2, 10);
  const ts = Date.now().toString(36);
  return `${prefix}-${ts}-${rand}`;
}
