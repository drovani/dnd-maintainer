import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Session } from '@/types/database';


export function useSessions(campaignId: string) {
  return useQuery({
    queryKey: ['sessions', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Session[];
    },
    enabled: !!campaignId,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as Session;
    },
    enabled: !!id,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: Omit<Session, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert(session as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Session;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', data.campaign_id] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Session> & { id: string }) => {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Session;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', data.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['session', data.id] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; campaignId: string }) => {
      const { error } = await supabase.from('sessions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', campaignId] });
    },
  });
}
