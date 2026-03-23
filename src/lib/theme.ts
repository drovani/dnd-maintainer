export const THEME_IDS = ['default', 'sylvan', 'arcane'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const COLOR_MODES = ['light', 'dark', 'system'] as const;
export type ColorMode = (typeof COLOR_MODES)[number];
export type ResolvedMode = 'light' | 'dark';

export const THEMES = [
  { id: 'default', labelKey: 'settings.themes.default', swatch: 'oklch(0.55 0.14 85)' },
  { id: 'sylvan', labelKey: 'settings.themes.sylvan', swatch: 'oklch(0.50 0.15 155)' },
  { id: 'arcane', labelKey: 'settings.themes.arcane', swatch: 'oklch(0.58 0.18 295)' },
] as const;

export type ThemeMeta = (typeof THEMES)[number];

const STORAGE_KEYS = {
  theme: 'dnd-theme',
  colorMode: 'dnd-color-mode',
} as const;

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEME_IDS.includes(value as ThemeId);
}

export function readStoredTheme(): ThemeId {
  const v = localStorage.getItem(STORAGE_KEYS.theme);
  return isThemeId(v) ? v : 'default';
}

export function writeStoredTheme(id: ThemeId): void {
  localStorage.setItem(STORAGE_KEYS.theme, id);
}

export function readStoredColorMode(): ColorMode {
  const v = localStorage.getItem(STORAGE_KEYS.colorMode);
  return typeof v === 'string' && COLOR_MODES.includes(v as ColorMode) ? (v as ColorMode) : 'system';
}

export function writeStoredColorMode(mode: ColorMode): void {
  localStorage.setItem(STORAGE_KEYS.colorMode, mode);
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
