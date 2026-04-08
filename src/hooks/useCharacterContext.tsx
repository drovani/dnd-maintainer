import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Character } from '@/types/database'
import type { AbilityScores } from '@/types/database'
import type { BuildLevelRow } from '@/lib/build-reconstruction'
import type { CharacterBuild, ChoiceDecision, ChoiceKey } from '@/types/choices'
import { parseChoiceKey } from '@/types/choices'
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
  readonly buildWarnings: readonly string[]
  readonly isDirty: boolean
  readonly level: number
  readonly hasDeletedRows: boolean
  updateCharacter: (updates: Readonly<Partial<Character>>) => void
  updateCreation: (updates: Readonly<CreationUpdates>) => void
  makeChoice: (choiceKey: ChoiceKey, decision: ChoiceDecision) => void
  clearChoice: (choiceKey: ChoiceKey) => void
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
 * Unknown origins cause `parseChoiceKey` to throw.
 */
export function resolveChoiceSequence(choiceKey: string, rows: readonly BuildLevelRow[]): number {
  const { origin, id: classId } = parseChoiceKey(choiceKey)

  if (origin === 'race' || origin === 'background') {
    return 0
  }

  // origin === 'class' — find the first active level row for this class
  const levelRow = rows.find((r) => r.sequence !== 0 && r.class_id === classId && r.deleted_at == null)
  if (!levelRow) {
    throw new Error(`No active level row found for class "${classId}" — cannot store choice "${choiceKey}"`)
  }
  return levelRow.sequence
}

/**
 * Find the row index where a subclass_id or asi_allocation should be written
 * as a dedicated column (rather than in the JSONB choices column).
 *
 * Returns the index into `rows` if found, or -1 if the class source, grant type,
 * or active row cannot be located.
 */
function findGrantRowIndex(
  classId: string,
  grantType: 'subclass' | 'asi',
  grantIndex: number,
  rows: readonly BuildLevelRow[],
): number {
  const classSource = CLASS_SOURCES.find((cs) => cs.id === classId)
  if (!classSource) {
    console.error(`findGrantRowIndex: no class source for "${classId}"`)
    return -1
  }

  // Collect all class levels that have a matching grant type, then pick the Nth one
  const matchingClassLevels: number[] = []
  for (let i = 0; i < classSource.levels.length; i++) {
    if (classSource.levels[i].grants.some((g) => g.type === grantType)) {
      matchingClassLevels.push(i + 1)
    }
  }
  if (matchingClassLevels.length === 0) {
    console.error(`findGrantRowIndex: no ${grantType} grant found in class "${classId}" source data`)
    return -1
  }
  if (grantIndex >= matchingClassLevels.length) {
    console.error(`findGrantRowIndex: grant index ${grantIndex} exceeds available ${grantType} grants (${matchingClassLevels.length}) for class "${classId}"`)
    return -1
  }

  const grantClassLevel = matchingClassLevels[grantIndex]
  const idx = rows.findIndex(
    (r) => r.sequence !== 0 && r.class_id === classId && r.class_level === grantClassLevel && r.deleted_at == null,
  )
  if (idx === -1) {
    console.error(`findGrantRowIndex: no active row at class level ${grantClassLevel} for class "${classId}"`)
  }
  return idx
}

