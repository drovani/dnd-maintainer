import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BasicsStep } from '@/components/character-builder/BasicsStep'
import { CLASS_SOURCES } from '@/lib/sources/classes'
import { RACE_SOURCES } from '@/lib/sources/races'
import * as randomNpcModule from '@/lib/character-builder/random-npc'
import type { Character, AbilityScores } from '@/types/database'
import type { BuildLevelRow, CreationRow, LevelRow } from '@/lib/build-reconstruction'

// ---------------------------------------------------------------------------
// react-i18next mock — pattern from EquipmentStep.test.tsx
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: (ns?: string) => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const segments = key.split('.')
      const base = segments[segments.length - 1]
      // Interpolate {{class}} for quickNpcButton
      if (opts && 'class' in opts) return `${base}:${String(opts.class)}`
      return base
    },
    i18n: { language: 'en' },
    ns,
  }),
}))

// ---------------------------------------------------------------------------
// Mock usePlayerNames
// ---------------------------------------------------------------------------

vi.mock('@/hooks/useCharacters', () => ({
  usePlayerNames: () => ({ data: [], isError: false }),
}))

// ---------------------------------------------------------------------------
// Mock sonner toast
// ---------------------------------------------------------------------------

const mockToastError = vi.fn()
vi.mock('sonner', () => ({
  toast: { error: (msg: string) => mockToastError(msg) },
}))

// ---------------------------------------------------------------------------
// Shared context state — mutated by mock handlers so the effect can react
// ---------------------------------------------------------------------------

let contextCharacter: Character
let contextRows: readonly BuildLevelRow[]

const mockUpdateCharacter = vi.fn((updates: Partial<Character>) => {
  contextCharacter = { ...contextCharacter, ...updates }
})
const mockUpdateCreation = vi.fn()
const mockLevelUp = vi.fn((classId: string) => {
  // Simulate adding a level-1 row
  const newRow: LevelRow = {
    sequence: 1,
    class_id: classId,
    class_level: 1,
    subclass_id: null,
    hp_roll: null,
    base_abilities: null,
    ability_method: null,
    choices: {},
    asi_allocation: null,
    feat_id: null,
    deleted_at: null,
  }
  contextRows = [contextRows[0], newRow]
})
const mockReplaceLevel = vi.fn()

