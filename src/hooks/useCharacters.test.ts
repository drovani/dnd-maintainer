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

import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCharacters,
  useCharacter,
  usePlayerNames,
  useCharacterMutations,
  useCampaignDrafts,
} from '@/hooks/useCharacters';
import type { Character, CharacterSummary } from '@/types/database';

const baseCharacter: Character = {
  id: 'char-1',
  slug: 'aria-silverw-char',
  previous_slugs: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  campaign_id: 'camp-1',
  name: 'Aria Silverwind',
  player_name: 'Alice',
  character_type: 'pc',
  species: 'elf',
  class: 'wizard',
  subclass: null,
  level: 3,
  background: 'sage',
  alignment: 'ng',
  gender: null,
  size: null,
  age: null,
  height: null,
  weight: null,
  eye_color: null,
  hair_color: null,
  skin_color: null,
  hit_points_max: 18,
  armor_class: 12,
  speed: 30,
  proficiency_bonus: 2,
  personality_traits: null,
  ideals: null,
  bonds: null,
  flaws: null,
  appearance: null,
  backstory: null,
  notes: null,
  portrait_url: null,
  is_active: true,
  status: 'ready',
  weapon_masteries: null,
  heroic_inspiration: false,
  exhaustion_level: 0 as const,
  conditions: [],
  hit_dice_used: null,
  spell_slots_used: null,
};

const baseDraftSummary: CharacterSummary = {
  id: 'char-2',
  slug: 'brynn-draft',
  previous_slugs: [],
  updated_at: '2024-06-01T00:00:00Z',
  campaign_id: 'camp-1',
  name: 'Brynn',
  player_name: 'Bob',
  character_type: 'pc',
  species: 'human',
  class: 'fighter',
  subclass: null,
  background: 'soldier',
  level: 1,
  hit_points_max: 12,
  armor_class: 16,
  portrait_url: null,
  status: 'draft',
};

setupMockReset();

