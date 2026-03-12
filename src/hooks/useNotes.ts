import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Note } from '@/types/database';

export function useNotes(campaignId: string) {
  return useQuery({
    queryKey: ['notes', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Note[];
    },
    enabled: !!campaignId,
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: ['note', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Note;
    },
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('notes').insert([note]).select().single();
      if (error) throw error;
      return data as Note;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes', data.campaign_id] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Note> & { id: string }) => {
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Note;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes', data.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['note', data.id] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; campaignId: string }) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['notes', campaignId] });
    },
  });
}
