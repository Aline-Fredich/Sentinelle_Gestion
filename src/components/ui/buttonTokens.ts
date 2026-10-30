/**
 * SENTINEL GESTION — Jetons de style et variantes du composant Button
 * Conformes aux 4 thèmes de fond et aux spécifications ergonomiques
 */

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] border border-[var(--button-primary-bg)] shadow-sm hover:opacity-95 hover:shadow-md active:scale-[0.98]',
  secondary:
    'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-raised)] hover:border-[var(--border-strong)] active:scale-[0.98]',
  outline:
    'bg-transparent text-[var(--text)] border border-[var(--border-strong)] hover:bg-[var(--surface-2)] hover:border-[var(--brand)] active:scale-[0.98]',
  ghost:
    'bg-transparent text-[var(--text-muted)] border border-transparent hover:bg-[var(--surface-2)] hover:text-[var(--text)] active:scale-[0.98]',
  danger:
    'bg-[var(--button-danger-bg)] text-[var(--button-danger-text)] border border-[var(--button-danger-bg)] shadow-sm hover:opacity-92 active:scale-[0.98]',
};

export const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2 text-[11px] gap-1.5 rounded',
  sm: 'h-8 px-2.5 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-xs font-semibold gap-2 rounded-md',
  lg: 'h-11 px-5 text-sm font-semibold gap-2.5 rounded-md',
};

export const iconSizes: Record<ButtonSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-4.5 h-4.5',
};
