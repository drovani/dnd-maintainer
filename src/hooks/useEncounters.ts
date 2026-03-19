import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Encounter } from '@/types/database';


export function useEncounters(campaignId: string) {
  return useQuery({
    queryKey: ['encounters', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encounters')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Encounter[];
    },
    enabled: !!campaignId,
  });
}

export function useSessionEncounters(sessionId: string) {
  return useQuery({
    queryKey: ['encounters', 'session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encounters')
        .select('*')
        .eq('session_id', sessionId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Encounter[];
    },
    enabled: !!sessionId,
  });
}

export function useEncounter(id: string) {
  return useQuery({
    queryKey: ['encounter', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encounters')
        .select('*')
        .eq('id', id)
        .single();
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
        .insert(encounter as never)
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
        .update(updates as never)
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
    mutationFn: async ({
      id,
    }: {
      id: string;
      campaignId: string;
      sessionId?: string;
    }) => {
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
