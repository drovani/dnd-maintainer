import {
  setupMockReset,
  describeListQuery,
  describeSingleQuery,
  renderHook,
  waitFor,
  createWrapper,
  supabase,
  mockQueryResult,
} from '@/test/hook-test-helpers';

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase'));

import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useCampaigns, useCampaign, useCampaignMutations } from '@/hooks/useCampaigns';
import type { Campaign, CampaignSummary } from '@/types/database';
import { CAMPAIGN_SUMMARY_COLS } from '@/lib/query-columns';

// Wrapper that exposes its QueryClient so tests can seed and inspect the cache
// (the shared createWrapper() keeps its client private).
function wrapperWithClient(): { queryClient: QueryClient; Wrapper: (props: { children: ReactNode }) => ReactNode } {
  // gcTime: Infinity keeps observer-less cache entries (seeded directly via
  // setQueryData) alive so the mutation's in-place patches are observable.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }): ReactNode =>
    createElement(ThemeProvider, null, createElement(QueryClientProvider, { client: queryClient }, children));
  return { queryClient, Wrapper };
}

const baseCampaign: Campaign = {
  id: 'camp-1',
  slug: 'test-campaign-camp',
  previous_slugs: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  name: 'Test Campaign',
  status: 'active',
  description: null,
  setting: null,
  image_url: null,
  dm_notes: null,
  theme: null,
  archived_at: null,
  allowed_source_books: ['phb-2024'],
};

setupMockReset();

// useCampaigns has no id param — pass null to skip the "does not fetch" test
describeListQuery(
  'useCampaigns',
  () => renderHook(() => useCampaigns(), { wrapper: createWrapper() }),
  baseCampaign,
  null
);

describe('useCampaigns ordering', () => {
  it('orders by the last_activity_at computed field, descending', async () => {
    // Ordering is done server-side by the PostgREST `last_activity_at` computed
    // field (most recent session date, falling back to created_at), decoupling list
    // order from `updated_at` so theme/metadata edits don't reorder campaigns.
    mockQueryResult.data = [baseCampaign];

    const { result } = renderHook(() => useCampaigns(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.select).toHaveBeenCalledWith(CAMPAIGN_SUMMARY_COLS);
    expect(supabase.order).toHaveBeenCalledWith('last_activity_at', { ascending: false });
  });
});

describeSingleQuery(
  'useCampaign',
  (id) => renderHook(() => useCampaign(id as string | undefined), { wrapper: createWrapper() }),
  baseCampaign,
  'camp-1',
  undefined
);

describe('useCampaign slug query pattern', () => {
  it('queries by slug using .or() with both slug and previous_slugs', async () => {
    mockQueryResult.data = baseCampaign;

    const { result } = renderHook(() => useCampaign('test-slug'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(supabase.or).toHaveBeenCalledWith('slug.eq.test-slug,previous_slugs.cs.{"test-slug"}');
  });

  it('throws when slug contains invalid characters', async () => {
    const { result } = renderHook(() => useCampaign('bad,slug'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useCampaignMutations', () => {
  it('create inserts with status planning', async () => {
    mockQueryResult.data = { ...baseCampaign, status: 'planning' };

    const { result } = renderHook(() => useCampaignMutations(), { wrapper: createWrapper() });

    result.current.create.mutate({ name: 'New Campaign' });

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true));
    expect(supabase.insert).toHaveBeenCalledWith(expect.objectContaining({ status: 'planning' }));
  });

  it('update patches the campaign by id', async () => {
    const updated = { ...baseCampaign, name: 'Updated Name' };
    mockQueryResult.data = updated;

    const { result } = renderHook(() => useCampaignMutations(), { wrapper: createWrapper() });

    result.current.update.mutate({ id: 'camp-1', name: 'Updated Name' });

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
    expect(supabase.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }));
    expect(supabase.eq).toHaveBeenCalledWith('id', 'camp-1');
  });

  it('update patches the list and detail caches in place rather than refetching', async () => {
    const { queryClient, Wrapper } = wrapperWithClient();
    const campA: Campaign = { ...baseCampaign, id: 'camp-1', slug: 'a', theme: null };
    const campB: Campaign = { ...baseCampaign, id: 'camp-2', slug: 'b', theme: 'sylvan' };
    // Seed a two-item list. A refetch would replace it with mockQueryResult.data
    // (a single object), so an intact [A, B] proves the cache was patched in place.
    queryClient.setQueryData(['campaigns'], [campA, campB]);
    queryClient.setQueryData(['campaign', 'a'], campA);

    mockQueryResult.data = { ...campA, theme: 'arcane' };

    const { result } = renderHook(() => useCampaignMutations(), { wrapper: Wrapper });
    result.current.update.mutate({ id: 'camp-1', theme: 'arcane' });
    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));

    const list = queryClient.getQueryData<CampaignSummary[]>(['campaigns'])!;
    expect(list.map((c) => c.id)).toEqual(['camp-1', 'camp-2']); // order preserved, B untouched
    expect(list[0].theme).toBe('arcane'); // matching row patched
    expect('allowed_source_books' in list[0]).toBe(false); // projected down to the summary shape
    expect(queryClient.getQueryData<Campaign>(['campaign', 'a'])!.theme).toBe('arcane');
  });

  it('update on rename refreshes the old-slug detail cache without a round-trip', async () => {
    const { queryClient, Wrapper } = wrapperWithClient();
    const original: Campaign = { ...baseCampaign, id: 'camp-1', slug: 'old-name', name: 'Old Name' };
    queryClient.setQueryData(['campaign', 'old-name'], original);

    mockQueryResult.data = { ...original, slug: 'new-name', name: 'New Name', previous_slugs: ['old-name'] };

    const { result } = renderHook(() => useCampaignMutations(), { wrapper: Wrapper });
    result.current.update.mutate({ id: 'camp-1', name: 'New Name' });
    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));

    // onMutate captured 'old-name' by id; onSuccess wrote the fresh row to both keys.
    expect(queryClient.getQueryData<Campaign>(['campaign', 'new-name'])!.name).toBe('New Name');
    expect(queryClient.getQueryData<Campaign>(['campaign', 'old-name'])!.name).toBe('New Name');
  });

  it('archive sets archived_at to an ISO string', async () => {
    mockQueryResult.data = null;

    const { result } = renderHook(() => useCampaignMutations(), { wrapper: createWrapper() });

    result.current.archive.mutate('camp-1');

    await waitFor(() => expect(result.current.archive.isSuccess).toBe(true));
    expect(supabase.update).toHaveBeenCalledWith(expect.objectContaining({ archived_at: expect.any(String) }));
    expect(supabase.eq).toHaveBeenCalledWith('id', 'camp-1');
  });
});
