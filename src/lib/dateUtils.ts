/**
 * SENTINEL GESTION
 * Utilitaires de dates en langue française.
 * Conforme aux spécifications (fonction pure, sans date en dur, fuseau maîtrisé).
 */

export function getTodayDateString(referenceDate?: Date): string {
  const d = referenceDate ?? new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatShortDateFrench(dateString?: string): string {
  if (!dateString) return 'Sans date';
  const parts = dateString.split('-');
  if (parts.length < 3) return dateString;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  return `${day} ${months[month]} ${year}`;
}

export function formatDayMonthFrench(dateString?: string): string {
  if (!dateString) return 'Sans date';
  const parts = dateString.split('-');
  if (parts.length < 3) return dateString;
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  return `${day} ${months[month]}`;
}

export function formatRelativeTimeFrench(isoDateString: string): string {
  if (typeof window === 'undefined') {
    return 'Récemment';
  }
  try {
    const date = new Date(isoDateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "À l'instant";
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return 'Récemment';
  }
}

export function isDateOverdue(dueDate?: string, status?: string): boolean {
  if (!dueDate || status === 'done') return false;
  const today = getTodayDateString();
  return dueDate < today;
}

export function isDateToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  return dateStr === getTodayDateString();
}

export function isDateUpcoming(dueDate?: string, status?: string): boolean {
  if (!dueDate || status === 'done') return false;
  const today = getTodayDateString();
  return dueDate > today;
}

export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysBetweenDates(startStr: string, endStr: string): number {
  const d1 = new Date(startStr);
  const d2 = new Date(endStr);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
}
