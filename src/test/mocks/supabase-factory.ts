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
  supabase: MockBuilder & { storage: MockStorage };
  mockQueryResult: { data: unknown; error: unknown };
  mockStorageResult: { data: unknown; error: unknown; publicUrl: string };
}

export interface MockBucketRef {
  upload: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
  remove: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
  getPublicUrl: (...args: unknown[]) => { data: { publicUrl: string } };
}

export interface MockStorage {
  from: (...args: unknown[]) => MockBucketRef;
}

export function createSupabaseMock(spyWrap: SpyWrap = (fn) => fn): SupabaseMockResult {
  const mockQueryResult: { data: unknown; error: unknown } = { data: null, error: null };
  const mockStorageResult: { data: unknown; error: unknown; publicUrl: string } = {
    data: null,
    error: null,
    publicUrl: '',
  };

  const builder = {} as MockBuilder & { storage: MockStorage };
  const self = () => builder;
  for (const m of METHODS) {
    builder[m] = spyWrap(self) as MockBuilder[typeof m];
  }
  builder.then = (resolve, reject) => Promise.resolve({ ...mockQueryResult }).then(resolve, reject);

  // Stable bucket reference — storage.from() always returns the same bucketRef object
  // so that spy assertions can be made on the same references across multiple calls.
  const bucketRef: MockBucketRef = {
    upload: spyWrap(async () => ({
      data: mockStorageResult.data,
      error: mockStorageResult.error,
    })) as MockBucketRef['upload'],
    remove: spyWrap(async () => ({
      data: mockStorageResult.data,
      error: mockStorageResult.error,
    })) as MockBucketRef['remove'],
    getPublicUrl: spyWrap(() => ({
      data: { publicUrl: mockStorageResult.publicUrl },
    })) as MockBucketRef['getPublicUrl'],
  };

  const storage: MockStorage = {
    from: spyWrap(() => bucketRef) as MockStorage['from'],
  };

  builder.storage = storage;

  return { supabase: builder, mockQueryResult, mockStorageResult };
}
