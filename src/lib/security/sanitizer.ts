/**
 * SENTINEL GESTION — Assainissement et Validation Sécurisée des Entrées
 * Protection contre les injections XSS (Cross-Site Scripting), les URL malveillantes
 * et les charges utiles malicieuses.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Échappe tous les caractères spéciaux HTML dangereux pour prévenir les injections XSS directes.
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[&<>"'`=\/]/g, char => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Supprime totalement toutes les balises HTML d'une chaîne pour ne conserver que le texte brut.
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/<\/?[^>]+(>|$)/gi, '').trim();
}

/**
 * Valide et assainit une URL pour éviter les attaques de type 'javascript:...', 'vbscript:...' ou 'data:...'.
 * Autorise uniquement 'http:', 'https:', 'mailto:' ou les chemins relatifs commençant par '/'.
 */
export function sanitizeUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();

  // Chemin relatif interne autorisé
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const safeProtocols = ['http:', 'https:', 'mailto:'];
    if (safeProtocols.includes(parsed.protocol.toLowerCase())) {
      return parsed.toString();
    }
    return '';
  } catch {
    // Si ce n'est pas une URL valide complète et que ce n'est pas un chemin relatif sûr
    return '';
  }
}

/**
 * Nettoie une chaîne de texte utilisateur : supprime les caractères de contrôle non imprimables,
 * normalise les espaces et limite la longueur maximale.
 */
export function sanitizeInputString(input: unknown, maxLength = 5000): string {
  if (typeof input !== 'string') return '';
  // Suppression des caractères de contrôle ASCII (sauf retours à la ligne et tabulations)
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.trim().slice(0, maxLength);
}

/**
 * Filtre un contenu HTML enrichi (ex: description de tâche ou page Wiki)
 * en neutralisant les balises et attributs dangereux (`<script>`, `<iframe>`, `onerror=`, etc.).
 */
export function sanitizeRichText(html: string): string {
  if (!html || typeof html !== 'string') return '';

  // 1. Suppression systématique des balises hautement dangereuses
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<base\b[^>]*>/gi, '');

  // 2. Suppression de tous les gestionnaires d'événements inline (on*, onload, onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '');

  // 3. Suppression des attributs href/src avec des pseudo-protocoles d'exécution de code
  sanitized = sanitized.replace(/(href|src)\s*=\s*(["']\s*(javascript|vbscript|data):[^"']*["']|[^\s>]+)/gi, '$1="#"');

  return sanitized.trim();
}
