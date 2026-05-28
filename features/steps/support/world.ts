import { setWorldConstructor, World, type IWorldOptions } from '@cucumber/cucumber';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { JSDOM } from 'jsdom';
import { createSupabaseMock } from '@/test/mocks/supabase-factory';

export interface DndWorld extends World {
  supabase: ReturnType<typeof createSupabaseMock>['supabase'];
  mockQueryResult: ReturnType<typeof createSupabaseMock>['mockQueryResult'];
  queryClient: QueryClient;
  importWithSupabase: (modulePath: string) => Promise<Record<string, unknown>>;
  createWrapper: () => (props: { children: React.ReactNode }) => React.ReactElement;
}

class DndWorldImpl extends World implements DndWorld {
  supabase: ReturnType<typeof createSupabaseMock>['supabase'];
  mockQueryResult: ReturnType<typeof createSupabaseMock>['mockQueryResult'];
  queryClient: QueryClient;

  constructor(options: IWorldOptions) {
    super(options);
    const mock = createSupabaseMock();
    this.supabase = mock.supabase;
    this.mockQueryResult = mock.mockQueryResult;
    this.queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    // Bootstrap jsdom for React Testing Library
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
      url: 'http://localhost',
    });
    // @ts-expect-error - globalThis assignment for jsdom
    globalThis.document = dom.window.document;
    // @ts-expect-error - globalThis assignment for jsdom
    globalThis.window = dom.window;
    Object.defineProperty(globalThis, 'navigator', {
      value: dom.window.navigator,
      writable: true,
      configurable: true,
    });
  }

  async importWithSupabase(modulePath: string): Promise<Record<string, unknown>> {
    const { default: esmock } = await import('esmock');
    return esmock(modulePath, { '@/lib/supabase': { supabase: this.supabase } });
  }

  createWrapper() {
    const qc = this.queryClient;
    return function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
      return createElement(QueryClientProvider, { client: qc }, children);
    };
  }
}

setWorldConstructor(DndWorldImpl);
