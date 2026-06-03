import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Character, CharacterSummary } from '@/types/database';
import type { TablesInsert, TablesUpdate } from '@/types/supabase';
import { CHARACTER_SUMMARY_COLS, CHARACTER_DETAIL_COLS } from '@/lib/query-columns';
import { validateSlug } from '@/lib/slug-utils';

// --- Queries ---

export function useCharacters(campaignId: string) {
  return useQuery({
    queryKey: ['characters', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select(CHARACTER_SUMMARY_COLS)
        .eq('campaign_id', campaignId)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as CharacterSummary[];
    },
    enabled: !!campaignId,
  });
}

export function useCharacter(slug: string | undefined) {
  return useQuery({
    queryKey: ['character', slug],
    queryFn: async () => {
      const safe = validateSlug(slug!);
      const { data, error } = await supabase
        .from('characters')
        .select(CHARACTER_DETAIL_COLS)
        .or(`slug.eq.${safe},previous_slugs.cs.{"${safe}"}`)
        .single();
      if (error) throw error;
      return data as unknown as Character;
    },
    enabled: !!slug,
  });
}

export function usePlayerNames() {
  return useQuery({
    queryKey: ['player-names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('player_name')
        .neq('player_name', '')
        .not('player_name', 'is', null);
      if (error) throw error;
      const unique = [...new Set((data || []).map((d) => d.player_name as string))];
      unique.sort();
      return unique;
    },
  });
}

// --- Mutations ---

export function useCharacterMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (character: Omit<Character, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
      const { data, error } = await supabase
        .from('characters')
        .insert(character as unknown as TablesInsert<'characters'>)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Character;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['characters', data.campaign_id] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Character> & { id: string }) => {
      const { data, error } = await supabase
        .from('characters')
        .update(updates as unknown as TablesUpdate<'characters'>)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Character;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['characters', data.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      queryClient.setQueryData(['character', data.slug], data);
    },
  });

  const remove = useMutation({
    mutationFn: async ({ id }: { id: string; campaignId: string }) => {
      const { error } = await supabase.from('characters').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['characters', campaignId] });
    },
  });

  // Duplicate a character (row + its character_build_levels and character_items child rows)
  // into a fresh record. The DB regenerates id/slug (slug via trigger from name+id) and
  // timestamps. Supabase JS has no client-side transaction, so on any child-insert failure
  // we compensate by deleting the new character (ON DELETE CASCADE removes partial children).
  const clone = useMutation({
    mutationFn: async ({
      sourceCharacterId,
      newName,
    }: {
      sourceCharacterId: string;
      newName: string;
      campaignId: string;
    }) => {
      const { data: source, error: sourceError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', sourceCharacterId)
        .single();
      if (sourceError) throw sourceError;
      if (!source) throw new Error('Source character not found');

      const { data: levels, error: levelsError } = await supabase
        .from('character_build_levels')
        .select('*')
        .eq('character_id', sourceCharacterId)
        .is('deleted_at', null);
      if (levelsError) throw levelsError;

      const { data: items, error: itemsError } = await supabase
        .from('character_items')
        .select('*')
        .eq('character_id', sourceCharacterId);
      if (itemsError) throw itemsError;

      // Copy every column, then drop DB-managed ones and override identity fields.
      const characterPayload: Record<string, unknown> = { ...source };
      delete characterPayload.id;
      delete characterPayload.created_at;
      delete characterPayload.updated_at;
      characterPayload.name = newName;
      characterPayload.slug = '';
      characterPayload.previous_slugs = [];

      const { data: newChar, error: insertError } = await supabase
        .from('characters')
        .insert(characterPayload as unknown as TablesInsert<'characters'>)
        .select()
        .single();
      if (insertError) throw insertError;
      const newCharacter = newChar as unknown as Character;

      try {
        if (levels && levels.length > 0) {
          const levelRows = (levels as Record<string, unknown>[]).map((row) => {
            const copy: Record<string, unknown> = { ...row };
            delete copy.id;
            delete copy.created_at;
            copy.character_id = newCharacter.id;
            return copy;
          });
          const { error } = await supabase
            .from('character_build_levels')
            .insert(levelRows as unknown as TablesInsert<'character_build_levels'>[]);
          if (error) throw error;
        }

        if (items && items.length > 0) {
          const itemRows = (items as Record<string, unknown>[]).map((row) => {
            const copy: Record<string, unknown> = { ...row };
            delete copy.id;
            delete copy.created_at;
            delete copy.updated_at;
            copy.character_id = newCharacter.id;
            return copy;
          });
          const { error } = await supabase
            .from('character_items')
            .insert(itemRows as unknown as TablesInsert<'character_items'>[]);
          if (error) throw error;
        }
      } catch (childError) {
        // Roll back the orphaned new character (cascade clears any partial children).
        await supabase.from('characters').delete().eq('id', newCharacter.id);
        throw childError;
      }

      return newCharacter;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['characters', data.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['character-build-levels', data.id] });
      queryClient.invalidateQueries({ queryKey: ['character-items', data.id] });
    },
  });

  return { create, update, remove, clone };
}
