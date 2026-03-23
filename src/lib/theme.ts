export const THEMES = [
  { id: 'default', labelKey: 'settings.themes.default', swatch: 'oklch(0.55 0.14 85)' },
  { id: 'sylvan', labelKey: 'settings.themes.sylvan', swatch: 'oklch(0.50 0.15 155)' },
  { id: 'arcane', labelKey: 'settings.themes.arcane', swatch: 'oklch(0.58 0.18 295)' },
] as const;

export type ThemeMeta = (typeof THEMES)[number];
export type ThemeId = ThemeMeta['id'];
export const THEME_IDS: readonly ThemeId[] = THEMES.map(t => t.id);

export const COLOR_MODES = ['light', 'dark', 'system'] as const;
export type ColorMode = (typeof COLOR_MODES)[number];
export type ResolvedMode = Exclude<ColorMode, 'system'>;

const STORAGE_KEYS = {
  theme: 'dnd-theme',
  colorMode: 'dnd-color-mode',
} as const;

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEME_IDS.includes(value as ThemeId);
}

export function isColorMode(value: unknown): value is ColorMode {
  return typeof value === 'string' && COLOR_MODES.includes(value as ColorMode);
}

export function readStoredTheme(): ThemeId {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.theme);
    return isThemeId(v) ? v : 'default';
  } catch {
    return 'default';
  }
}

export function writeStoredTheme(id: ThemeId): void {
  try {
    localStorage.setItem(STORAGE_KEYS.theme, id);
  } catch {
    // Storage unavailable; in-memory state is still correct
  }
}

export function readStoredColorMode(): ColorMode {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.colorMode);
    return isColorMode(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

export function writeStoredColorMode(mode: ColorMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.colorMode, mode);
  } catch {
    // Storage unavailable; in-memory state is still correct
  }
}

export function resolveColorMode(mode: ColorMode): ResolvedMode {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

export function applyThemeToDOM(theme: ThemeId, resolvedMode: ResolvedMode): void {
  const html = document.documentElement;
  if (theme === 'default') {
    html.removeAttribute('data-theme');
  } else {
    html.setAttribute('data-theme', theme);
  }
  html.classList.toggle('dark', resolvedMode === 'dark');
}
