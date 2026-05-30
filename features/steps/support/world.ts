import { setWorldConstructor, World, type IWorldOptions, After } from '@cucumber/cucumber';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { renderHook } from '@testing-library/react';
import { createSupabaseMock } from '@/test/mocks/supabase-factory';
import { createStatefulSupabase, type StatefulDb } from './stateful-supabase.js';
import type { CharacterBuild } from '@/types/choices';
import type { ResolvedCharacter } from '@/types/resolved';
import type { Campaign } from '@/types/database';

// Resolve @/ alias to absolute path — esmock requires absolute paths for module IDs
const srcDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../src');
function resolveAlias(modulePath: string): string {
  return modulePath.startsWith('@/') ? path.join(srcDir, modulePath.slice(2)) : modulePath;
}

// i18n must be initialized once before any component using useTranslation renders.
let _i18nReady = false;
async function ensureI18n(): Promise<void> {
  if (_i18nReady) return;
  await import('@/lib/i18n');
  _i18nReady = true;
}

/** Result of rendering a page through the render-app seam. */
export interface RenderRouteResult {
  /** @testing-library/react screen queries bound to the jsdom document. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  screen: any;
  /** Current router pathname (updates as the app navigates) — for redirect assertions. */
  getPath: () => string;
  /** The full @testing-library/react module (render, screen, fireEvent, act, waitFor). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rtl: any;
}

export interface DndWorld extends World {
  supabase: ReturnType<typeof createSupabaseMock>['supabase'];
  mockQueryResult: ReturnType<typeof createSupabaseMock>['mockQueryResult'];
  queryClient: QueryClient;
  importWithSupabase: (modulePath: string) => Promise<Record<string, unknown>>;
  createWrapper: () => (props: { children: React.ReactNode }) => React.ReactElement;
  // --- Render-app seam (campaigns / finalize) ---
  /** Stateful, query-aware in-memory Supabase store. Seed rows, then render real pages. */
  db: StatefulDb;
  /** The stateful supabase client injected into pages/hooks via esmockWithSupabase. */
  statefulSupabase: unknown;
  /** esmock a module with the stateful supabase injected for '@/lib/supabase'.
   *  Pass extraDefs to also replace other direct deps (e.g. a hook module re-esmocked
   *  with supabase, or '@/hooks/usePageTitle': { usePageTitle: () => {} }). Keys may use '@/' aliases. */
  esmockWithSupabase: (modulePath: string, extraDefs?: Record<string, unknown>) => Promise<Record<string, unknown>>;
  /** Render a React element at a route through MemoryRouter + QueryClientProvider into jsdom. */
  renderRoute: (route: string, element: React.ReactElement) => Promise<RenderRouteResult>;
  /** Unmount the last rendered tree (called automatically in After). */
  cleanupRender: () => void;
  /** Result of the most recent renderRoute() call. */
  renderRouteResult?: RenderRouteResult;
  // Per-scenario state — step files write/read via this.* instead of module-level lets
  abilityScore?: number;
  build?: CharacterBuild;
  resolvedAtLevel?: ResolvedCharacter;
  /** Resolved character for the shared character-build seam (character-common.steps.ts) */
  resolved?: ResolvedCharacter;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hookResult?: ReturnType<typeof renderHook<any, any>>;
  // Campaign-specific scenario state
  createdCampaign?: Campaign;
  mutationResult?: Campaign;
  globalThemeId?: string;
  openedCampaignName?: string;
  /** Full campaign store (includes archived) — steps seed this; view steps filter it per query semantics */
  campaignStore: Campaign[];
}

class DndWorldImpl extends World implements DndWorld {
  supabase: ReturnType<typeof createSupabaseMock>['supabase'];
  mockQueryResult: ReturnType<typeof createSupabaseMock>['mockQueryResult'];
  queryClient: QueryClient;
  db: StatefulDb;
  statefulSupabase: unknown;
  private currentPath = '/';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private renderResult: any = null;
  renderRouteResult?: RenderRouteResult;
  abilityScore?: number;
  build?: CharacterBuild;
  resolvedAtLevel?: ResolvedCharacter;
  resolved?: ResolvedCharacter;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hookResult?: ReturnType<typeof renderHook<any, any>>;
  createdCampaign?: Campaign;
  mutationResult?: Campaign;
  globalThemeId?: string;
  openedCampaignName?: string;
  campaignStore: Campaign[] = [];
  private dom: JSDOM;

