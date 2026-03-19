import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'

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
  abilities: Record<string, number>
  saving_throws: Record<string, { proficient: boolean }>
  skills: Record<string, { proficient: boolean; expertise: boolean }>
  features: unknown[]
  equipment: unknown[]
  spells: unknown
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
      await savingRef.current
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
          characterIdRef.current = (data as { id: string }).id
          queryClient.invalidateQueries({ queryKey: ['characters', payload.campaign_id] })
        }
        setSaveStatus('saved')
        return characterIdRef.current!
      } catch {
        setSaveStatus('error')
        throw new Error('Failed to save draft')
      } finally {
        savingRef.current = null
      }
    })()

    savingRef.current = promise
    return promise
  }

  const finalize = async (payload: BuilderPayload): Promise<string> => {
    const id = await saveDraft(payload)
    const { error } = await supabase
      .from('characters')
      .update({ status: 'ready' } as never)
      .eq('id', id)
    if (error) throw error
    queryClient.invalidateQueries({ queryKey: ['characters', payload.campaign_id] })
    return id
  }

  const clearStatus = () => {
    if (saveStatus === 'saved') setSaveStatus('idle')
  }

  return { saveStatus, saveDraft, finalize, clearStatus, characterId: characterIdRef.current }
}
