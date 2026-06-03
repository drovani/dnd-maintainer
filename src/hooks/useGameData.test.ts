import { setupMockReset, renderHook, waitFor, createWrapper, mockQueryResult } from '@/test/hook-test-helpers';

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase'));

import { useGameData } from '@/hooks/useGameData';
import type { Campaign } from '@/types/database';
import { SPECIES_SOURCES } from '@/lib/sources/species';
import { CLASS_SOURCES } from '@/lib/sources/classes';
import { BACKGROUND_SOURCES } from '@/lib/sources/backgrounds';
import { FEAT_SOURCES } from '@/lib/sources/feats';
import { SUBCLASS_SOURCES } from '@/lib/sources/subclasses';
import type { SourceBookId } from '@/lib/source-books';

const baseCampaign: Campaign = {
  id: 'camp-1',
  slug: 'test-campaign',
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

describe('useGameData', () => {
  describe('with allowed source books = [phb-2024]', () => {
    it('returns full species list when phb-2024 is allowed', async () => {
      mockQueryResult.data = baseCampaign;

      const { result } = renderHook(() => useGameData('test-campaign'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.species.length).toBeGreaterThan(0));
      expect(result.current.species).toEqual(SPECIES_SOURCES);
    });

    it('returns full classes list when phb-2024 is allowed', async () => {
      mockQueryResult.data = baseCampaign;

      const { result } = renderHook(() => useGameData('test-campaign'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.classes.length).toBeGreaterThan(0));
      expect(result.current.classes).toEqual(CLASS_SOURCES);
    });

    it('returns full backgrounds list when phb-2024 is allowed', async () => {
      mockQueryResult.data = baseCampaign;

      const { result } = renderHook(() => useGameData('test-campaign'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.backgrounds.length).toBeGreaterThan(0));
      expect(result.current.backgrounds).toEqual(BACKGROUND_SOURCES);
    });

    it('returns full feats list when phb-2024 is allowed', async () => {
      mockQueryResult.data = baseCampaign;

      const { result } = renderHook(() => useGameData('test-campaign'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.feats.length).toBeGreaterThan(0));
      expect(result.current.feats).toEqual(FEAT_SOURCES);
    });

    it('returns full subclasses record when phb-2024 is allowed', async () => {
      mockQueryResult.data = baseCampaign;

      const { result } = renderHook(() => useGameData('test-campaign'), { wrapper: createWrapper() });

      await waitFor(() => expect(Object.keys(result.current.subclasses).length).toBeGreaterThan(0));
      expect(result.current.subclasses).toEqual(SUBCLASS_SOURCES);
    });

    it('exposes allowedSourceBooks with the campaign value', async () => {
      mockQueryResult.data = baseCampaign;

      const { result } = renderHook(() => useGameData('test-campaign'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.allowedSourceBooks).toEqual(['phb-2024']));
    });
  });

  describe('with allowed source books = [some-future-book] (simulated disabled PHB)', () => {
    const futureCampaign: Campaign = {
      ...baseCampaign,
      allowed_source_books: ['some-future-book' as SourceBookId],
    };

    it('returns empty species list when phb-2024 is not allowed', async () => {
      mockQueryResult.data = futureCampaign;

      const { result } = renderHook(() => useGameData('test-campaign'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.allowedSourceBooks).toEqual(['some-future-book']));
      expect(result.current.species).toHaveLength(0);
    });

    it('returns empty classes list when phb-2024 is not allowed', async () => {
      mockQueryResult.data = futureCampaign;

      const { result } = renderHook(() => useGameData('test-campaign'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.allowedSourceBooks).toEqual(['some-future-book']));
      expect(result.current.classes).toHaveLength(0);
    });

    it('returns empty backgrounds list when phb-2024 is not allowed', async () => {
      mockQueryResult.data = futureCampaign;

      const { result } = renderHook(() => useGameData('test-campaign'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.allowedSourceBooks).toEqual(['some-future-book']));
      expect(result.current.backgrounds).toHaveLength(0);
    });

    it('returns empty feats list when phb-2024 is not allowed', async () => {
      mockQueryResult.data = futureCampaign;

      const { result } = renderHook(() => useGameData('test-campaign'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.allowedSourceBooks).toEqual(['some-future-book']));
      expect(result.current.feats).toHaveLength(0);
    });

    it('returns empty subclasses record when phb-2024 is not allowed', async () => {
      mockQueryResult.data = futureCampaign;

      const { result } = renderHook(() => useGameData('test-campaign'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.allowedSourceBooks).toEqual(['some-future-book']));
      expect(Object.keys(result.current.subclasses)).toHaveLength(0);
    });
  });

  describe('with undefined slug (loading state)', () => {
    it('defaults to phb-2024 and returns full lists when slug is undefined', () => {
      const { result } = renderHook(() => useGameData(undefined), { wrapper: createWrapper() });

      // No query is fired when slug is undefined, so we check synchronously
      expect(result.current.allowedSourceBooks).toEqual(['phb-2024']);
      expect(result.current.species).toEqual(SPECIES_SOURCES);
      expect(result.current.classes).toEqual(CLASS_SOURCES);
      expect(result.current.backgrounds).toEqual(BACKGROUND_SOURCES);
      expect(result.current.feats).toEqual(FEAT_SOURCES);
    });
  });
});
