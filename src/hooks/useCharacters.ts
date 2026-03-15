import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Character } from '@/types/database';

export function useCharacters(campaignId: string) {
  return useQuery({
    queryKey: ['characters', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []) as Character[];
    },
    enabled: !!campaignId,
  });
}

export function useCharacter(id: string) {
  return useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Character;
    },
    enabled: !!id,
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

export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (character: Omit<Character, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('characters')
        .insert([character])
        .select()
        .single();
      if (error) throw error;
      return data as Character;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['characters', data.campaign_id] });
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Character> & { id: string }) => {
      const { data, error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Character;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['characters', data.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['character', data.id] });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; campaignId: string }) => {
      const { error } = await supabase.from('characters').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['characters', campaignId] });
    },
  });
}
