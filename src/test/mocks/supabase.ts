import { vi } from 'vitest';
import { createSupabaseMock } from '@/test/mocks/supabase-factory';

const mock = createSupabaseMock(((fn) => vi.fn(fn as never)) as Parameters<typeof createSupabaseMock>[0]);

export const { supabase, mockQueryResult } = mock;
