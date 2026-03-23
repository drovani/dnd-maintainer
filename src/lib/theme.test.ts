import {
  applyThemeToDOM,
  isThemeId,
  readStoredColorMode,
  readStoredTheme,
  resolveColorMode,
  writeStoredColorMode,
  writeStoredTheme,
} from '@/lib/theme';

const THEME_STORAGE_KEY = 'dnd-theme';
const COLOR_MODE_STORAGE_KEY = 'dnd-color-mode';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.classList.remove('dark');
});

// ---------------------------------------------------------------------------
// isThemeId
// ---------------------------------------------------------------------------
describe('isThemeId', () => {
  it.each(['default', 'sylvan', 'arcane'])('returns true for valid theme id "%s"', (id) => {
    expect(isThemeId(id)).toBe(true);
  });

  it.each([
    ['empty string', ''],
    ['unknown string', 'forest'],
    ['number', 42],
    ['null', null],
    ['undefined', undefined],
    ['object', {}],
    ['boolean', true],
  ])('returns false for invalid input: %s', (_label, value) => {
    expect(isThemeId(value)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// readStoredTheme
// ---------------------------------------------------------------------------
describe('readStoredTheme', () => {
  it('returns "default" when localStorage is empty', () => {
    expect(readStoredTheme()).toBe('default');
  });

  it.each(['default', 'sylvan', 'arcane'])('returns stored valid theme "%s"', (id) => {
    localStorage.setItem(THEME_STORAGE_KEY, id);
    expect(readStoredTheme()).toBe(id);
  });

  it('returns "default" for an invalid stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'invalid-theme');
    expect(readStoredTheme()).toBe('default');
  });
});

// ---------------------------------------------------------------------------
// writeStoredTheme
// ---------------------------------------------------------------------------
describe('writeStoredTheme', () => {
  it.each(['default', 'sylvan', 'arcane'] as const)('writes theme "%s" to localStorage', (id) => {
    writeStoredTheme(id);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(id);
  });
});

// ---------------------------------------------------------------------------
// readStoredColorMode
// ---------------------------------------------------------------------------
describe('readStoredColorMode', () => {
  it('returns "system" when localStorage is empty', () => {
    expect(readStoredColorMode()).toBe('system');
  });

  it.each(['light', 'dark', 'system'])('returns stored valid color mode "%s"', (mode) => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
    expect(readStoredColorMode()).toBe(mode);
  });

  it('returns "system" for an invalid stored value', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'auto');
    expect(readStoredColorMode()).toBe('system');
  });
});

// ---------------------------------------------------------------------------
// writeStoredColorMode
// ---------------------------------------------------------------------------
describe('writeStoredColorMode', () => {
  it.each(['light', 'dark', 'system'] as const)('writes color mode "%s" to localStorage', (mode) => {
    writeStoredColorMode(mode);
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe(mode);
  });
});

// ---------------------------------------------------------------------------
// resolveColorMode
// ---------------------------------------------------------------------------
describe('resolveColorMode', () => {
  it('returns "light" for mode "light"', () => {
    expect(resolveColorMode('light')).toBe('light');
  });

  it('returns "dark" for mode "dark"', () => {
    expect(resolveColorMode('dark')).toBe('dark');
  });

  it('returns "dark" for "system" when system preference is dark', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    expect(resolveColorMode('system')).toBe('dark');
  });

  it('returns "light" for "system" when system preference is light', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    expect(resolveColorMode('system')).toBe('light');
  });
});

// ---------------------------------------------------------------------------
// applyThemeToDOM
// ---------------------------------------------------------------------------
describe('applyThemeToDOM', () => {
  it('removes data-theme attribute for "default" theme in light mode', () => {
    applyThemeToDOM('default', 'light');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('removes data-theme attribute for "default" theme in dark mode', () => {
    applyThemeToDOM('default', 'dark');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('sets data-theme attribute for "sylvan" theme in light mode', () => {
    applyThemeToDOM('sylvan', 'light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('sylvan');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('sets data-theme attribute for "sylvan" theme in dark mode', () => {
    applyThemeToDOM('sylvan', 'dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('sylvan');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('sets data-theme attribute for "arcane" theme in light mode', () => {
    applyThemeToDOM('arcane', 'light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('arcane');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('clears data-theme when switching from non-default to "default"', () => {
    document.documentElement.setAttribute('data-theme', 'sylvan');
    applyThemeToDOM('default', 'light');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('removes dark class when switching from dark to light mode', () => {
    document.documentElement.classList.add('dark');
    applyThemeToDOM('default', 'light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
