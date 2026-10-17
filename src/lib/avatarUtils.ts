/**
 * SENTINEL GESTION — Générateur d'avatars vectoriels locaux
 * Remplace tout recours à des serveurs d'images distants (Unsplash, Gravatar, etc.)
 * Garantit l'autonomie hors-ligne (Offline-First) et le respect de la vie privée (RGPD).
 */

export function createLocalAvatarSvg(name: string, bgGradientStart: string = '#0066FF', bgGradientEnd: string = '#00D2FF'): string {
  const initials = name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SG';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="g_${initials}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradientStart}"/>
        <stop offset="100%" stop-color="${bgGradientEnd}"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="28" fill="url(#g_${initials})" />
    <text x="50" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="36" font-weight="700" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">
      ${initials}
    </text>
  </svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const LOCAL_AVATARS = {
  thomas: createLocalAvatarSvg('Thomas Laurent', '#0066FF', '#00D2FF'), // TL (Cobalt/Cyan)
  claire: createLocalAvatarSvg('Claire Vasseur', '#059669', '#10B981'), // CV (Émeraude)
  marc: createLocalAvatarSvg('Marc Benali', '#0284C7', '#38BDF8'),     // MB (Ciel/Bleu)
  sophie: createLocalAvatarSvg('Sophie Martin', '#7C3AED', '#A855F7'), // SM (Violet)
  julien: createLocalAvatarSvg('Julien Moreau', '#D97706', '#F59E0B'), // JM (Ambre)
  superadmin: createLocalAvatarSvg('Marc De Villiers', '#1C1C1E', '#48484A'), // MV (Graphite Apple)
  system: createLocalAvatarSvg('SENTINEL', '#FF1E27', '#EF4444'),     // SG (Rouge Sentinelle)
};
