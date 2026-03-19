import { supabase } from '@/lib/supabase'
import type { AbilityScores, Feature, EquipmentItem } from '@/types/database'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface BuilderPayload {
  campaign_id: string
  name: string
  character_type: 'pc' | 'npc'
  player_name: string | null
  race: string | null
  class: string | null
  subclass: string | null
  level: number
  background: string | null
  alignment: string | null
  hit_points_max: number
  hit_points_current: number
  armor_class: number
  speed: number
  abilities: AbilityScores
  saving_throws: Record<string, { proficient: boolean }>
  skills: Record<string, { proficient: boolean; expertise: boolean }>
  features: Feature[]
  equipment: EquipmentItem[]
  spells: {
    cantrips: string[]
    spellsByLevel: Record<number, string[]>
    spellSlots: Record<number, number>
  }
  personality_traits: string | null
  ideals: string | null
  bonds: string | null
  flaws: string | null
  appearance: string | null
  backstory: string | null
  notes: string | null
}

export function useBuilderAutosave() {
  const characterIdRef = useRef<string | null>(null)
  const savingRef = useRef<Promise<string> | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const queryClient = useQueryClient()

  const saveDraft = async (payload: BuilderPayload): Promise<string> => {
    // If a save is already in flight, wait for it first
    if (savingRef.current) {
      try { await savingRef.current } catch { /* previous save failed, proceeding with fresh data */ }
    }

    setSaveStatus('saving')

    const promise = (async () => {
      try {
        if (characterIdRef.current) {
          const { error } = await supabase
            .from('characters')
            .update(payload as never)
            .eq('id', characterIdRef.current)
          if (error) throw error
        } else {
          const insertPayload = { ...payload, status: 'draft' as const }
          const { data, error } = await supabase
            .from('characters')
            .insert(insertPayload as never)
            .select('id')
            .single()
          if (error) throw error
          if (!data?.id) throw new Error('Insert succeeded but no character ID was returned')
          characterIdRef.current = (data as { id: string }).id
          queryClient.invalidateQueries({ queryKey: ['characters', payload.campaign_id] })
        }
        setSaveStatus('saved')
        return characterIdRef.current!
      } catch (err) {
        setSaveStatus('error')
        console.error('Draft save failed:', err)
        throw err
      } finally {
        savingRef.current = null
      }
    })()

    savingRef.current = promise
    return promise
  }

  const finalize = async (payload: BuilderPayload): Promise<string> => {
    const id = await saveDraft(payload)
    try {
      const { error } = await supabase
        .from('characters')
        .update({ status: 'ready' } as never)
        .eq('id', id)
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['characters', payload.campaign_id] })
      return id
    } catch (err) {
      setSaveStatus('error')
      console.error('Failed to finalize character (draft was saved):', err)
      throw err
    }
  }

  const clearStatus = useCallback(() => {
    setSaveStatus((prev) => prev === 'saved' ? 'idle' : prev)
  }, [])

  return { saveStatus, saveDraft, finalize, clearStatus }
}
