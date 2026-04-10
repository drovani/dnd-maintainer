import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Character } from '@/types/database'
import type { AbilityScores } from '@/types/database'
import type { BuildLevelRow } from '@/lib/build-reconstruction'
import type { CharacterBuild, ChoiceDecision, ChoiceKey } from '@/types/choices'
import { parseChoiceKey } from '@/types/choices'
import type { ResolvedCharacter } from '@/types/resolved'
import type { ClassId } from '@/lib/dnd-helpers'
import type { GrantBundle, SubclassId } from '@/types/sources'
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
  choices?: Record<ChoiceKey, ChoiceDecision>
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
  readonly nextRestoreLevel: number | null
  updateCharacter: (updates: Readonly<Partial<Character>>) => void
  updateCreation: (updates: Readonly<CreationUpdates>) => void
  makeChoice: (choiceKey: ChoiceKey, decision: ChoiceDecision) => void
  clearChoice: (choiceKey: ChoiceKey) => void
  levelUp: (classId: ClassId, hpRoll: number | null, decisions?: ReadonlyMap<ChoiceKey, ChoiceDecision>) => void
  levelDown: () => void
  undoLevelDown: () => void
  replaceLevel: (oldSequence: number, newClassId: ClassId, newSubclassId: SubclassId | null) => void
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
 * Also throws if origin is 'class' but no active level row exists for the specified class.
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
 * Returns `{ index }` if found, or `{ index: -1, error }` with a descriptive
 * message if the class source, grant type, or active row cannot be located.
 */
function findGrantRowIndex(
  classId: string,
  grantType: 'subclass' | 'asi',
  grantIndex: number,
  rows: readonly BuildLevelRow[],
): { ok: true; index: number } | { ok: false; error: string } {
  const classSource = CLASS_SOURCES.find((cs) => cs.id === classId)
  if (!classSource) {
    const error = `No class source found for "${classId}"`
    console.error(`findGrantRowIndex: ${error}`)
    return { ok: false, error }
  }

  // Collect all class levels that have a matching grant type, then pick the Nth one
  const matchingClassLevels: number[] = []
  for (let i = 0; i < classSource.levels.length; i++) {
    if (classSource.levels[i].grants.some((g) => g.type === grantType)) {
      matchingClassLevels.push(i + 1)
    }
  }
  if (matchingClassLevels.length === 0) {
    const error = `No ${grantType} grant found in class "${classId}" source data`
    console.error(`findGrantRowIndex: ${error}`)
    return { ok: false, error }
  }
  if (grantIndex >= matchingClassLevels.length) {
    const error = `Grant index ${grantIndex} exceeds available ${grantType} grants (${matchingClassLevels.length}) for class "${classId}"`
    console.error(`findGrantRowIndex: ${error}`)
    return { ok: false, error }
  }

  const grantClassLevel = matchingClassLevels[grantIndex]
  const idx = rows.findIndex(
    (r) => r.sequence !== 0 && r.class_id === classId && r.class_level === grantClassLevel && r.deleted_at == null,
  )
  if (idx === -1) {
    const error = `No active row at class level ${grantClassLevel} for class "${classId}" — character may not be high enough level`
    console.error(`findGrantRowIndex: ${error}`)
    return { ok: false, error }
  }
  return { ok: true, index: idx }
}

/**
 * Apply a single choice decision onto a mutable rows array.
 * Returns an error string on failure, or null on success.
 */
