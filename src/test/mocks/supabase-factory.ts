const METHODS = [
  'from',
  'select',
  'insert',
  'update',
  'delete',
  'upsert',
  'eq',
  'neq',
  'is',
  'not',
  'or',
  'order',
  'single',
  'maybeSingle',
  'limit',
  'range',
  'contains',
  'match',
  'gte',
  'lte',
  'gt',
  'lt',
  'like',
  'ilike',
  'in',
  'textSearch',
] as const;

type MethodName = (typeof METHODS)[number];
type SpyWrap = (fn: (...args: unknown[]) => unknown) => (...args: unknown[]) => unknown;
type MockBuilder = Record<MethodName, (...args: unknown[]) => MockBuilder> & {
  then: (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => Promise<unknown>;
};

export interface SupabaseMockResult {
  supabase: MockBuilder;
  mockQueryResult: { data: unknown; error: unknown };
}

export function createSupabaseMock(spyWrap: SpyWrap = (fn) => fn): SupabaseMockResult {
  const mockQueryResult: { data: unknown; error: unknown } = { data: null, error: null };
  const builder = {} as MockBuilder;
  const self = () => builder;
  for (const m of METHODS) {
    builder[m] = spyWrap(self) as MockBuilder[typeof m];
  }
  builder.then = (resolve, reject) => Promise.resolve({ ...mockQueryResult }).then(resolve, reject);
  return { supabase: builder, mockQueryResult };
}
