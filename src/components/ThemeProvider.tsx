import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  type ColorMode,
  type ResolvedMode,
  type ThemeId,
  applyThemeToDOM,
  readStoredColorMode,
  readStoredTheme,
  resolveColorMode,
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
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [theme, setThemeState] = useState<ThemeId>(readStoredTheme);
  const [colorMode, setColorModeState] = useState<ColorMode>(readStoredColorMode);
  const [resolvedMode, setResolvedMode] = useState<ResolvedMode>(() => resolveColorMode(colorMode));
  const [campaignThemeOverride, setCampaignThemeOverride] = useState<ThemeId | null>(null);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
    writeStoredTheme(id);
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    writeStoredColorMode(mode);
    setResolvedMode(resolveColorMode(mode));
  }, []);

  // Listen to system preference changes when mode is "system"
  useEffect(() => {
    if (colorMode !== 'system') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent): void => {
      setResolvedMode(e.matches ? 'dark' : 'light');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [colorMode]);

  // Apply theme to DOM whenever effective theme or mode changes
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
    }),
    [theme, setTheme, colorMode, setColorMode, resolvedMode, campaignThemeOverride],
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
