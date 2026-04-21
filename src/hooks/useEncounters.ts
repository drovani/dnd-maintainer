import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Encounter, EncounterSummary } from '@/types/database';
import type { TablesInsert, TablesUpdate } from '@/types/supabase';
import { ENCOUNTER_SUMMARY_COLS, ENCOUNTER_DETAIL_COLS } from '@/lib/query-columns';

export function useEncounters(campaignId: string) {
  return useQuery({
    queryKey: ['encounters', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encounters')
        .select(ENCOUNTER_SUMMARY_COLS)
        .eq('campaign_id', campaignId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as EncounterSummary[];
    },
    enabled: !!campaignId,
  });
}

export function useSessionEncounters(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['encounters', 'session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encounters')
        .select(ENCOUNTER_SUMMARY_COLS)
        .eq('session_id', sessionId!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as EncounterSummary[];
    },
    enabled: !!sessionId,
  });
}

export function useEncounter(id: string) {
  return useQuery({
    queryKey: ['encounter', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('encounters').select(ENCOUNTER_DETAIL_COLS).eq('id', id).single();
      if (error) throw error;
      return data as unknown as Encounter;
    },
    enabled: !!id,
  });
}

export function useCreateEncounter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (encounter: Omit<Encounter, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('encounters')
        .insert(encounter as unknown as TablesInsert<'encounters'>)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Encounter;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['encounters', data.campaign_id] });
      if (data.session_id) {
        queryClient.invalidateQueries({ queryKey: ['encounters', 'session', data.session_id] });
      }
    },
  });
}

export function useUpdateEncounter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Encounter> & { id: string }) => {
      const { data, error } = await supabase
        .from('encounters')
        .update(updates as unknown as TablesUpdate<'encounters'>)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Encounter;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['encounters', data.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['encounter', data.id] });
      if (data.session_id) {
        queryClient.invalidateQueries({ queryKey: ['encounters', 'session', data.session_id] });
      }
    },
  });
}

export function useDeleteEncounter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; campaignId: string; sessionId?: string }) => {
      const { error } = await supabase.from('encounters').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { campaignId, sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['encounters', campaignId] });
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ['encounters', 'session', sessionId] });
      }
    },
  });
}
