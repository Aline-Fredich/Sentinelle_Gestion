/**
 * SENTINEL GESTION — Système d'Apparence & Thèmes de Fond
 * 4 Thèmes officiels : Blanc, Noir, Bleu (Cobalt), Bleu de nuit
 * Conformes WCAG 2.1 AA / AAA
 */

export type ThemeId = 'blanc' | 'noir' | 'bleu' | 'nuit';
export type ThemePreference = ThemeId | 'auto';

export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  brand: string;
  primary: string; // Alias rétrocompatible vers brand
  brandContrast: string;
  brandHover: string;
  accent: string;
  danger: string;
  buttonPrimaryBg: string;
  buttonPrimaryText: string;
  buttonDangerBg: string;
  buttonDangerText: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string; // Alias rétrocompatible vers label
  label: string;
  shortLabel: string;
  description: string;
  colorScheme: 'light' | 'dark';
  swatches: [string, string, string]; // [Fond, Surface, Accent/Marque]
  colors: ThemeColors;
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  blanc: {
    id: 'blanc',
    name: 'Blanc',
    label: 'Blanc',
    shortLabel: 'Clair',
    description: 'Fond blanc pur, contrastes maximaux et confort de lecture en environnement lumineux.',
    colorScheme: 'light',
    swatches: ['#F4F6F9', '#FFFFFF', '#005CE6'],
    colors: {
      bg: '#F4F6F9',
      surface: '#FFFFFF',
      surface2: '#E8EEF5',
      surfaceRaised: '#FFFFFF',
      text: '#0B1220',
      textMuted: '#2E3E52',
      border: '#CBD5E1',
      borderStrong: '#475569',
      brand: '#005CE6',
      primary: '#005CE6',
      brandContrast: '#FFFFFF',
      brandHover: '#0052CC',
      accent: '#00A6CC',
      danger: '#D91C24',
      buttonPrimaryBg: '#0066FF',
      buttonPrimaryText: '#FFFFFF',
      buttonDangerBg: '#D91C24',
      buttonDangerText: '#FFFFFF',
    },
  },
  noir: {
    id: 'noir',
    name: 'Noir',
    label: 'Noir',
    shortLabel: 'OLED',
    description: 'Noir absolu profond, optimisé pour les écrans OLED et le travail en pénombre.',
    colorScheme: 'dark',
    swatches: ['#000000', '#121212', '#4D94FF'],
    colors: {
      bg: '#000000',
      surface: '#121212',
      surface2: '#1A1A1A',
      surfaceRaised: '#242424',
      text: '#F5F5F5',
      textMuted: '#A3A3A3',
      border: '#3A3A3A',
      borderStrong: '#5A5A5A',
      brand: '#4D94FF',
      primary: '#4D94FF',
      brandContrast: '#FFFFFF',
      brandHover: '#70A9FF',
      accent: '#00D2FF',
      danger: '#FF5A61',
      buttonPrimaryBg: '#0066FF',
      buttonPrimaryText: '#FFFFFF',
      buttonDangerBg: '#D91C24',
      buttonDangerText: '#FFFFFF',
    },
  },
  bleu: {
    id: 'bleu',
    name: 'Bleu',
    label: 'Bleu',
    shortLabel: 'Cobalt',
    description: 'Bleu cobalt identitaire SENTINEL GESTION avec bouton blanc contrasté et accents cyan.',
    colorScheme: 'dark',
    swatches: ['#0A3FA8', '#1250C8', '#00D2FF'],
    colors: {
      bg: '#0A3FA8',
      surface: '#1250C8',
      surface2: '#0E47B8',
      surfaceRaised: '#185FE0',
      text: '#FFFFFF',
      textMuted: '#C7D7F5',
      border: '#447DF2',
      borderStrong: '#7AA6FC',
      brand: '#00D2FF',
      primary: '#00D2FF',
      brandContrast: '#0A3FA8',
      brandHover: '#70E6FF',
      accent: '#00D2FF',
      danger: '#FFFFFF',
      buttonPrimaryBg: '#FFFFFF',
      buttonPrimaryText: '#0A3FA8',
      buttonDangerBg: '#D91C24',
      buttonDangerText: '#FFFFFF',
    },
  },
  nuit: {
    id: 'nuit',
    name: 'Bleu de nuit',
    label: 'Bleu de nuit',
    shortLabel: 'Marine',
    description: 'Bleu marine feutré (#0B132B), élégant et reposant pour les yeux au quotidien.',
    colorScheme: 'dark',
    swatches: ['#0B132B', '#111D4A', '#4D94FF'],
    colors: {
      bg: '#0B132B',
      surface: '#111D4A',
      surface2: '#1C2541',
      surfaceRaised: '#1E2D5A',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      border: '#3A4B75',
      borderStrong: '#576B9B',
      brand: '#4D94FF',
      primary: '#4D94FF',
      brandContrast: '#FFFFFF',
      brandHover: '#70A9FF',
      accent: '#00D2FF',
      danger: '#FF5A61',
      buttonPrimaryBg: '#0066FF',
      buttonPrimaryText: '#FFFFFF',
      buttonDangerBg: '#D91C24',
      buttonDangerText: '#FFFFFF',
    },
  },
};