type BuildResult =
  | { readonly status: 'ok'; readonly build: CharacterBuild; readonly bundles: readonly GrantBundle[]; readonly resolved: ResolvedCharacter; readonly error: null; readonly warnings: readonly string[] }
  | { readonly status: 'build-error'; readonly build: null; readonly bundles: readonly GrantBundle[]; readonly resolved: null; readonly error: string; readonly warnings: readonly string[] }
  | { readonly status: 'resolve-error'; readonly build: CharacterBuild; readonly bundles: readonly GrantBundle[]; readonly resolved: null; readonly error: string; readonly warnings: readonly string[] }

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
    return { status: 'build-error', build: null, bundles: [], resolved: null, error: message, warnings: [] }
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
      levels: build.levels,
    })
    return { status: 'ok', build, bundles, resolved, error: null, warnings }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown resolver error'
    console.error('Failed to resolve character:', { characterId: character.id, error: err })
    return { status: 'resolve-error', build, bundles, resolved: null, error: message, warnings }
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
      deleted_at: null,
    }
    return [seedRow, ...initialRows]
  })
  const [equippedItems] = useState<readonly string[]>(initialEquippedItems)
  const [isDirty, setIsDirty] = useState<boolean>(false)

  const { build, bundles, resolved, error: buildError, warnings: buildWarnings } = useMemo(
    () => tryDeriveAndResolve(character, rows, equippedItems),
    [character, rows, equippedItems],
  )

  const level = useMemo(
    () => rows.filter((r) => r.sequence !== 0 && r.deleted_at == null).length,
    [rows],
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
          deleted_at: null,
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

  const makeChoice = useCallback((choiceKey: ChoiceKey, decision: ChoiceDecision) => {
    let changed = false
    let failed = false
    setRows((prev) => {
      try {
        // For subclass and ASI decisions, route to the dedicated column on the target level row
        if (decision.type === 'subclass' || decision.type === 'asi') {
          const { id: classId, index: grantIndex } = parseChoiceKey(choiceKey)
          const targetIdx = findGrantRowIndex(classId, decision.type, grantIndex, prev)
          if (targetIdx === -1) {
            console.error(`makeChoice: could not route ${decision.type} decision for key "${choiceKey}" to dedicated column`)
            failed = true
            return prev
          }
          const next = [...prev]
          if (decision.type === 'subclass') {
            next[targetIdx] = { ...next[targetIdx], subclass_id: decision.subclassId }
          } else {
            next[targetIdx] = { ...next[targetIdx], asi_allocation: decision.allocation as Record<string, number> }
          }
          changed = true
          return next
        }

        const targetSeq = resolveChoiceSequence(choiceKey, prev)
        const idx = prev.findIndex((r) => r.sequence === targetSeq)
        if (idx === -1) {
          console.warn(`makeChoice: no row found for key "${choiceKey}" — choice not saved`)
          failed = true
          return prev
        }
        const existing = prev[idx]
        const updated: BuildLevelRow = {
          ...existing,
          choices: { ...(existing.choices ?? {}), [choiceKey]: decision },
        }
        const next = [...prev]
        next[idx] = updated
        changed = true
        return next
      } catch (err) {
        console.error('makeChoice: malformed choice key', { choiceKey, error: err })
        failed = true
        return prev
      }
    })
    if (changed) setIsDirty(true)
    if (failed) toast.error(i18next.t('common:errors.choiceSaveFailed'))
  }, [])

  const clearChoice = useCallback((choiceKey: ChoiceKey) => {
    let changed = false
    let failed = false
    setRows((prev) => {
      try {
        const { category, id: classId } = parseChoiceKey(choiceKey)

        // For subclass and ASI decisions, clear the dedicated column on the target level row
        if (category === 'subclass' || category === 'asi') {
          const grantType = category === 'subclass' ? 'subclass' as const : 'asi' as const
          const { index: grantIndex } = parseChoiceKey(choiceKey)
          const targetIdx = findGrantRowIndex(classId, grantType, grantIndex, prev)
          if (targetIdx === -1) {
            console.error(`clearChoice: could not find dedicated column row for key "${choiceKey}"`)
            failed = true
            return prev
          }
          const next = [...prev]
          if (grantType === 'subclass') {
            next[targetIdx] = { ...next[targetIdx], subclass_id: null }
          } else {
            next[targetIdx] = { ...next[targetIdx], asi_allocation: null }
          }
          const newChoices = { ...(next[targetIdx].choices ?? {}) }
          delete newChoices[choiceKey]
          next[targetIdx] = { ...next[targetIdx], choices: newChoices }
          changed = true
          return next
        }

        const targetSeq = resolveChoiceSequence(choiceKey, prev)
        const idx = prev.findIndex((r) => r.sequence === targetSeq)
        if (idx === -1) {
          console.warn(`clearChoice: no row found for key "${choiceKey}" — choice not cleared`)
          failed = true
          return prev
        }
        const existing = prev[idx]
        const newChoices = { ...(existing.choices ?? {}) }
        delete newChoices[choiceKey]
        const updated: BuildLevelRow = { ...existing, choices: newChoices }
        const next = [...prev]
        next[idx] = updated
        changed = true
        return next
      } catch (err) {
        console.error('clearChoice: malformed choice key', { choiceKey, error: err })
        failed = true
        return prev
      }
    })
    if (changed) setIsDirty(true)
    if (failed) toast.error(i18next.t('common:errors.choiceClearFailed'))
  }, [])

  const levelUp = useCallback((classId: ClassId, hpRoll: number | null) => {
    let changed = false
    let atMaxLevel = false
    setRows((prev) => {
      // Check if there's a soft-deleted row with a higher sequence we can restore
      const activeRows = prev.filter((r) => r.deleted_at == null)
      const activeLevelRows = activeRows.filter((r) => r.sequence !== 0)

      if (activeLevelRows.length >= 20) {
        atMaxLevel = true
        return prev
      }

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
          changed = true
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
        deleted_at: null,
      }
      changed = true
      return [...prev, newRow]
    })
    if (changed) setIsDirty(true)
    if (atMaxLevel) toast.warning(i18next.t('common:characterSheet.levelManagement.maxLevelReached'))
  }, [])

  const levelDown = useCallback(() => {
    let changed = false
    setRows((prev) => {
      // Only consider active (non-deleted) level rows
      const activeLevelRows = prev.filter((r) => r.sequence !== 0 && r.deleted_at == null)
      if (activeLevelRows.length === 0) return prev
      const maxActiveSeq = activeLevelRows.reduce((m, r) => Math.max(m, r.sequence), 0)
      const idx = prev.findIndex((r) => r.sequence === maxActiveSeq)
      if (idx === -1) return prev
      const next = [...prev]
      next[idx] = { ...next[idx], deleted_at: new Date().toISOString() }
      changed = true
      return next
    })
    if (changed) setIsDirty(true)
  }, [])

  const undoLevelDown = useCallback(() => {
    let changed = false
    setRows((prev) => {
      // Find the most recently soft-deleted non-creation row (highest sequence with deleted_at set)
      const deletedLevelRows = prev.filter((r) => r.sequence !== 0 && r.deleted_at != null)
      if (deletedLevelRows.length === 0) return prev
      const maxDeletedSeq = deletedLevelRows.reduce((m, r) => Math.max(m, r.sequence), 0)
      const idx = prev.findIndex((r) => r.sequence === maxDeletedSeq)
      if (idx === -1) return prev
      const next = [...prev]
      // Restore the row by clearing its deleted_at timestamp
      next[idx] = { ...next[idx], deleted_at: null }
      changed = true
      return next
    })
    if (changed) setIsDirty(true)
  }, [])

  const replaceLevel = useCallback((oldSequence: number, newClassId: string, newSubclassId: string | null) => {
    let changed = false
    let failed = false
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.sequence === oldSequence)
      if (idx === -1) {
        console.warn(`replaceLevel: no row found for sequence ${oldSequence} — level not replaced`)
        failed = true
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
      changed = true
      return next
    })
    if (changed) setIsDirty(true)
    if (failed) toast.error(i18next.t('common:errors.levelReplaceFailed'))
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
      buildWarnings,
      isDirty,
      level,
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
    [character, rows, build, bundles, resolved, buildError, buildWarnings, isDirty, level, hasDeletedRows, updateCharacter, updateCreation, makeChoice, clearChoice, levelUp, levelDown, undoLevelDown, replaceLevel, markSaved],
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