describe('useCampaignDrafts', () => {
  // Test 1 — success and disabled paths via shared helper
  describeListQuery(
    'useCampaignDrafts',
    () => renderHook(() => useCampaignDrafts('camp-1'), { wrapper: createWrapper() }),
    baseDraftSummary,
    () => renderHook(() => useCampaignDrafts(''), { wrapper: createWrapper() }),
    'campaign_id'
  );

  // Test 2 — filter and ordering contract
  it('filters by status=draft and orders by updated_at descending', async () => {
    mockQueryResult.data = [baseDraftSummary];

    const { result } = renderHook(() => useCampaignDrafts('camp-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(supabase.eq).toHaveBeenCalledWith('status', 'draft');
    expect(supabase.order).toHaveBeenCalledWith('updated_at', { ascending: false });
  });

  // Test 3 — freezing contract: invalidating ['characters', campaignId] must NOT refetch
  // the ['campaign-drafts', campaignId] query (distinct key, staleTime: Infinity).
  it('is not refetched when the characters query key is invalidated', async () => {
    mockQueryResult.data = [baseDraftSummary];

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);

    const { result } = renderHook(() => useCampaignDrafts('camp-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Record supabase.from call count after initial fetch
    const callsBefore = vi.mocked(supabase.from).mock.calls.length;

    // Invalidate the sibling key that autosave/finalize touches — must NOT affect drafts query
    await client.invalidateQueries({ queryKey: ['characters', 'camp-1'] });

    // staleTime: Infinity means the cache entry is never stale, so invalidation of a
    // different key cannot trigger a refetch. The from() call count must not increase.
    const callsAfter = vi.mocked(supabase.from).mock.calls.length;
    expect(callsAfter).toBe(callsBefore);

    // Belt-and-suspenders: the queryKey stored on the cache entry must be the dedicated
    // campaign-drafts key — collapsing it to ['characters',...] in a future refactor breaks this.
    const cacheEntry = client.getQueryCache().find({ queryKey: ['campaign-drafts', 'camp-1'] });
    expect(cacheEntry).toBeDefined();
  });
});

describeListQuery(
  'useCharacters',
  () => renderHook(() => useCharacters('camp-1'), { wrapper: createWrapper() }),
  baseCharacter,
  () => renderHook(() => useCharacters(''), { wrapper: createWrapper() }),
  'campaign_id'
);

describeSingleQuery(
  'useCharacter',
  (id) => renderHook(() => useCharacter(id as string | undefined), { wrapper: createWrapper() }),
  baseCharacter,
  'char-1',
  undefined
);

describe('useCharacter slug query pattern', () => {
  it('queries by slug using .or() with both slug and previous_slugs', async () => {
    mockQueryResult.data = baseCharacter;

    const { result } = renderHook(() => useCharacter('aria-silverw-char'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(supabase.or).toHaveBeenCalledWith('slug.eq.aria-silverw-char,previous_slugs.cs.{"aria-silverw-char"}');
  });

  it('throws when slug contains invalid characters', async () => {
    const { result } = renderHook(() => useCharacter('bad,slug'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('usePlayerNames', () => {
  it('returns sorted unique player names', async () => {
    mockQueryResult.data = [
      { player_name: 'Charlie' },
      { player_name: 'Alice' },
      { player_name: 'Alice' },
      { player_name: 'Bob' },
    ];

    const { result } = renderHook(() => usePlayerNames(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('deduplicates player names', async () => {
    mockQueryResult.data = [{ player_name: 'Alice' }, { player_name: 'Alice' }];

    const { result } = renderHook(() => usePlayerNames(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data).toEqual(['Alice']);
  });

  it('returns empty array when no player names exist', async () => {
    mockQueryResult.data = [];

    const { result } = renderHook(() => usePlayerNames(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useCharacterMutations', () => {
  it('create inserts character and returns it', async () => {
    mockQueryResult.data = baseCharacter;

    const { result } = renderHook(() => useCharacterMutations(), { wrapper: createWrapper() });

    const {
      id: _id,
      created_at: _created_at,
      updated_at: _updated_at,
      is_active: _is_active,
      ...createPayload
    } = baseCharacter;
    result.current.create.mutate(createPayload);

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true));
    expect(result.current.create.data).toEqual(baseCharacter);
  });

  it('update patches character by id', async () => {
    const updated = { ...baseCharacter, name: 'New Name' };
    mockQueryResult.data = updated;

    const { result } = renderHook(() => useCharacterMutations(), { wrapper: createWrapper() });

    result.current.update.mutate({ id: 'char-1', name: 'New Name' });

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
    expect(supabase.eq).toHaveBeenCalledWith('id', 'char-1');
  });

  it('remove deletes character by id', async () => {
    mockQueryResult.data = null;

    const { result } = renderHook(() => useCharacterMutations(), { wrapper: createWrapper() });

    result.current.remove.mutate({ id: 'char-1', campaignId: 'camp-1' });

    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true));
    expect(supabase.eq).toHaveBeenCalledWith('id', 'char-1');
  });

  describe('clone', () => {
    it('inserts a new character with the new name, blank slug, and reset previous_slugs', async () => {
      // Object data => the child fetches return an object whose .length is undefined,
      // so child inserts are skipped and only the character is inserted.
      mockQueryResult.data = baseCharacter;

      const { result } = renderHook(() => useCharacterMutations(), { wrapper: createWrapper() });
      result.current.clone.mutate({
        sourceCharacterId: 'char-1',
        newName: 'Copy of Aria Silverwind',
      });

      await waitFor(() => expect(result.current.clone.isSuccess).toBe(true));

      const payload = vi.mocked(supabase.insert).mock.calls[0][0] as Record<string, unknown>;
      expect(payload.name).toBe('Copy of Aria Silverwind');
      expect(payload.slug).toBe('');
      expect(payload.previous_slugs).toEqual([]);
      // DB-managed columns are dropped so the database regenerates them.
      expect(payload).not.toHaveProperty('id');
      expect(payload).not.toHaveProperty('created_at');
      expect(payload).not.toHaveProperty('updated_at');
      // Duplicate semantics: type/status/campaign carried over verbatim from the source.
      expect(payload.character_type).toBe('pc');
      expect(payload.status).toBe('ready');
      expect(payload.campaign_id).toBe('camp-1');
      // Build levels are fetched excluding soft-deleted rows.
      expect(supabase.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('skips child inserts when the source has no build levels or items', async () => {
      mockQueryResult.data = baseCharacter;

      const { result } = renderHook(() => useCharacterMutations(), { wrapper: createWrapper() });
      result.current.clone.mutate({ sourceCharacterId: 'char-1', newName: 'Copy' });

      await waitFor(() => expect(result.current.clone.isSuccess).toBe(true));
      // Only the character row is inserted (no child-table inserts).
      expect(supabase.insert).toHaveBeenCalledTimes(1);
    });

    it('inserts child build levels and items (with DB columns dropped) when the source has them', async () => {
      // Array data => the child fetches report length > 0, exercising both child-insert branches.
      mockQueryResult.data = [{ id: 'row-1', character_id: 'char-1', sequence: 0, choices: {} }];

      const { result } = renderHook(() => useCharacterMutations(), { wrapper: createWrapper() });
      result.current.clone.mutate({ sourceCharacterId: 'char-1', newName: 'Copy' });

      await waitFor(() => expect(result.current.clone.isSuccess).toBe(true));
      // character + character_build_levels + character_items.
      expect(supabase.insert).toHaveBeenCalledTimes(3);
      expect(supabase.from).toHaveBeenCalledWith('character_build_levels');
      expect(supabase.from).toHaveBeenCalledWith('character_items');
      // Child rows drop their own id/created_at before re-insert.
      const levelRows = vi.mocked(supabase.insert).mock.calls[1][0] as Record<string, unknown>[];
      expect(levelRows[0]).not.toHaveProperty('id');
      expect(levelRows[0]).not.toHaveProperty('created_at');
    });

    it('propagates the error when the source fetch fails (insert never attempted)', async () => {
      mockQueryResult.data = baseCharacter;
      mockQueryResult.error = { message: 'Source fetch failed' };

      const { result } = renderHook(() => useCharacterMutations(), { wrapper: createWrapper() });
      result.current.clone.mutate({ sourceCharacterId: 'char-1', newName: 'Copy' });

      await waitFor(() => expect(result.current.clone.isError).toBe(true));
      // The first awaited query (source select) throws, so no insert is attempted.
      expect(supabase.insert).not.toHaveBeenCalled();
    });
  });
});
