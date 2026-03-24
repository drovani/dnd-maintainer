import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.classList.remove('dark');
});

describe('useTheme outside provider', () => {
  it('throws when used outside ThemeProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow('useTheme must be used within a ThemeProvider');
    spy.mockRestore();
  });
});

describe('default values', () => {
  it('returns default theme and system color mode initially', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('default');
    expect(result.current.colorMode).toBe('system');
    expect(result.current.resolvedMode).toBe('light'); // matchMedia mock returns false
    expect(result.current.campaignThemeOverride).toBeNull();
    expect(result.current.effectiveTheme).toBe('default');
  });
});

describe('hydration from localStorage', () => {
  it('reads persisted theme on mount', () => {
    localStorage.setItem('dnd-theme', 'arcane');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('arcane');
    expect(result.current.effectiveTheme).toBe('arcane');
  });

  it('reads persisted color mode on mount', () => {
    localStorage.setItem('dnd-color-mode', 'dark');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.colorMode).toBe('dark');
    expect(result.current.resolvedMode).toBe('dark');
  });
});

describe('setTheme', () => {
  it('updates theme and persists to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setTheme('arcane'));
    expect(result.current.theme).toBe('arcane');
    expect(localStorage.getItem('dnd-theme')).toBe('arcane');
  });
});

describe('setColorMode', () => {
  it('updates color mode, resolvedMode, and persists to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setColorMode('dark'));
    expect(result.current.colorMode).toBe('dark');
    expect(result.current.resolvedMode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('dnd-color-mode')).toBe('dark');
  });

  it('updates to light mode', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setColorMode('dark'));
    act(() => result.current.setColorMode('light'));
    expect(result.current.resolvedMode).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

describe('campaign theme override', () => {
  it('campaignThemeOverride takes precedence over global theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setTheme('sylvan'));
    expect(result.current.effectiveTheme).toBe('sylvan');

    act(() => result.current.setCampaignThemeOverride('arcane'));
    expect(result.current.effectiveTheme).toBe('arcane');
    expect(result.current.theme).toBe('sylvan'); // global unchanged
    expect(document.documentElement.getAttribute('data-theme')).toBe('arcane');
  });

  it('clearing override reverts to global theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setTheme('sylvan'));
    act(() => result.current.setCampaignThemeOverride('arcane'));
    act(() => result.current.setCampaignThemeOverride(null));
    expect(result.current.effectiveTheme).toBe('sylvan');
    expect(document.documentElement.getAttribute('data-theme')).toBe('sylvan');
  });
});

describe('system preference detection', () => {
  it('resolves to dark when system prefers dark and mode is system', () => {
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

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.resolvedMode).toBe('dark');
  });

  it('responds to system preference changes when mode is system', () => {
    let changeHandler: (() => void) | null = null;
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_event: string, handler: EventListenerOrEventListenerObject) => {
        changeHandler = handler as () => void;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.resolvedMode).toBe('light');

    // Simulate system dark mode change — useSyncExternalStore re-reads getSnapshot
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
    act(() => {
      changeHandler?.();
    });
    expect(result.current.resolvedMode).toBe('dark');
  });

  it('ignores system preference when mode is explicit', () => {
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

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setColorMode('light'));
    expect(result.current.resolvedMode).toBe('light');
  });
});

describe('DOM application', () => {
  it('applies default theme without data-theme attribute', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setTheme('default'));
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('applies non-default theme with data-theme attribute', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setTheme('sylvan'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('sylvan');
  });
});
