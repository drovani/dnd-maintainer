import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EquipmentStep } from '@/components/character-builder/EquipmentStep'
import type { ResolvedCharacter, PendingChoice } from '@/types/resolved'
import type { ChoiceKey } from '@/types/choices'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      const segments = key.split('.')
      return opts?.defaultValue ?? segments[segments.length - 1]
    },
  }),
}))

// ---------------------------------------------------------------------------
// Mock useCharacterContext
// ---------------------------------------------------------------------------

const mockMakeChoice = vi.fn()
const mockClearChoice = vi.fn()

function makeResolvedWithChoices(
  pendingChoices: readonly PendingChoice[],
): Partial<ResolvedCharacter> {
  return {
    pendingChoices: pendingChoices as PendingChoice[],
    equipment: [],
  }
}

let mockContextValue: {
  resolved: Partial<ResolvedCharacter> | null
  build: { choices: Record<string, unknown> } | null
  makeChoice: typeof mockMakeChoice
  clearChoice: typeof mockClearChoice
}

vi.mock('@/hooks/useCharacterContext', () => ({
  useCharacterContext: () => mockContextValue,
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EquipmentStep — category grouping', () => {
  const FIGHTER_SOURCE = { origin: 'class' as const, id: 'fighter' as const, level: 1 }

  beforeEach(() => {
    mockContextValue = {
      resolved: null,
      build: { choices: {} },
      makeChoice: mockMakeChoice,
      clearChoice: mockClearChoice,
    }
  })

  it('renders loadout section when a bundle-choice has category loadout', () => {
    const loadoutChoice: PendingChoice = {
      type: 'bundle-choice',
      choiceKey: 'bundle-choice:class:fighter:0' as ChoiceKey,
      source: FIGHTER_SOURCE,
      category: 'loadout',
      bundleIds: ['fighter-chainmail', 'fighter-archer-kit'],
    }
    mockContextValue.resolved = makeResolvedWithChoices([loadoutChoice]) as ResolvedCharacter

    render(<EquipmentStep />)

    // Section header: t('characterBuilder.equipment.sections.loadout') → last segment 'loadout'
    expect(screen.getByText('loadout')).toBeTruthy()
  })

  it('does not render empty category sections', () => {
    const loadoutChoice: PendingChoice = {
      type: 'bundle-choice',
      choiceKey: 'bundle-choice:class:fighter:0' as ChoiceKey,
      source: FIGHTER_SOURCE,
      category: 'loadout',
      bundleIds: ['fighter-chainmail'],
    }
    mockContextValue.resolved = makeResolvedWithChoices([loadoutChoice]) as ResolvedCharacter

    render(<EquipmentStep />)

    // 'melee-weapon' section should NOT render (no choices for it)
    expect(screen.queryByText('melee-weapon')).toBeNull()
  })

  it('renders sections in fixed order: loadout before melee-weapon', () => {
    const loadoutChoice: PendingChoice = {
      type: 'bundle-choice',
      choiceKey: 'bundle-choice:class:fighter:0' as ChoiceKey,
      source: FIGHTER_SOURCE,
      category: 'loadout',
      bundleIds: ['fighter-chainmail'],
    }
    const meleeChoice: PendingChoice = {
      type: 'bundle-choice',
      choiceKey: 'bundle-choice:class:fighter:1' as ChoiceKey,
      source: FIGHTER_SOURCE,
      category: 'melee-weapon',
      bundleIds: ['longsword-and-shield'],
    }
    mockContextValue.resolved = makeResolvedWithChoices([
      meleeChoice,
      loadoutChoice,
    ]) as ResolvedCharacter

    const { container } = render(<EquipmentStep />)

    const headers = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent)
    const loadoutIndex = headers.findIndex((h) => h === 'loadout')
    const meleeIndex = headers.findIndex((h) => h === 'melee-weapon')

    expect(loadoutIndex).toBeLessThan(meleeIndex)
  })

  it('shows coming-soon message when no pending choices exist', () => {
    mockContextValue.resolved = makeResolvedWithChoices([]) as ResolvedCharacter

    render(<EquipmentStep />)

    // t('characterBuilder.equipment.comingSoon') → last segment 'comingSoon'
    expect(screen.getByText('comingSoon')).toBeTruthy()
  })

  it('equipment summary still renders below choices', () => {
    const loadoutChoice: PendingChoice = {
      type: 'bundle-choice',
      choiceKey: 'bundle-choice:class:fighter:0' as ChoiceKey,
      source: FIGHTER_SOURCE,
      category: 'loadout',
      bundleIds: ['fighter-chainmail'],
    }
    mockContextValue.resolved = {
      ...(makeResolvedWithChoices([loadoutChoice]) as ResolvedCharacter),
      equipment: [
        {
          itemId: 'chain-mail',
          itemDef: { type: 'armor', id: 'chain-mail', baseAc: 16, maxDexBonus: 0, category: 'heavy', properties: [], weight: 55, costGp: 75 } as import('@/types/items').ItemDef,
          quantity: 1,
          source: { origin: 'bundle', id: 'fighter-chainmail' },
          equipped: false,
        },
      ],
    }

    const { container } = render(<EquipmentStep />)

    // Equipment Summary header: t('characterBuilder.equipment.summary') → 'summary'
    expect(container.querySelector('.border-t')).toBeTruthy()
  })
})