vi.mock('@/hooks/useCharacterContext', () => ({
  useCharacterContext: () => ({
    character: contextCharacter,
    rows: contextRows,
    build: null,
    bundles: [],
    resolved: null,
    buildError: null,
    buildWarnings: [],
    isDirty: false,
    level: 1,
    hasDeletedRows: false,
    nextRestoreLevel: null,
    updateCharacter: mockUpdateCharacter,
    updateCreation: mockUpdateCreation,
    levelUp: mockLevelUp,
    levelDown: vi.fn(),
    undoLevelDown: vi.fn(),
    replaceLevel: mockReplaceLevel,
    makeChoice: vi.fn(),
    clearChoice: vi.fn(),
    markSaved: vi.fn(),
  }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSeedCharacter(): Character {
  return {
    id: '',
    slug: '',
    previous_slugs: [],
    campaign_id: 'c1',
    name: '',
    player_name: null,
    character_type: 'pc',
    race: null,
    class: null,
    subclass: null,
    level: 0,
    background: null,
    alignment: null,
    gender: null,
    size: null,
    age: null,
    height: null,
    weight: null,
    eye_color: null,
    hair_color: null,
    skin_color: null,
    hit_points_max: null,
    armor_class: null,
    speed: null,
    proficiency_bonus: null,
    personality_traits: null,
    ideals: null,
    bonds: null,
    flaws: null,
    appearance: null,
    backstory: null,
    notes: null,
    portrait_url: null,
    is_active: true,
    status: 'draft',
    created_at: '',
    updated_at: '',
  }
}

function buildCreationRow(base_abilities?: AbilityScores): CreationRow {
  return {
    sequence: 0,
    base_abilities: base_abilities ?? null,
    ability_method: null,
    choices: {},
    deleted_at: null,
  }
}

function buildLevelRow(classId: string, sequence: number = 1): LevelRow {
  return {
    sequence,
    class_id: classId,
    class_level: 1,
    subclass_id: null,
    hp_roll: null,
    base_abilities: null,
    ability_method: null,
    choices: {},
    asi_allocation: null,
    feat_id: null,
    deleted_at: null,
  }
}

function resetContext() {
  contextCharacter = buildSeedCharacter()
  contextRows = [buildCreationRow()]
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BasicsStep', () => {
  beforeEach(() => {
    resetContext()
    vi.clearAllMocks()
  })

  it('renders one Quick NPC button per CLASS_SOURCES entry', () => {
    render(<BasicsStep />)

    const npcButtons = CLASS_SOURCES.map((c) =>
      screen.getByRole('button', { name: new RegExp(c.id, 'i') }),
    )
    expect(npcButtons).toHaveLength(CLASS_SOURCES.length)
    // Fighter button must be present
    expect(screen.getByRole('button', { name: /fighter/i })).toBeTruthy()
  })

  it('clicking the Fighter button advances to Skills exactly once', async () => {
    const onRequestAdvance = vi.fn()
    const { rerender } = render(<BasicsStep onRequestAdvance={onRequestAdvance} />)

    fireEvent.click(screen.getByRole('button', { name: /fighter/i }))

    // Simulate all state updates landing: character fields + base_abilities on creation row
    contextCharacter = {
      ...contextCharacter,
      character_type: 'npc',
      name: 'Test Name',
      race: RACE_SOURCES[0].id,
      alignment: 'lg',
      class: 'fighter',
      level: 1,
      background: 'soldier',
      gender: 'male',
    }
    contextRows = [
      buildCreationRow({ str: 15, dex: 13, con: 14, int: 12, wis: 10, cha: 8 }),
      buildLevelRow('fighter'),
    ]

    rerender(<BasicsStep onRequestAdvance={onRequestAdvance} />)

    await waitFor(() => expect(onRequestAdvance).toHaveBeenCalledWith('skills'))
    expect(onRequestAdvance).toHaveBeenCalledTimes(1)
  })

  it('clicking the Fighter button populates NPC fields, background=soldier, and base abilities', () => {
    render(<BasicsStep />)

    fireEvent.click(screen.getByRole('button', { name: /fighter/i }))

    // updateCharacter called with required NPC fields
    expect(mockUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        character_type: 'npc',
        player_name: '',
        class: 'fighter',
        level: 1,
        background: 'soldier',
      }),
    )
    const updateCall = mockUpdateCharacter.mock.calls[0][0] as Partial<Character>
    expect(['male', 'female']).toContain(updateCall.gender)
    expect(RACE_SOURCES.map((r) => r.id)).toContain(updateCall.race)
    expect(updateCall.name).toBeTruthy()

    // updateCreation called with base_abilities
    expect(mockUpdateCreation).toHaveBeenCalledWith(
      expect.objectContaining({ base_abilities: expect.objectContaining({}) }),
    )
    const creationCall = mockUpdateCreation.mock.calls[0][0] as { base_abilities: AbilityScores }
    const abilities = creationCall.base_abilities
    // Fighter quickBuild highestAbility is ['str','dex'] — one of them must be 15
    const highest = Math.max(abilities.str, abilities.dex)
    expect(highest).toBe(15)
    expect(abilities.con).toBe(14)

    // levelUp called since no prior level row existed
    expect(mockLevelUp).toHaveBeenCalledWith('fighter', null)
  })

  it('omitting onRequestAdvance does not crash', () => {
    render(<BasicsStep />)
    expect(() => fireEvent.click(screen.getByRole('button', { name: /fighter/i }))).not.toThrow()
  })

  it('uses replaceLevel instead of levelUp when a level row already exists (re-click case)', () => {
    // Pre-populate a level-1 fighter row to simulate a re-click
    contextRows = [buildCreationRow(), buildLevelRow('fighter', 1)]

    render(<BasicsStep />)

    fireEvent.click(screen.getByRole('button', { name: /fighter/i }))

    expect(mockReplaceLevel).toHaveBeenCalledWith(1, 'fighter', null)
    expect(mockLevelUp).not.toHaveBeenCalled()
  })

  it('shows toast error and does not advance when generateRandomNpcBasics returns null', () => {
    const onRequestAdvance = vi.fn()
    vi.spyOn(randomNpcModule, 'generateRandomNpcBasics').mockReturnValue(null)

    render(<BasicsStep onRequestAdvance={onRequestAdvance} />)

    fireEvent.click(screen.getByRole('button', { name: /fighter/i }))

    expect(mockToastError).toHaveBeenCalledWith('quickNpcFailed')
    expect(onRequestAdvance).not.toHaveBeenCalled()
    expect(mockUpdateCharacter).not.toHaveBeenCalled()
    expect(mockUpdateCreation).not.toHaveBeenCalled()
    expect(mockLevelUp).not.toHaveBeenCalled()
  })
})
