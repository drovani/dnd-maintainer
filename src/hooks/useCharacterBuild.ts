import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BuildLevelRow } from '@/lib/build-reconstruction'

export function useCharacterBuildLevels(characterId: string | undefined) {
  return useQuery({
    queryKey: ['character-build-levels', characterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('character_build_levels')
        .select('*')
        .eq('character_id', characterId!)
        .is('deleted_at', null)
        .order('sequence')
      if (error) throw error
      return data as BuildLevelRow[]
    },
    enabled: !!characterId,
  })
}

export function useCharacterItems(characterId: string | undefined) {
  return useQuery({
    queryKey: ['character-items', characterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('character_items')
        .select('*')
        .eq('character_id', characterId!)
      if (error) throw error
      return data ?? []
    },
    enabled: !!characterId,
  })
}
