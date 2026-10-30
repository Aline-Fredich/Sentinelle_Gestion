'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  type ThemeId,
  type ThemePreference,
  type ThemeDefinition,
  THEMES,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  resolveTheme,
  getStoredThemePreference,
  applyTheme,
  getNextTheme,
  type AppearanceMode,
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  getStoredAppearance,
  applyAppearance,
} from '@/lib/theme';

interface ThemeContextType {
  preference: ThemePreference;
  theme: ThemeId;
  themeData: ThemeDefinition;
  setTheme: (pref: ThemePreference) => void;
  cycleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
  isBlanc: boolean;
  isNoir: boolean;
  isBleu: boolean;
  isNuit: boolean;
  themesList: ThemeDefinition[];
  appearance: AppearanceMode;
  setAppearance: (mode: AppearanceMode) => void;
  toggleAppearance: () => void;
  isSentinelRouge: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_THEME);
  const [resolved, setResolved] = useState<ThemeId>(DEFAULT_THEME);
  const [appearance, setAppearanceState] = useState<AppearanceMode>(DEFAULT_APPEARANCE);
  const [isMounted, setIsMounted] = useState(false);

  const [toastTheme, setToastTheme] = useState<ThemeId | null>(null);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = useCallback((themeId: ThemeId) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastTheme(themeId);
    toastTimerRef.current = setTimeout(() => {
      setToastTheme(null);
    }, 1900);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const initialPref = getStoredThemePreference();
    const active = applyTheme(initialPref);
    setPreferenceState(initialPref);
    setResolved(active);

    const initialAppearance = getStoredAppearance();
    applyAppearance(initialAppearance);
    setAppearanceState(initialAppearance);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && event.newValue) {
        const nextActive = applyTheme(event.newValue as ThemePreference);
        setPreferenceState(event.newValue as ThemePreference);
        setResolved(nextActive);
      }
      if (event.key === APPEARANCE_STORAGE_KEY && event.newValue) {
        const nextApp = event.newValue as AppearanceMode;
        applyAppearance(nextApp);
        setAppearanceState(nextApp);
      }
    };

    // Écoute du changement système si préférence 'auto'
    const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const handleMediaChange = () => {
      if (preference === 'auto') {
        const activeTheme = applyTheme('auto');
        setResolved(activeTheme);
      }
    };

    mediaQuery?.addEventListener('change', handleMediaChange);
    window.addEventListener('storage', handleStorage);

    // Raccourci clavier Alt+T pour passer au thème suivant avec toast HUD
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        setPreferenceState(prev => {
          const currentResolved = resolveTheme(prev);
          const next = getNextTheme(currentResolved);
          applyTheme(next);
          setResolved(next);
          triggerToast(next);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      mediaQuery?.removeEventListener('change', handleMediaChange);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [preference, triggerToast]);

  const setTheme = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    const active = applyTheme(pref);
    setResolved(active);
  }, []);

  const setAppearance = useCallback((mode: AppearanceMode) => {
    setAppearanceState(mode);
    applyAppearance(mode);
  }, []);

  const toggleAppearance = useCallback(() => {
    const next: AppearanceMode = appearance === 'sentinel_rouge' ? 'default' : 'sentinel_rouge';
    setAppearance(next);
  }, [appearance, setAppearance]);

  const cycleTheme = useCallback(() => {
    const next = getNextTheme(resolved);
    setTheme(next);
    triggerToast(next);
  }, [resolved, setTheme, triggerToast]);

  const value = useMemo<ThemeContextType>(() => {
    const currentTheme = isMounted ? resolved : DEFAULT_THEME;
    const themeData = THEMES[currentTheme];
    const isDark = themeData.colorScheme === 'dark';
    const isSentinelRouge = appearance === 'sentinel_rouge';

    return {
      preference: isMounted ? preference : DEFAULT_THEME,
      theme: currentTheme,
      themeData,
      setTheme,
      cycleTheme,
      isDark,
      isLight: !isDark,
      isBlanc: currentTheme === 'blanc',
      isNoir: currentTheme === 'noir',
      isBleu: currentTheme === 'bleu',
      isNuit: currentTheme === 'nuit',
      themesList: Object.values(THEMES),
      appearance,
      setAppearance,
      toggleAppearance,
      isSentinelRouge,
    };
  }, [preference, resolved, isMounted, setTheme, cycleTheme, appearance, setAppearance, toggleAppearance]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {toastTheme && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-2.5 rounded-lg shadow-2xl border border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--text)] text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none select-none"
        >
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ring-2 ring-white/20"
            style={{ backgroundColor: THEMES[toastTheme].colors.primary }}
          />
          <span>
            Thème actif : <strong className="font-bold text-[var(--text)]">{THEMES[toastTheme].label}</strong>
          </span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono ml-1 px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)]">
            Alt+T
          </span>
        </aside>
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    const fallbackTheme = DEFAULT_THEME;
    const themeData = THEMES[fallbackTheme];
    return {
      preference: DEFAULT_THEME,
      theme: fallbackTheme,
      themeData,
      setTheme: () => {},
      cycleTheme: () => {},
      isDark: themeData.colorScheme === 'dark',
      isLight: themeData.colorScheme === 'light',
      isBlanc: false,
      isNoir: false,
      isBleu: false,
      isNuit: true,
      themesList: Object.values(THEMES),
      appearance: DEFAULT_APPEARANCE,
      setAppearance: () => {},
      toggleAppearance: () => {},
      isSentinelRouge: false,
    };
  }
  return ctx;
}
