import { setWorldConstructor, World, type IWorldOptions, After } from '@cucumber/cucumber';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { renderHook } from '@testing-library/react';
import { createSupabaseMock } from '@/test/mocks/supabase-factory';
import type { CharacterBuild } from '@/types/choices';
import type { ResolvedCharacter } from '@/types/resolved';
import type { Campaign } from '@/types/database';

// Resolve @/ alias to absolute path — esmock requires absolute paths for module IDs
const srcDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../src');
function resolveAlias(modulePath: string): string {
  return modulePath.startsWith('@/') ? path.join(srcDir, modulePath.slice(2)) : modulePath;
}

export interface DndWorld extends World {
  supabase: ReturnType<typeof createSupabaseMock>['supabase'];
  mockQueryResult: ReturnType<typeof createSupabaseMock>['mockQueryResult'];
  /** Recorded call args per method name — populated by the spy wrapper installed in the constructor */
  supabaseCalls: Record<string, unknown[][]>;
  queryClient: QueryClient;
  importWithSupabase: (modulePath: string) => Promise<Record<string, unknown>>;
  createWrapper: () => (props: { children: React.ReactNode }) => React.ReactElement;
  // Per-scenario state — step files write/read via this.* instead of module-level lets
  abilityScore?: number;
  build?: CharacterBuild;
  resolvedAtLevel?: ResolvedCharacter;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hookResult?: ReturnType<typeof renderHook<any, any>>;
  // Campaign-specific scenario state
  createdCampaign?: Campaign;
  mutationError?: unknown;
  mutationResult?: Campaign;
  globalThemeId?: string;
  openedCampaignName?: string;
  /** Full campaign store (includes archived) — steps seed this; view steps filter it per query semantics */
  campaignStore: Campaign[];
}

class DndWorldImpl extends World implements DndWorld {
  supabase: ReturnType<typeof createSupabaseMock>['supabase'];
  mockQueryResult: ReturnType<typeof createSupabaseMock>['mockQueryResult'];
  supabaseCalls: Record<string, unknown[][]> = {};
  queryClient: QueryClient;
  abilityScore?: number;
  build?: CharacterBuild;
  resolvedAtLevel?: ResolvedCharacter;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hookResult?: ReturnType<typeof renderHook<any, any>>;
  createdCampaign?: Campaign;
  mutationError?: unknown;
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

    // Wrap every supabase method with a call recorder so steps can assert args
    const calls = this.supabaseCalls;
    for (const name of Object.keys(this.supabase) as Array<keyof typeof this.supabase>) {
      if (name === 'then') continue;
      const orig = this.supabase[name] as (...args: unknown[]) => unknown;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.supabase as any)[name] = (...args: unknown[]) => {
        (calls[name] ??= []).push(args);
        return orig(...args);
      };
    }

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
    // @ts-expect-error - globalThis assignment for jsdom
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
}

setWorldConstructor(DndWorldImpl);

After(function (this: DndWorld) {
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
