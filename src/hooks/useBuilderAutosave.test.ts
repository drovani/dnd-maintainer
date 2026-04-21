/// <reference types="node" />
import { act, waitFor } from '@testing-library/react';
import {
  setupMockReset,
  withSuppressedRejections,
  renderHook,
  createWrapper,
  supabase,
  mockQueryResult,
} from '@/test/hook-test-helpers';

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase'));

import { useBuilderAutosave } from '@/hooks/useBuilderAutosave';
import type { SaveStatus, AutosavePayload } from '@/hooks/useBuilderAutosave';

const basePayload: AutosavePayload = {
  character: {
    id: '',
    slug: '',
    previous_slugs: [],
    created_at: '',
    updated_at: '',
    campaign_id: 'camp-1',
    name: 'Hero Draft',
    character_type: 'pc' as const,
    player_name: 'Bob',
    race: 'human' as const,
    class: 'fighter' as const,
    subclass: null,
    level: 1,
    background: 'soldier',
    alignment: 'lg' as const,
    gender: null,
    size: 'medium' as const,
    age: null,
    height: null,
    weight: null,
    eye_color: null,
    hair_color: null,
    skin_color: null,
    hit_points_max: 10,
    armor_class: 16,
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
    status: 'draft' as const,
  },
  rows: [],
  resolved: null,
};

setupMockReset();

beforeEach(() => {
  // Restore then to its default behavior in case a test overrode it
  supabase.then = (resolve, reject) => Promise.resolve({ ...mockQueryResult }).then(resolve, reject);
});