function applyDecisionToRows(
  rows: BuildLevelRow[],
  choiceKey: ChoiceKey,
  decision: ChoiceDecision,
): string | null {
  if (decision.type === 'subclass' || decision.type === 'asi') {
    const { id: classId, index: grantIndex } = parseChoiceKey(choiceKey)
    const result = findGrantRowIndex(classId, decision.type, grantIndex, rows)
    if (!result.ok) return result.error
    if (decision.type === 'subclass') {
      rows[result.index] = { ...rows[result.index], subclass_id: decision.subclassId }
    } else {
      rows[result.index] = { ...rows[result.index], asi_allocation: decision.allocation as Record<string, number> }
    }
    return null
  }

  const { origin, id: classId } = parseChoiceKey(choiceKey)
  let targetSeq: number
  if (origin === 'race' || origin === 'background') {
    targetSeq = 0
  } else {
    const levelRow = rows.find((r) => r.sequence !== 0 && r.class_id === classId && r.deleted_at == null)
    if (!levelRow) return `No active level row found for class "${classId}"`
    targetSeq = levelRow.sequence
  }

  const idx = rows.findIndex((r) => r.sequence === targetSeq)
  if (idx === -1) return `No row found for sequence ${targetSeq}`
  rows[idx] = {
    ...rows[idx],
    choices: { ...(rows[idx].choices ?? {}), [choiceKey]: decision },
  }
  return null
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
      equippedItemIds: equippedItems,
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

  const nextRestoreLevel = useMemo(() => {
    const activeRows = rows.filter((r) => r.deleted_at == null)
    const maxActiveSeq = activeRows.filter((r) => r.sequence !== 0).reduce((m, r) => Math.max(m, r.sequence), 0)
    const nextDeleted = rows
      .filter((r) => r.sequence !== 0 && r.deleted_at != null && r.sequence > maxActiveSeq)
      .sort((a, b) => a.sequence - b.sequence)[0]
    return nextDeleted ? level + 1 : null
  }, [rows, level])

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
    try {
      const next = [...rows]
      const error = applyDecisionToRows(next, choiceKey, decision)
      if (error) {
        toast.error(error)
        return
      }
      setRows(next)
      setIsDirty(true)
    } catch (err) {
      console.error('makeChoice failed:', { choiceKey, error: err })
      toast.error(i18next.t('common:errors.choiceSaveFailed'))
    }
  }, [rows])

  const clearChoice = useCallback((choiceKey: ChoiceKey) => {
    try {
      const { category, id: classId, index: grantIndex } = parseChoiceKey(choiceKey)

      // For subclass and ASI decisions, clear the dedicated column on the target level row
      if (category === 'subclass' || category === 'asi') {
        const grantType = category === 'subclass' ? 'subclass' as const : 'asi' as const
        const result = findGrantRowIndex(classId, grantType, grantIndex, rows)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        const next = [...rows]
        if (grantType === 'subclass') {
          next[result.index] = { ...next[result.index], subclass_id: null }
        } else {
          next[result.index] = { ...next[result.index], asi_allocation: null }
        }
        const newChoices = { ...(next[result.index].choices ?? {}) }
        delete newChoices[choiceKey]
        next[result.index] = { ...next[result.index], choices: newChoices }
        setRows(next)
        setIsDirty(true)
        return
      }

      const targetSeq = resolveChoiceSequence(choiceKey, rows)
      const idx = rows.findIndex((r) => r.sequence === targetSeq)
      if (idx === -1) {
        console.warn(`clearChoice: no row found for key "${choiceKey}" — choice not cleared`)
        toast.error(i18next.t('common:errors.choiceClearFailed'))
        return
      }
      const existing = rows[idx]
      const newChoices = { ...(existing.choices ?? {}) }
      delete newChoices[choiceKey]
      const updated: BuildLevelRow = { ...existing, choices: newChoices }
      const next = [...rows]
      next[idx] = updated
      setRows(next)
      setIsDirty(true)
    } catch (err) {
      console.error('clearChoice failed:', { choiceKey, error: err })
      toast.error(i18next.t('common:errors.choiceClearFailed'))
    }
  }, [rows])

  const levelUp = useCallback((classId: ClassId, hpRoll: number | null, decisions?: ReadonlyMap<ChoiceKey, ChoiceDecision>) => {
    // Check if there's a soft-deleted row with a higher sequence we can restore
    const activeRows = rows.filter((r) => r.deleted_at == null)
    const activeLevelRows = activeRows.filter((r) => r.sequence !== 0)

    if (activeLevelRows.length >= 20) {
      toast.warning(i18next.t('common:characterSheet.levelManagement.maxLevelReached'))
      return
    }

    const maxActiveSeq = activeLevelRows.reduce((m, r) => Math.max(m, r.sequence), 0)

    const nextDeletedRow = rows
      .filter((r) => r.sequence !== 0 && r.deleted_at != null && r.sequence > maxActiveSeq)
      .sort((a, b) => a.sequence - b.sequence)[0]

    let next: BuildLevelRow[]

    if (nextDeletedRow && nextDeletedRow.class_id === classId) {
      // Restore the soft-deleted row
      const idx = rows.findIndex((r) => r.sequence === nextDeletedRow.sequence)
      next = [...rows]
      next[idx] = {
        ...next[idx],
        deleted_at: null,
        hp_roll: hpRoll,
        subclass_id: null,
        asi_allocation: null,
        choices: null,
      }
    } else {
      // No restorable row — append a new one
      const classLevelCount = activeLevelRows.filter((r) => r.class_id === classId).length
      const maxSeq = rows.reduce((m, r) => Math.max(m, r.sequence), 0)
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
      next = [...rows, newRow]
    }

    // Apply any decisions atomically with the level-up
    if (decisions) {
      for (const [key, decision] of decisions) {
        const error = applyDecisionToRows(next, key, decision)
        if (error) {
          toast.error(error)
        }
      }
    }

    setRows(next)
    setIsDirty(true)
  }, [rows])

  const levelDown = useCallback(() => {
    // Only consider active (non-deleted) level rows
    const activeLevelRows = rows.filter((r) => r.sequence !== 0 && r.deleted_at == null)
    if (activeLevelRows.length === 0) return
    const maxActiveSeq = activeLevelRows.reduce((m, r) => Math.max(m, r.sequence), 0)
    const idx = rows.findIndex((r) => r.sequence === maxActiveSeq)
    if (idx === -1) return
    const next = [...rows]
    next[idx] = { ...next[idx], deleted_at: new Date().toISOString() }
    setRows(next)
    setIsDirty(true)
  }, [rows])

  const undoLevelDown = useCallback(() => {
    // Find the next soft-deleted row in ascending sequence order (above the current active max)
    const activeRows = rows.filter((r) => r.deleted_at == null)
    const maxActiveSeq = activeRows.filter((r) => r.sequence !== 0).reduce((m, r) => Math.max(m, r.sequence), 0)
    const nextDeleted = rows
      .filter((r) => r.sequence !== 0 && r.deleted_at != null && r.sequence > maxActiveSeq)
      .sort((a, b) => a.sequence - b.sequence)[0]
    if (!nextDeleted) return
    const idx = rows.findIndex((r) => r.sequence === nextDeleted.sequence)
    if (idx === -1) return
    const next = [...rows]
    // Restore the row by clearing its deleted_at timestamp
    next[idx] = { ...next[idx], deleted_at: null }
    setRows(next)
    setIsDirty(true)
  }, [rows])

  const replaceLevel = useCallback((oldSequence: number, newClassId: ClassId, newSubclassId: SubclassId | null) => {
    const idx = rows.findIndex((r) => r.sequence === oldSequence)
    if (idx === -1) {
      console.warn(`replaceLevel: no row found for sequence ${oldSequence} — level not replaced`)
      toast.error(i18next.t('common:errors.levelReplaceFailed'))
      return
    }
    const next = [...rows]
    next[idx] = {
      ...next[idx],
      class_id: newClassId,
      class_level: 1,
      subclass_id: newSubclassId,
      choices: null,
    }
    setRows(next)
    setIsDirty(true)
  }, [rows])

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
      nextRestoreLevel,
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
    [character, rows, build, bundles, resolved, buildError, buildWarnings, isDirty, level, hasDeletedRows, nextRestoreLevel, updateCharacter, updateCreation, makeChoice, clearChoice, levelUp, levelDown, undoLevelDown, replaceLevel, markSaved],
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