  constructor(options: IWorldOptions) {
    super(options);
    const mock = createSupabaseMock();
    this.supabase = mock.supabase;
    this.mockQueryResult = mock.mockQueryResult;

    const stateful = createStatefulSupabase();
    this.statefulSupabase = stateful.supabase;
    this.db = stateful.db;

    this.queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    // Bootstrap jsdom for React Testing Library
    this.dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
      url: 'http://localhost',
    });
    globalThis.document = this.dom.window.document;
    // @ts-expect-error - globalThis assignment for jsdom
    globalThis.window = this.dom.window;
    Object.defineProperty(globalThis, 'navigator', {
      value: this.dom.window.navigator,
      writable: true,
      configurable: true,
    });

    // Expose jsdom localStorage on globalThis so readStoredTheme/writeStoredTheme work
    Object.defineProperty(globalThis, 'localStorage', {
      value: this.dom.window.localStorage,
      writable: true,
      configurable: true,
    });

    // Expose DOM constructor globals that libraries reference directly (e.g. @floating-ui
    // checks `el instanceof HTMLElement` against the global). Without these, rendering real
    // components that pull in @base-ui/react throws "HTMLElement is not defined".
    for (const key of [
      'HTMLElement',
      'HTMLButtonElement',
      'HTMLInputElement',
      'HTMLAnchorElement',
      'HTMLFormElement',
      'Element',
      'Node',
      'DocumentFragment',
      'getComputedStyle',
      'Event',
      'CustomEvent',
      'MutationObserver',
      'requestAnimationFrame',
      'cancelAnimationFrame',
    ]) {
      const value = (this.dom.window as unknown as Record<string, unknown>)[key];
      if (value !== undefined) {
        Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
      }
    }

    // jsdom doesn't implement matchMedia — stub it so ThemeProvider can render
    Object.defineProperty(this.dom.window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
  }

  async importWithSupabase(modulePath: string): Promise<Record<string, unknown>> {
    const { default: esmock } = await import('esmock');
    return esmock(resolveAlias(modulePath), {
      [resolveAlias('@/lib/supabase')]: { supabase: this.supabase },
    });
  }

  createWrapper() {
    const qc = this.queryClient;
    return function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
      return createElement(QueryClientProvider, { client: qc }, children);
    };
  }

  async esmockWithSupabase(
    modulePath: string,
    extraDefs: Record<string, unknown> = {}
  ): Promise<Record<string, unknown>> {
    const { default: esmock } = await import('esmock');
    const defs: Record<string, unknown> = {
      [resolveAlias('@/lib/supabase')]: { supabase: this.statefulSupabase },
    };
    for (const [key, value] of Object.entries(extraDefs)) {
      defs[resolveAlias(key)] = value;
    }
    // Shallow esmock only (direct-dep replacement). A deep/global mock breaks module
    // resolution under the tsx custom loader, so callers re-esmock each hook module
    // that imports supabase and pass it in via extraDefs.
    return esmock(resolveAlias(modulePath), defs);
  }

  async renderRoute(route: string, element: React.ReactElement): Promise<RenderRouteResult> {
    await ensureI18n();
    this.currentPath = route;
    const rtl = await import('@testing-library/react');
    const router = (await import('react-router-dom')) as typeof import('react-router-dom');

    const setPath = (p: string) => {
      this.currentPath = p;
    };
    function LocationCapture(): null {
      const location = router.useLocation();
      setPath(location.pathname);
      return null;
    }

    const tree = createElement(
      QueryClientProvider,
      { client: this.queryClient },
      createElement(router.MemoryRouter, { initialEntries: [route] }, createElement(LocationCapture), element)
    );

    await rtl.act(async () => {
      this.renderResult = rtl.render(tree);
    });

    const result: RenderRouteResult = {
      screen: rtl.screen,
      getPath: () => this.currentPath,
      rtl,
    };
    this.renderRouteResult = result;
    return result;
  }

  cleanupRender(): void {
    try {
      this.renderResult?.unmount?.();
    } catch {
      /* ignore */
    }
    this.renderResult = null;
  }
}

setWorldConstructor(DndWorldImpl);

After(function (this: DndWorld) {
  try {
    this.cleanupRender();
  } catch {
    /* ignore */
  }
  try {
    this.db.reset();
  } catch {
    /* ignore */
  }
  try {
    this.queryClient.clear();
  } catch {
    /* ignore */
  }
  try {
    this.queryClient.unmount();
  } catch {
    /* ignore */
  }
  try {
    (globalThis.window as { close?: () => void } | undefined)?.close?.();
  } catch {
    /* ignore */
  }
  try {
    delete (globalThis as { document?: Document }).document;
  } catch {
    /* ignore */
  }
  try {
    delete (globalThis as { window?: Window }).window;
  } catch {
    /* ignore */
  }
  try {
    delete (globalThis as { navigator?: Navigator }).navigator;
  } catch {
    /* ignore */
  }
});
