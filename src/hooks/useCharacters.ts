import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Character, CharacterSummary } from '@/types/database'
import { CHARACTER_SUMMARY_COLS, CHARACTER_DETAIL_COLS } from '@/lib/query-columns'

// --- Queries ---

export function useCharacters(campaignId: string) {
  return useQuery({
    queryKey: ['characters', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select(CHARACTER_SUMMARY_COLS)
        .eq('campaign_id', campaignId)
        .order('name', { ascending: true })
      if (error) throw error
      return (data || []) as unknown as CharacterSummary[]
    },
    enabled: !!campaignId,
  })
}

export function useCharacter(id: string | undefined) {
  return useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select(CHARACTER_DETAIL_COLS)
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as Character
    },
    enabled: !!id,
  })
}

export function usePlayerNames() {
  return useQuery({
    queryKey: ['player-names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('player_name')
        .neq('player_name', '')
        .not('player_name', 'is', null)
      if (error) throw error
      const unique = [...new Set((data || []).map((d) => d.player_name as string))]
      unique.sort()
      return unique
    },
  })
}

// --- Mutations ---

export function useCharacterMutations() {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (character: Omit<Character, 'id' | 'created_at' | 'updated_at' | 'is_npc' | 'is_active'>) => {
      const { data, error } = await supabase
        .from('characters')
        .insert(character as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Character
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['characters', data.campaign_id] })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Character> & { id: string }) => {
      const { data, error } = await supabase
        .from('characters')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Character
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['characters', data.campaign_id] })
      queryClient.invalidateQueries({ queryKey: ['character', data.id] })
    },
  })

  const remove = useMutation({
    mutationFn: async ({ id }: { id: string; campaignId: string }) => {
      const { error } = await supabase.from('characters').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['characters', campaignId] })
    },
  })

  return { create, update, remove }
}
