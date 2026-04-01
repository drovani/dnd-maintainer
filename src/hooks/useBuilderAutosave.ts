import { supabase } from '@/lib/supabase'
import type { Character } from '@/types/database'
import type { BuildLevelRow } from '@/lib/build-reconstruction'
import type { ResolvedCharacter } from '@/types/resolved'
import type { TablesInsert, TablesUpdate } from '@/types/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import i18next from 'i18next'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface AutosavePayload {
  readonly character: Character
  readonly rows: readonly BuildLevelRow[]
  readonly resolved: ResolvedCharacter | null
}

/**
 * Specialized write hook for the character builder's draft persistence flow.
 *
 * Separate from `useCharacterMutations` because:
 * - Tracks a mutable character ID across create→update transitions
 * - Serializes concurrent saves (best-effort sequencing)
 * - Manages a 4-state save status (idle→saving→saved|error)
 * - Supports draft→ready status promotion via `finalize`
 *
 * `saveDraft` creates on first call, updates on subsequent calls.
 * `finalize` saves the draft then promotes status from 'draft' to 'ready'.
 * `clearStatus` transitions 'saved' back to 'idle' (preserves 'error').
 */
export function useBuilderAutosave(existingCharacterId?: string) {
  const characterIdRef = useRef<string | null>(existingCharacterId ?? null)
  const savingRef = useRef<Promise<string> | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const queryClient = useQueryClient()

  const saveDraft = useCallback(
    async (payload: AutosavePayload): Promise<string> => {
      // If a previous save is in flight, wait for it to settle before starting a new one (best-effort sequencing)
      if (savingRef.current) {
        try {
          await savingRef.current
        } catch (prevErr) {
          console.warn('Previous autosave failed (retrying with fresh data):', prevErr)
        }
      }

      setSaveStatus('saving')

      const promise = (async () => {
        try {
          const { character, rows, resolved } = payload

          // Derive level from active (non-deleted) level rows
          const activeLevel = rows.filter((r) => r.sequence !== 0 && r.deleted_at == null).length

          // Build the characters table payload — identity + physical + narrative + computed fields from resolver
          const characterPayload = {
            campaign_id: character.campaign_id,
            name: character.name,
            character_type: character.character_type,
            player_name: character.player_name,
            race: character.race,
            class: character.class,
            subclass: character.subclass,
            level: activeLevel > 0 ? activeLevel : character.level,
            background: character.background,
            alignment: character.alignment,
            gender: character.gender,
            size: character.size,
            age: character.age,
            height: character.height,
            weight: character.weight,
            eye_color: character.eye_color,
            hair_color: character.hair_color,
            skin_color: character.skin_color,
            personality_traits: character.personality_traits,
            ideals: character.ideals,
            bonds: character.bonds,
            flaws: character.flaws,
            appearance: character.appearance,
            backstory: character.backstory,
            notes: character.notes,
            portrait_url: character.portrait_url,
            // Pre-calculated fields from resolved (or character if resolved unavailable)
            hit_points_max: resolved?.hitPoints.max ?? character.hit_points_max,
            armor_class: resolved?.armorClass.effective ?? character.armor_class,
            speed: resolved?.speed.walk?.value ?? character.speed,
            proficiency_bonus: resolved?.proficiencyBonus ?? character.proficiency_bonus,
          }

          let savedId: string

          if (characterIdRef.current) {
            const { error } = await supabase
              .from('characters')
              .update(characterPayload as unknown as TablesUpdate<'characters'>)
              .eq('id', characterIdRef.current)
            if (error) throw error
            savedId = characterIdRef.current
          } else {
            const insertPayload = { ...characterPayload, status: 'draft' as const }
            const { data, error } = await supabase
              .from('characters')
              .insert(insertPayload as unknown as TablesInsert<'characters'>)
              .select('id')
              .single()
            if (error) throw error
            if (!data?.id) throw new Error('Insert succeeded but no character ID was returned')
            savedId = (data as { id: string }).id
            characterIdRef.current = savedId
            queryClient.invalidateQueries({ queryKey: ['characters', character.campaign_id] })
          }

          // Batch upsert all build level rows in a single call
          const allUpserts: TablesInsert<'character_build_levels'>[] = rows.map((row) => {
            const isCreation = row.sequence === 0
            return {
              character_id: savedId,
              sequence: row.sequence,
              base_abilities: isCreation
                ? (row.base_abilities as unknown as TablesInsert<'character_build_levels'>['base_abilities']) ?? null
                : null,
              ability_method: isCreation ? row.ability_method : null,
              choices: (row.choices as unknown as TablesInsert<'character_build_levels'>['choices']) ?? {},
              class_id: isCreation ? null : row.class_id,
              class_level: isCreation ? null : row.class_level,
              subclass_id: isCreation ? null : row.subclass_id,
              asi_allocation: isCreation
                ? null
                : (row.asi_allocation as unknown as TablesInsert<'character_build_levels'>['asi_allocation']) ?? null,
              feat_id: isCreation ? null : row.feat_id,
              hp_roll: isCreation ? null : row.hp_roll,
              deleted_at: row.deleted_at ?? null,
            }
          })

          if (allUpserts.length > 0) {
            const { error: upsertError } = await supabase
              .from('character_build_levels')
              .upsert(allUpserts, { onConflict: 'character_id,sequence' })
            if (upsertError) throw upsertError
          }

          // Clean up orphaned rows (e.g. from class changes that replaced a level row)
          const activeSequences = rows.map((r) => r.sequence)
          const { error: cleanupError } = await supabase
            .from('character_build_levels')
            .update({ deleted_at: new Date().toISOString() })
            .eq('character_id', savedId)
            .is('deleted_at', null)
            .not('sequence', 'in', `(${activeSequences.join(',')})`)

          if (cleanupError) {
            console.error('Failed to clean up orphaned build rows:', cleanupError)
            toast.warning(i18next.t('common:errors.orphanedRowCleanupFailed'))
          }

          setSaveStatus('saved')
          return savedId
        } catch (err) {
          setSaveStatus('error')
          console.error('Draft save failed:', err)
          throw err
        }
      })()

      // Assign ref synchronously so the next saveDraft call sees it before this promise settles
      savingRef.current = promise
      // Clean up ref after promise settles
      promise.finally(() => {
        savingRef.current = null
      })

      return promise
    },
    [queryClient],
  )

  const finalize = useCallback(
    async (payload: AutosavePayload): Promise<string> => {
      const id = await saveDraft(payload)
      try {
        const { error } = await supabase
          .from('characters')
          .update({ status: 'ready' } as unknown as TablesUpdate<'characters'>)
          .eq('id', id)
        if (error) throw error
        queryClient.invalidateQueries({ queryKey: ['characters', payload.character.campaign_id] })
        return id
      } catch (err) {
        setSaveStatus('error')
        console.error('Failed to finalize character (draft was saved):', err)
        throw err
      }
    },
    [saveDraft, queryClient],
  )

  const clearStatus = useCallback(() => {
    setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev))
  }, [])

  return { saveStatus, saveDraft, finalize, clearStatus }
}
