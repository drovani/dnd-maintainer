import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Character } from '@/types/database'
import type { AbilityScores } from '@/types/database'
import type { BuildLevelRow } from '@/lib/build-reconstruction'
import type { CharacterBuild, ChoiceDecision } from '@/types/choices'
import type { ResolvedCharacter } from '@/types/resolved'
import type { ClassId } from '@/lib/dnd-helpers'
import type { GrantBundle } from '@/types/sources'
import { reconstructBuild } from '@/lib/build-reconstruction'
import { collectBundles, getRaceSource } from '@/lib/sources/index'
import { CLASS_SOURCES } from '@/lib/sources/classes'
import { resolveCharacter } from '@/lib/resolver/index'
import { toast } from 'sonner'
import i18next from 'i18next'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreationUpdates {
  base_abilities?: AbilityScores
  ability_method?: 'standard-array' | 'point-buy' | 'rolling'
  choices?: Record<string, ChoiceDecision>
}

interface CharacterContextValue {
  readonly character: Character
  readonly rows: readonly BuildLevelRow[]
  readonly build: CharacterBuild | null
  readonly bundles: readonly GrantBundle[]
  readonly resolved: ResolvedCharacter | null
  readonly buildError: string | null
  readonly isDirty: boolean
  readonly hasDeletedRows: boolean
  updateCharacter: (updates: Readonly<Partial<Character>>) => void
  updateCreation: (updates: Readonly<CreationUpdates>) => void
  makeChoice: (choiceKey: string, decision: ChoiceDecision) => void
  clearChoice: (choiceKey: string) => void
  levelUp: (classId: ClassId, hpRoll: number | null) => void
  levelDown: () => void
  undoLevelDown: () => void
  replaceLevel: (oldSequence: number, newClassId: string, newSubclassId: string | null) => void
  markSaved: () => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CharacterContext = createContext<CharacterContextValue | null>(null)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine which row sequence a choice key belongs to.
 *
 * Key format: `category:origin:id:index`
 * Keys with `:race:` or `:background:` go to sequence-0.
 * Keys with `:class:` go to the matching level row (by class_id embedded in the key).
 * Everything else defaults to sequence-0.
 */
export function resolveChoiceSequence(choiceKey: string, rows: readonly BuildLevelRow[]): number {
  const parts = choiceKey.split(':')
  // e.g. "language-choice:race:human:0" or "skill-choice:class:fighter:0"
  const origin = parts[1]

  if (origin === 'race' || origin === 'background') {
    return 0
  }

  if (origin === 'class') {
    const classId = parts[2]
    // Find the first level row with matching class_id
    const levelRow = rows.find((r) => r.sequence !== 0 && r.class_id === classId)
    if (!levelRow) {
      console.warn(`No level row found for class "${classId}" — choice "${choiceKey}" will be stored on creation row`)
    }
    return levelRow?.sequence ?? 0
  }

  console.warn(`Unknown choice origin "${origin}" in key "${choiceKey}" — defaulting to creation row`)
  return 0
}

/**
 * Find the row index for a promoted column (subclass or ASI) on a class level row.
 * Returns the index into `rows` if found, or -1 if the grant type or row cannot be located.
 */
function findGrantRowIndex(
  classId: string,
  grantType: 'subclass' | 'asi',
  rows: readonly BuildLevelRow[],
): number {
  const classSource = CLASS_SOURCES.find((cs) => cs.id === classId)
  if (!classSource) return -1

  let grantClassLevel: number | null = null
  for (let i = 0; i < classSource.levels.length; i++) {
    if (classSource.levels[i].grants.some((g) => g.type === grantType)) {
      grantClassLevel = i + 1
      break
    }
  }
  if (grantClassLevel === null) return -1

  return rows.findIndex(
    (r) => r.sequence !== 0 && r.class_id === classId && r.class_level === grantClassLevel && r.deleted_at == null,
  )
}

type BuildResult =
  | { readonly status: 'ok'; readonly build: CharacterBuild; readonly bundles: readonly GrantBundle[]; readonly resolved: ResolvedCharacter; readonly error: null }
  | { readonly status: 'build-error'; readonly build: null; readonly bundles: readonly GrantBundle[]; readonly resolved: null; readonly error: string }
  | { readonly status: 'resolve-error'; readonly build: CharacterBuild; readonly bundles: readonly GrantBundle[]; readonly resolved: null; readonly error: string }

function tryDeriveAndResolve(
  character: Character,
  rows: readonly BuildLevelRow[],
  equippedItems: readonly string[],
): BuildResult {
  // Exclude soft-deleted rows before reconstruction
  const activeRows = rows.filter((r) => r.deleted_at == null)

  let build: CharacterBuild
  try {
    build = reconstructBuild(
      { race: character.race, background: character.background },
      activeRows,
      equippedItems,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown build error'
    console.error('Failed to reconstruct character build:', { characterId: character.id, error: err })
    return { status: 'build-error', build: null, bundles: [], resolved: null, error: message }
  }

  const { bundles, warnings } = collectBundles(build)
  if (warnings.length > 0) {
    console.warn('collectBundles warnings:', warnings)
  }

  try {
    const levelRows = activeRows.filter((r) => r.sequence !== 0)
    const level = levelRows.length
    const resolved = resolveCharacter({
      baseAbilities: build.baseAbilities,
      level,
      bundles,
      choices: build.choices,
      hpRolls: build.hpRolls,
    })
    return { status: 'ok', build, bundles, resolved, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown resolver error'
    console.error('Failed to resolve character:', { characterId: character.id, error: err })
    return { status: 'resolve-error', build, bundles, resolved: null, error: message }
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface CharacterProviderProps {
  readonly initialCharacter: Character
  readonly initialRows: readonly BuildLevelRow[]
  readonly initialEquippedItems: readonly string[]
  readonly children: ReactNode
}

export function CharacterProvider({
  initialCharacter,
  initialRows,
  initialEquippedItems,
  children,
}: CharacterProviderProps): React.JSX.Element {
  const [character, setCharacter] = useState<Character>(initialCharacter)
  const [rows, setRows] = useState<readonly BuildLevelRow[]>(() => {
    // Seed a creation row if one doesn't exist so reconstructBuild can always find sequence 0
    if (initialRows.some((r) => r.sequence === 0)) return initialRows
    const seedRow: BuildLevelRow = {
      sequence: 0,
      base_abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      ability_method: 'standard-array',
      class_id: null,
      class_level: null,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: {},
    }
    return [seedRow, ...initialRows]
  })
  const [equippedItems] = useState<readonly string[]>(initialEquippedItems)
  const [isDirty, setIsDirty] = useState<boolean>(false)

  const { build, bundles, resolved, error: buildError } = useMemo(
    () => tryDeriveAndResolve(character, rows, equippedItems),
    [character, rows, equippedItems],
  )

  const hasDeletedRows = useMemo(
    () => rows.some((r) => r.deleted_at != null && r.sequence !== 0),
    [rows],
  )

  const updateCharacter = useCallback((updates: Readonly<Partial<Character>>) => {
    setCharacter((prev) => {
      const next = { ...prev, ...updates }
      // When race changes, also set size from race source
      if ('race' in updates && updates.race !== prev.race && updates.race) {
        const raceSource = getRaceSource(updates.race)
        if (raceSource) {
          next.size = raceSource.defaultSize
        }
      }
      return next
    })
    setIsDirty(true)
  }, [])

  const updateCreation = useCallback((updates: Readonly<CreationUpdates>) => {
    setRows((prev) => {
      const creationIdx = prev.findIndex((r) => r.sequence === 0)
      if (creationIdx === -1) {
        // No creation row exists yet — create one
        const newRow: BuildLevelRow = {
          sequence: 0,
          base_abilities: updates.base_abilities ?? null,
          ability_method: updates.ability_method ?? null,
          class_id: null,
          class_level: null,
          subclass_id: null,
          asi_allocation: null,
          feat_id: null,
          hp_roll: null,
          choices: updates.choices ?? null,
        }
        return [...prev, newRow]
      }
      const existing = prev[creationIdx]
      const updated: BuildLevelRow = {
        ...existing,
        ...(updates.base_abilities !== undefined ? { base_abilities: updates.base_abilities } : {}),
        ...(updates.ability_method !== undefined ? { ability_method: updates.ability_method } : {}),
        ...(updates.choices !== undefined
          ? { choices: { ...(existing.choices ?? {}), ...updates.choices } }
          : {}),
      }
      const next = [...prev]
      next[creationIdx] = updated
      return next
    })
    setIsDirty(true)
  }, [])

  const makeChoice = useCallback((choiceKey: string, decision: ChoiceDecision) => {
    setRows((prev) => {
      // For subclass and ASI decisions, route to the promoted column on the target level row
      if (decision.type === 'subclass' || decision.type === 'asi') {
        const classId = choiceKey.split(':')[2]
        const targetIdx = findGrantRowIndex(classId, decision.type, prev)
        if (targetIdx !== -1) {
          const next = [...prev]
          if (decision.type === 'subclass') {
            next[targetIdx] = { ...next[targetIdx], subclass_id: decision.subclassId }
          } else {
            next[targetIdx] = { ...next[targetIdx], asi_allocation: decision.allocation as Record<string, number> }
          }
          return next
        }
        // Fall through to normal choice storage if promoted column routing failed
      }

      const targetSeq = resolveChoiceSequence(choiceKey, prev)
      const idx = prev.findIndex((r) => r.sequence === targetSeq)
      if (idx === -1) {
        console.warn(`makeChoice: no row found for key "${choiceKey}" — choice not saved`)
        toast.error(i18next.t('common:errors.choiceSaveFailed'))
        return prev
      }
      const existing = prev[idx]
      const updated: BuildLevelRow = {
        ...existing,
        choices: { ...(existing.choices ?? {}), [choiceKey]: decision },
      }
      const next = [...prev]
      next[idx] = updated
      return next
    })
    setIsDirty(true)
  }, [])

  const clearChoice = useCallback((choiceKey: string) => {
    setRows((prev) => {
      // For subclass and ASI decisions, also clear the promoted column on the target level row
      const category = choiceKey.split(':')[0]

      if (category === 'subclass-choice' || category === 'asi-choice') {
        const classId = choiceKey.split(':')[2]
        const grantType = category === 'subclass-choice' ? 'subclass' as const : 'asi' as const
        const targetIdx = findGrantRowIndex(classId, grantType, prev)
        if (targetIdx !== -1) {
          const next = [...prev]
          if (grantType === 'subclass') {
            next[targetIdx] = { ...next[targetIdx], subclass_id: null }
          } else {
            next[targetIdx] = { ...next[targetIdx], asi_allocation: null }
          }
          const newChoices = { ...(next[targetIdx].choices ?? {}) }
          delete newChoices[choiceKey]
          next[targetIdx] = { ...next[targetIdx], choices: newChoices }
          return next
        }
      }

      const targetSeq = resolveChoiceSequence(choiceKey, prev)
      const idx = prev.findIndex((r) => r.sequence === targetSeq)
      if (idx === -1) {
        console.warn(`clearChoice: no row found for key "${choiceKey}" — choice not cleared`)
        toast.error(i18next.t('common:errors.choiceClearFailed'))
        return prev
      }
      const existing = prev[idx]
      const newChoices = { ...(existing.choices ?? {}) }
      delete newChoices[choiceKey]
      const updated: BuildLevelRow = { ...existing, choices: newChoices }
      const next = [...prev]
      next[idx] = updated
      return next
    })
    setIsDirty(true)
  }, [])

  const levelUp = useCallback((classId: ClassId, hpRoll: number | null) => {
    setRows((prev) => {
      // Check if there's a soft-deleted row with a higher sequence we can restore
      const activeRows = prev.filter((r) => r.deleted_at == null)
      const activeLevelRows = activeRows.filter((r) => r.sequence !== 0)
      const maxActiveSeq = activeLevelRows.reduce((m, r) => Math.max(m, r.sequence), 0)

      const nextDeletedRow = prev
        .filter((r) => r.sequence !== 0 && r.deleted_at != null && r.sequence > maxActiveSeq)
        .sort((a, b) => a.sequence - b.sequence)[0]

      if (nextDeletedRow) {
        // Only restore if the class matches; otherwise fall through to appending a new row
        if (nextDeletedRow.class_id === classId) {
          const idx = prev.findIndex((r) => r.sequence === nextDeletedRow.sequence)
          const next = [...prev]
          next[idx] = { ...next[idx], deleted_at: null, hp_roll: hpRoll }
          return next
        }
      }

      // No restorable row — append a new one
      const classLevelCount = activeLevelRows.filter((r) => r.class_id === classId).length
      const maxSeq = prev.reduce((m, r) => Math.max(m, r.sequence), 0)
      const newRow: BuildLevelRow = {
        sequence: maxSeq + 1,
        base_abilities: null,
        ability_method: null,
        class_id: classId,
        class_level: classLevelCount + 1,
        subclass_id: null,
        asi_allocation: null,
        feat_id: null,
        hp_roll: hpRoll,
        choices: null,
      }
      return [...prev, newRow]
    })
    setIsDirty(true)
  }, [])

  const levelDown = useCallback(() => {
    setRows((prev) => {
      // Only consider active (non-deleted) level rows
      const activeLevelRows = prev.filter((r) => r.sequence !== 0 && r.deleted_at == null)
      if (activeLevelRows.length === 0) return prev
      const maxActiveSeq = activeLevelRows.reduce((m, r) => Math.max(m, r.sequence), 0)
      const idx = prev.findIndex((r) => r.sequence === maxActiveSeq)
      if (idx === -1) return prev
      const next = [...prev]
      next[idx] = { ...next[idx], deleted_at: new Date().toISOString() }
      return next
    })
    setIsDirty(true)
  }, [])

  const undoLevelDown = useCallback(() => {
    setRows((prev) => {
      // Find the most recently soft-deleted non-creation row (highest sequence with deleted_at set)
      const deletedLevelRows = prev.filter((r) => r.sequence !== 0 && r.deleted_at != null)
      if (deletedLevelRows.length === 0) return prev
      const maxDeletedSeq = deletedLevelRows.reduce((m, r) => Math.max(m, r.sequence), 0)
      const idx = prev.findIndex((r) => r.sequence === maxDeletedSeq)
      if (idx === -1) return prev
      const next = [...prev]
      // Clear deleted_at with null for consistency with the levelUp restore path
      next[idx] = { ...next[idx], deleted_at: null }
      return next
    })
    setIsDirty(true)
  }, [])

  const replaceLevel = useCallback((oldSequence: number, newClassId: string, newSubclassId: string | null) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.sequence === oldSequence)
      if (idx === -1) {
        console.warn(`replaceLevel: no row found for sequence ${oldSequence} — level not replaced`)
        toast.error(i18next.t('common:errors.levelReplaceFailed'))
        return prev
      }
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        class_id: newClassId,
        class_level: 1,
        subclass_id: newSubclassId,
        choices: null,
      }
      return next
    })
    setIsDirty(true)
  }, [])

  const markSaved = useCallback(() => {
    setIsDirty(false)
  }, [])

  const value = useMemo<CharacterContextValue>(
    () => ({
      character,
      rows,
      build,
      bundles,
      resolved,
      buildError,
      isDirty,
      hasDeletedRows,
      updateCharacter,
      updateCreation,
      makeChoice,
      clearChoice,
      levelUp,
      levelDown,
      undoLevelDown,
      replaceLevel,
      markSaved,
    }),
    [character, rows, build, bundles, resolved, buildError, isDirty, hasDeletedRows, updateCharacter, updateCreation, makeChoice, clearChoice, levelUp, levelDown, undoLevelDown, replaceLevel, markSaved],
  )

  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCharacterContext(): CharacterContextValue {
  const ctx = useContext(CharacterContext)
  if (!ctx) {
    throw new Error('useCharacterContext must be used within a CharacterProvider')
  }
  return ctx
}