export const THEME_STORAGE_KEY = 'sentinel_theme';
export const LEGACY_THEME_KEY = 'sentinel_theme_variant';
export const LEGACY_MODE_KEY = 'sentinel_theme_mode';
export const DEFAULT_THEME: ThemeId = 'nuit';
export const THEME_ORDER: ThemeId[] = ['blanc', 'noir', 'bleu', 'nuit'];

/**
 * Valide si une valeur correspond à un thème connu
 */
export function isValidThemeId(value: unknown): value is ThemeId {
  return value === 'blanc' || value === 'noir' || value === 'bleu' || value === 'nuit';
}

/**
 * Valide si une valeur est une préférence de thème (y compris 'auto')
 */
export function isValidThemePreference(value: unknown): value is ThemePreference {
  return isValidThemeId(value) || value === 'auto';
}

/**
 * Résout le thème actif en tenant compte de 'auto' et de prefers-color-scheme
 */
export function resolveTheme(preference: ThemePreference): ThemeId {
  if (preference === 'auto') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'nuit' : 'blanc';
    }
    return DEFAULT_THEME;
  }
  return isValidThemeId(preference) ? preference : DEFAULT_THEME;
}

/**
 * Récupère la préférence de thème enregistrée dans localStorage avec migration des anciennes clés
 */
export function getStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isValidThemePreference(stored)) {
      return stored;
    }

    // Migration des anciennes clés
    const legacyMode = window.localStorage.getItem(LEGACY_MODE_KEY);
    const legacyVariant = window.localStorage.getItem(LEGACY_THEME_KEY);

    if (legacyMode === 'light') {
      window.localStorage.setItem(THEME_STORAGE_KEY, 'blanc');
      return 'blanc';
    }
    if (legacyVariant === 'blue' || legacyMode === 'dark') {
      window.localStorage.setItem(THEME_STORAGE_KEY, 'nuit');
      return 'nuit';
    }
  } catch {
    // Accès localStorage restreint
  }
  return DEFAULT_THEME;
}

/**
 * Applique le thème au DOM (data-theme, color-scheme, classe dark/light)
 */
export function applyTheme(preference: ThemePreference): ThemeId {
  if (typeof window === 'undefined') {
    return resolveTheme(preference);
  }

  const activeTheme = resolveTheme(preference);
  const themeData = THEMES[activeTheme];

  try {
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.documentElement.setAttribute('data-theme-preference', preference);
    document.documentElement.style.colorScheme = themeData.colorScheme;

    if (themeData.colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, preference);

    // Diffusion d'un événement personnalisé
    window.dispatchEvent(
      new CustomEvent('sentinel-theme-change', {
        detail: {
          preference,
          activeTheme,
          themeData,
        },
      })
    );
  } catch (err) {
    console.warn('[Sentinel Theme] Erreur d’application:', err);
  }

  return activeTheme;
}

/**
 * Retourne le thème suivant dans l'ordre cyclique (Blanc -> Noir -> Bleu -> Bleu de nuit -> Blanc)
 */
export function getNextTheme(current: ThemeId): ThemeId {
  const currentIndex = THEME_ORDER.indexOf(current);
  const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
  return THEME_ORDER[nextIndex];
}

// ==============================================================================
// GESTION DU SYSTÈME D’APPARENCE (« Noir · Rouge · Blanc » vs Standard)
// ==============================================================================
export type AppearanceMode = 'default' | 'sentinel_rouge';
export const APPEARANCE_STORAGE_KEY = 'sentinel_appearance';
export const DEFAULT_APPEARANCE: AppearanceMode = 'default';

export function isValidAppearanceMode(val: unknown): val is AppearanceMode {
  return val === 'default' || val === 'sentinel_rouge';
}

export function getStoredAppearance(): AppearanceMode {
  if (typeof window === 'undefined') return DEFAULT_APPEARANCE;
  try {
    const val = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return val === 'sentinel_rouge' ? 'sentinel_rouge' : 'default';
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function applyAppearance(mode: AppearanceMode): AppearanceMode {
  if (typeof window === 'undefined') return mode;
  try {
    document.documentElement.setAttribute('data-appearance', mode);
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, mode);
    window.dispatchEvent(
      new CustomEvent('sentinel-appearance-change', {
        detail: { appearance: mode },
      })
    );
  } catch (err) {
    console.warn('[Sentinel Theme] Erreur application apparence:', err);
  }
  return mode;
}

// Rétro-compatibilité pour les composants et tests existants
export const SENTINEL_THEMES = THEMES;
export const DEFAULT_MODE = 'dark';
export function getStoredTheme(): ThemeId {
  return resolveTheme(getStoredThemePreference());
}
export function getStoredMode(): 'dark' | 'light' {
  return THEMES[getStoredTheme()].colorScheme;
}
export function isValidTheme(val: unknown): val is ThemeId {
  return isValidThemeId(val);
}
export function isValidMode(val: unknown): val is 'dark' | 'light' {
  return val === 'dark' || val === 'light';
}
