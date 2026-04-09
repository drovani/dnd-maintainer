import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Session, SessionSummary } from '@/types/database';
import type { TablesInsert, TablesUpdate } from '@/types/supabase';
import { SESSION_SUMMARY_COLS, SESSION_DETAIL_COLS } from '@/lib/query-columns';


export function useSessions(campaignId: string) {
  return useQuery({
    queryKey: ['sessions', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(SESSION_SUMMARY_COLS)
        .eq('campaign_id', campaignId)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SessionSummary[];
    },
    enabled: !!campaignId,
  });
}

export function useSession(slug: string) {
  return useQuery({
    queryKey: ['session', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(SESSION_DETAIL_COLS)
        .or(`slug.eq.${slug},previous_slugs.cs.{"${slug}"}`)
        .single();
      if (error) throw error;
      return data as unknown as Session;
    },
    enabled: !!slug,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: Omit<Session, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert(session as unknown as TablesInsert<'sessions'>)
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
        .update(updates as unknown as TablesUpdate<'sessions'>)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Session;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', data.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['session', data.slug] });
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