describe('useBuilderAutosave', () => {
  describe('initial state', () => {
    it('starts with saveStatus idle', () => {
      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      expect(result.current.saveStatus).toBe<SaveStatus>('idle');
    });

    it('exposes saveDraft, finalize, and clearStatus', () => {
      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      expect(typeof result.current.saveDraft).toBe('function');
      expect(typeof result.current.finalize).toBe('function');
      expect(typeof result.current.clearStatus).toBe('function');
    });
  });

  describe('saveDraft', () => {
    it('inserts on first call (no existing characterId) and returns the new id', async () => {
      mockQueryResult.data = { id: 'char-new' };

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      let returnedId: string | undefined;
      await act(async () => {
        returnedId = await result.current.saveDraft(basePayload);
      });

      expect(supabase.insert).toHaveBeenCalled();
      expect(returnedId).toBe('char-new');
    });

    it('sets saveStatus to saved after successful insert', async () => {
      mockQueryResult.data = { id: 'char-new' };

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.saveDraft(basePayload);
      });

      expect(result.current.saveStatus).toBe<SaveStatus>('saved');
    });

    it('updates on subsequent calls after first insert establishes characterId', async () => {
      mockQueryResult.data = { id: 'char-existing' };

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      // First call — inserts
      await act(async () => {
        await result.current.saveDraft(basePayload);
      });

      // Clear call tracking so we can detect the second call type
      vi.mocked(supabase.insert).mockClear();
      vi.mocked(supabase.update).mockClear();
      // Update doesn't need to return data
      mockQueryResult.data = null;

      // Second call — should update, not insert
      await act(async () => {
        await result.current.saveDraft({
          ...basePayload,
          character: { ...basePayload.character, name: 'Updated Name' },
        });
      });

      expect(supabase.insert).not.toHaveBeenCalled();
      expect(supabase.update).toHaveBeenCalled();
    });

    it('sets saveStatus to error when supabase returns an error', async () => {
      expect.assertions(2);
      mockQueryResult.error = { message: 'Save failed' };
      mockQueryResult.data = null;

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      await withSuppressedRejections(async () => {
        await act(async () => {
          await result.current.saveDraft(basePayload).catch((err: { message: string }) => {
            expect(err).toEqual({ message: 'Save failed' });
          });
        });

        expect(result.current.saveStatus).toBe<SaveStatus>('error');
      });
    });

    it('includes status draft in insert payload', async () => {
      mockQueryResult.data = { id: 'char-new' };

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.saveDraft(basePayload);
      });

      expect(supabase.insert).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft' }));
    });
  });

  describe('finalize', () => {
    it('calls saveDraft then updates status to ready and returns slug', async () => {
      mockQueryResult.data = { id: 'char-new', slug: 'hero-draft' };

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      let returnedSlug: string | undefined;
      await act(async () => {
        returnedSlug = await result.current.finalize(basePayload);
      });

      expect(returnedSlug).toBe('hero-draft');
      expect(supabase.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'ready' }));
    });

    it('sets saveStatus to saved after successful finalize', async () => {
      mockQueryResult.data = { id: 'char-new', slug: 'hero-draft' };

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.finalize(basePayload);
      });

      expect(result.current.saveStatus).toBe<SaveStatus>('saved');
    });

    it('throws and sets saveStatus to error when finalize response has no slug', async () => {
      expect.assertions(2);
      // saveDraft insert returns an id; the ready-update returns data without a slug field
      let callIndex = 0;
      supabase.then = (resolve, reject) => {
        callIndex++;
        if (callIndex === 1) {
          return Promise.resolve({ data: { id: 'char-new' }, error: null }).then(resolve, reject);
        }
        return Promise.resolve({ data: { id: 'char-new' }, error: null }).then(resolve, reject);
      };

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      await withSuppressedRejections(async () => {
        await act(async () => {
          await result.current.finalize(basePayload).catch((err: Error) => {
            expect(err.message).toMatch(/no character slug was returned/);
          });
        });

        await waitFor(() => expect(result.current.saveStatus).toBe<SaveStatus>('error'));
      });
    });

    it('sets saveStatus to error when the status update fails', async () => {
      expect.assertions(2);
      // saveDraft insert succeeds; the ready-update fails.
      // Override `then` to return different results per call.
      let callIndex = 0;
      supabase.then = (resolve, reject) => {
        callIndex++;
        if (callIndex === 1) {
          return Promise.resolve({ data: { id: 'char-new' }, error: null }).then(resolve, reject);
        }
        return Promise.resolve({ data: null, error: { message: 'Status update failed' } }).then(resolve, reject);
      };

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      await withSuppressedRejections(async () => {
        await act(async () => {
          await result.current.finalize(basePayload).catch((err: { message: string }) => {
            expect(err).toEqual({ message: 'Status update failed' });
          });
        });

        await waitFor(() => expect(result.current.saveStatus).toBe<SaveStatus>('error'));
      });
    });
  });

  describe('build-level upsert', () => {
    it('upserts creation row (sequence 0) to character_build_levels', async () => {
      mockQueryResult.data = { id: 'char-new' };

      const creationRow = {
        sequence: 0 as const,
        base_abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
        ability_method: 'standard-array' as const,
        class_id: null,
        class_level: null,
        subclass_id: null,
        asi_allocation: null,
        feat_id: null,
        hp_roll: null,
        choices: {},
        deleted_at: null,
      };

      const payload: AutosavePayload = {
        ...basePayload,
        rows: [creationRow],
      };

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.saveDraft(payload);
      });

      expect(supabase.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ character_id: 'char-new', sequence: 0 })]),
        expect.objectContaining({ onConflict: 'character_id,sequence' })
      );
    });

    it('upserts level rows (sequence > 0) in the batch', async () => {
      mockQueryResult.data = { id: 'char-new' };

      const levelRow = {
        sequence: 1,
        base_abilities: null,
        ability_method: null,
        class_id: 'fighter',
        class_level: 1,
        subclass_id: null,
        asi_allocation: null,
        feat_id: null,
        hp_roll: null,
        choices: {},
        deleted_at: null,
      };

      const payload: AutosavePayload = {
        ...basePayload,
        rows: [levelRow],
      };

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.saveDraft(payload);
      });

      expect(supabase.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ character_id: 'char-new', sequence: 1, class_id: 'fighter' }),
        ]),
        expect.objectContaining({ onConflict: 'character_id,sequence' })
      );
    });

    it('does not call upsert when rows array is empty', async () => {
      mockQueryResult.data = { id: 'char-new' };

      const payload: AutosavePayload = {
        ...basePayload,
        rows: [],
      };

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.saveDraft(payload);
      });

      expect(supabase.upsert).not.toHaveBeenCalled();
    });

    it('sets status to error when character_build_levels upsert fails', async () => {
      expect.assertions(2);
      // First call (insert character) succeeds, second call (upsert build level) fails
      let callIndex = 0;
      supabase.then = (resolve, reject) => {
        callIndex++;
        if (callIndex === 1) {
          return Promise.resolve({ data: { id: 'char-new' }, error: null }).then(resolve, reject);
        }
        return Promise.resolve({ data: null, error: { message: 'Upsert failed' } }).then(resolve, reject);
      };

      const creationRow = {
        sequence: 0 as const,
        base_abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        ability_method: 'standard-array' as const,
        class_id: null,
        class_level: null,
        subclass_id: null,
        asi_allocation: null,
        feat_id: null,
        hp_roll: null,
        choices: {},
        deleted_at: null,
      };

      const payload: AutosavePayload = {
        ...basePayload,
        rows: [creationRow],
      };

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      await withSuppressedRejections(async () => {
        await act(async () => {
          await result.current.saveDraft(payload).catch((err: { message: string }) => {
            expect(err).toEqual({ message: 'Upsert failed' });
          });
        });

        expect(result.current.saveStatus).toBe<SaveStatus>('error');
      });
    });

    it('soft-deletes orphaned rows after upserting active rows', async () => {
      mockQueryResult.data = { id: 'char-new' };

      const creationRow = {
        sequence: 0 as const,
        base_abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        ability_method: 'standard-array' as const,
        class_id: null,
        class_level: null,
        subclass_id: null,
        asi_allocation: null,
        feat_id: null,
        hp_roll: null,
        choices: {},
        deleted_at: null,
      };

      const levelRow = {
        sequence: 1,
        base_abilities: null,
        ability_method: null,
        class_id: 'fighter',
        class_level: 1,
        subclass_id: null,
        asi_allocation: null,
        feat_id: null,
        hp_roll: null,
        choices: {},
        deleted_at: null,
      };

      const payload: AutosavePayload = {
        ...basePayload,
        rows: [creationRow, levelRow],
      };

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.saveDraft(payload);
      });

      // After upserting, the hook should soft-delete rows not in active sequences (0,1)
      expect(supabase.update).toHaveBeenCalledWith(expect.objectContaining({ deleted_at: expect.any(String) }));
      expect(supabase.not).toHaveBeenCalledWith('sequence', 'in', '(0,1)');
    });
  });

  describe('clearStatus', () => {
    it('transitions saveStatus from saved to idle', async () => {
      mockQueryResult.data = { id: 'char-new' };

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.saveDraft(basePayload);
      });

      expect(result.current.saveStatus).toBe<SaveStatus>('saved');

      act(() => {
        result.current.clearStatus();
      });

      expect(result.current.saveStatus).toBe<SaveStatus>('idle');
    });

    it('does not change saveStatus when it is error', async () => {
      expect.assertions(3);
      mockQueryResult.error = { message: 'Save failed' };

      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      await withSuppressedRejections(async () => {
        await act(async () => {
          await result.current.saveDraft(basePayload).catch((err: { message: string }) => {
            expect(err).toEqual({ message: 'Save failed' });
          });
        });

        expect(result.current.saveStatus).toBe<SaveStatus>('error');

        act(() => {
          result.current.clearStatus();
        });

        // clearStatus only resets 'saved' → 'idle'; error is preserved
        expect(result.current.saveStatus).toBe<SaveStatus>('error');
      });
    });

    it('does not change saveStatus when it is idle', () => {
      const { result } = renderHook(() => useBuilderAutosave(), { wrapper: createWrapper() });

      act(() => {
        result.current.clearStatus();
      });

      expect(result.current.saveStatus).toBe<SaveStatus>('idle');
    });
  });
});
