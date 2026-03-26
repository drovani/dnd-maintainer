import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Character } from '@/types/database'
import type { BuildLevelRow } from '@/lib/build-reconstruction'
import type { CharacterBuild } from '@/types/choices'
import type { ResolvedCharacter } from '@/types/resolved'
import { reconstructBuild } from '@/lib/build-reconstruction'
import { collectBundles, getRaceSource } from '@/lib/sources/index'
import { resolveCharacter } from '@/lib/resolver/index'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreationUpdates {
  base_abilities?: Record<string, number>
  ability_method?: string
  choices?: Record<string, unknown>
}

interface CharacterContextValue {
  readonly character: Character
  readonly rows: readonly BuildLevelRow[]
  readonly build: CharacterBuild | null
  readonly resolved: ResolvedCharacter | null
  readonly isDirty: boolean
  updateCharacter: (updates: Readonly<Partial<Character>>) => void
  updateCreation: (updates: Readonly<CreationUpdates>) => void
  makeChoice: (choiceKey: string, decision: unknown) => void
  clearChoice: (choiceKey: string) => void
  levelUp: (classId: string, hpRoll: number | null) => void
  levelDown: () => void
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
function resolveChoiceSequence(choiceKey: string, rows: readonly BuildLevelRow[]): number {
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
    return levelRow?.sequence ?? 0
  }

  return 0
}

function tryDeriveBuild(
  character: Character,
  rows: readonly BuildLevelRow[],
  equippedItems: readonly string[],
): CharacterBuild | null {
  try {
    return reconstructBuild(
      { race: character.race, background: character.background },
      rows,
      equippedItems,
    )
  } catch {
    return null
  }
}

function tryResolveCharacter(
  build: CharacterBuild | null,
  rows: readonly BuildLevelRow[],
): ResolvedCharacter | null {
  if (!build) return null
  try {
    const bundles = collectBundles(build)
    const levelRows = rows.filter((r) => r.sequence !== 0)
    const level = levelRows.length
    return resolveCharacter({
      baseAbilities: build.baseAbilities,
      level,
      bundles,
      choices: build.choices,
      hpRolls: build.hpRolls,
    })
  } catch {
    return null
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
  const [rows, setRows] = useState<readonly BuildLevelRow[]>(initialRows)
  const [equippedItems] = useState<readonly string[]>(initialEquippedItems)
  const [isDirty, setIsDirty] = useState<boolean>(false)

  const build = useMemo(() => tryDeriveBuild(character, rows, equippedItems), [character, rows, equippedItems])
  const resolved = useMemo(() => tryResolveCharacter(build, rows), [build, rows])

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
          base_abilities: (updates.base_abilities as Record<string, number>) ?? null,
          ability_method: updates.ability_method ?? null,
          class_id: null,
          class_level: null,
          subclass_id: null,
          asi_allocation: null,
          feat_id: null,
          hp_roll: null,
          choices: (updates.choices as Record<string, unknown>) ?? null,
        }
        return [...prev, newRow]
      }
      const existing = prev[creationIdx]
      const updated: BuildLevelRow = {
        ...existing,
        ...(updates.base_abilities !== undefined ? { base_abilities: updates.base_abilities as Record<string, number> } : {}),
        ...(updates.ability_method !== undefined ? { ability_method: updates.ability_method } : {}),
        ...(updates.choices !== undefined
          ? { choices: { ...(existing.choices ?? {}), ...updates.choices } as Record<string, unknown> }
          : {}),
      }
      const next = [...prev]
      next[creationIdx] = updated
      return next
    })
    setIsDirty(true)
  }, [])

  const makeChoice = useCallback((choiceKey: string, decision: unknown) => {
    setRows((prev) => {
      const targetSeq = resolveChoiceSequence(choiceKey, prev)
      const idx = prev.findIndex((r) => r.sequence === targetSeq)
      if (idx === -1) return prev
      const existing = prev[idx]
      const updated: BuildLevelRow = {
        ...existing,
        choices: { ...(existing.choices ?? {}), [choiceKey]: decision } as Record<string, unknown>,
      }
      const next = [...prev]
      next[idx] = updated
      return next
    })
    setIsDirty(true)
  }, [])

  const clearChoice = useCallback((choiceKey: string) => {
    setRows((prev) => {
      const targetSeq = resolveChoiceSequence(choiceKey, prev)
      const idx = prev.findIndex((r) => r.sequence === targetSeq)
      if (idx === -1) return prev
      const existing = prev[idx]
      const newChoices = { ...(existing.choices ?? {}) } as Record<string, unknown>
      delete newChoices[choiceKey]
      const updated: BuildLevelRow = { ...existing, choices: newChoices }
      const next = [...prev]
      next[idx] = updated
      return next
    })
    setIsDirty(true)
  }, [])

  const levelUp = useCallback((classId: string, hpRoll: number | null) => {
    setRows((prev) => {
      const levelRows = prev.filter((r) => r.sequence !== 0)
      const classLevelCount = levelRows.filter((r) => r.class_id === classId).length
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
      const levelRows = prev.filter((r) => r.sequence !== 0)
      if (levelRows.length === 0) return prev
      const maxSeq = levelRows.reduce((m, r) => Math.max(m, r.sequence), 0)
      return prev.filter((r) => r.sequence !== maxSeq)
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
      resolved,
      isDirty,
      updateCharacter,
      updateCreation,
      makeChoice,
      clearChoice,
      levelUp,
      levelDown,
      markSaved,
    }),
    [character, rows, build, resolved, isDirty, updateCharacter, updateCreation, makeChoice, clearChoice, levelUp, levelDown, markSaved],
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
