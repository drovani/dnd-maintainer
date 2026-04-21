import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Note, NoteSummary } from '@/types/database';
import type { TablesInsert, TablesUpdate } from '@/types/supabase';
import { NOTE_SUMMARY_COLS, NOTE_DETAIL_COLS } from '@/lib/query-columns';

export function useNotes(campaignId: string) {
  return useQuery({
    queryKey: ['notes', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select(NOTE_SUMMARY_COLS)
        .eq('campaign_id', campaignId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as NoteSummary[];
    },
    enabled: !!campaignId,
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: ['note', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('notes').select(NOTE_DETAIL_COLS).eq('id', id).single();
      if (error) throw error;
      return data as unknown as Note;
    },
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('notes')
        .insert(note as unknown as TablesInsert<'notes'>)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Note> & { id: string }) => {
      const { data, error } = await supabase
        .from('notes')
        .update(updates as unknown as TablesUpdate<'notes'>)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Note;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note', data.id] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
