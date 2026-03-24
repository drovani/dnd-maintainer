import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import i18next from 'i18next';
import {
  type ColorMode,
  type ResolvedMode,
  type ThemeId,
  applyThemeToDOM,
  readStoredColorMode,
  readStoredTheme,
  writeStoredColorMode,
  writeStoredTheme,
} from '@/lib/theme';

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  resolvedMode: ResolvedMode;
  campaignThemeOverride: ThemeId | null;
  setCampaignThemeOverride: (id: ThemeId | null) => void;
  effectiveTheme: ThemeId;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribeToSystemPreference(callback: () => void): () => void {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function deriveResolvedMode(colorMode: ColorMode, systemPrefersDark: boolean): ResolvedMode {
  if (colorMode === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return colorMode;
}

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [theme, setThemeState] = useState<ThemeId>(readStoredTheme);
  const [colorMode, setColorModeState] = useState<ColorMode>(readStoredColorMode);
  const [campaignThemeOverride, setCampaignThemeOverride] = useState<ThemeId | null>(null);

  const systemPrefersDark = useSyncExternalStore(subscribeToSystemPreference, getSystemPrefersDark);
  const resolvedMode = deriveResolvedMode(colorMode, systemPrefersDark);

  const warnPersistenceFailed = useCallback(() => {
    toast.warning(i18next.t('errors.themeNotPersisted', { ns: 'common' }));
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
    if (!writeStoredTheme(id)) warnPersistenceFailed();
  }, [warnPersistenceFailed]);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    if (!writeStoredColorMode(mode)) warnPersistenceFailed();
  }, [warnPersistenceFailed]);

  const effectiveTheme = campaignThemeOverride ?? theme;

  useEffect(() => {
    applyThemeToDOM(effectiveTheme, resolvedMode);
  }, [effectiveTheme, resolvedMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      colorMode,
      setColorMode,
      resolvedMode,
      campaignThemeOverride,
      setCampaignThemeOverride,
      effectiveTheme,
    }),
    [theme, setTheme, colorMode, setColorMode, resolvedMode, campaignThemeOverride, setCampaignThemeOverride, effectiveTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
