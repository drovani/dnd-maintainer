import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EquipmentStep } from '@/components/character-builder/EquipmentStep'
import type { ResolvedCharacter } from '@/types/resolved'
import type { ChoiceKey } from '@/types/choices'
import type { GrantBundle } from '@/types/sources'
import { requireItemDef } from '@/lib/sources/items'

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

let mockContextValue: {
  bundles: readonly GrantBundle[]
  resolved: Partial<ResolvedCharacter> | null
  build: { choices: Record<string, unknown> } | null
  makeChoice: typeof mockMakeChoice
  clearChoice: typeof mockClearChoice
}

vi.mock('@/hooks/useCharacterContext', () => ({
  useCharacterContext: () => mockContextValue,
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIGHTER_SOURCE = { origin: 'class' as const, id: 'fighter' as const, level: 1 }

function makeLoadoutBundle(): GrantBundle {
  return {
    source: FIGHTER_SOURCE,
    grants: [
      {
        type: 'bundle-choice',
        key: 'bundle-choice:class:fighter:0' as ChoiceKey,
        category: 'loadout',
        bundleIds: ['fighter-chainmail', 'fighter-archer-kit'],
      },
    ],
  }
}

function makeMeleeBundle(): GrantBundle {
  return {
    source: FIGHTER_SOURCE,
    grants: [
      {
        type: 'bundle-choice',
        key: 'bundle-choice:class:fighter:1' as ChoiceKey,
        category: 'melee-weapon',
        bundleIds: ['martial-weapon-and-shield', 'two-martial-weapons'],
      },
    ],
  }
}

function makeResolved(equipment: ResolvedCharacter['equipment'] = []): Partial<ResolvedCharacter> {
  return { pendingChoices: [], equipment }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EquipmentStep — two-column layout', () => {
  beforeEach(() => {
    mockContextValue = {
      bundles: [],
      resolved: makeResolved() as ResolvedCharacter,
      build: { choices: {} },
      makeChoice: mockMakeChoice,
      clearChoice: mockClearChoice,
    }
  })

  it('renders both Class Equipment Loadout and Purchase Equipment section headers', () => {
    render(<EquipmentStep />)

    expect(screen.getByText('classLoadoutTitle')).toBeTruthy()
    expect(screen.getByText('purchaseTitle')).toBeTruthy()
    expect(screen.getByText('purchaseComingSoon')).toBeTruthy()
  })

  it('always renders the Equipment Summary panel in the right column', () => {
    render(<EquipmentStep />)

    expect(screen.getByText('summary')).toBeTruthy()
    // Empty-state message when no equipment is materialized yet
    expect(screen.getByText('summaryEmpty')).toBeTruthy()
  })

  it('renders class bundle-choice grants as ChoicePicker options (from bundles, not pendingChoices)', () => {
    mockContextValue.bundles = [makeLoadoutBundle()]

    render(<EquipmentStep />)

    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(2)
  })

  it('keeps the choice visible after a decision is made so the user can change their pick', () => {
    mockContextValue.bundles = [makeLoadoutBundle()]
    // Simulate a decision already being made
    mockContextValue.build = {
      choices: {
        'bundle-choice:class:fighter:0': {
          type: 'bundle-choice',
          bundleId: 'fighter-chainmail',
          slotPicks: {},
        },
      },
    }
    // Resolver has already materialized the equipment (no pending choice remains)
    mockContextValue.resolved = makeResolved([
      {
        itemId: 'chain-mail',
        itemDef: requireItemDef('chain-mail'),
        quantity: 1,
        source: { origin: 'bundle', id: 'fighter-chainmail' },
        equipped: false,
      },
    ]) as ResolvedCharacter

    render(<EquipmentStep />)

    // Both radios must still render so the user can switch their pick
    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(radios).toHaveLength(2)
    // And the selected one should reflect the current decision
    const checkedIds = radios.filter((r) => r.checked).map((r) => r.id)
    expect(checkedIds.some((id) => id.endsWith('-fighter-chainmail'))).toBe(true)
  })

  it('renders class bundle-choices in canonical BUNDLE_CATEGORIES order even when bundles are out of order', () => {
    // Supply melee first, loadout second — the step should still render loadout first
    mockContextValue.bundles = [makeMeleeBundle(), makeLoadoutBundle()]

    const { container } = render(<EquipmentStep />)

    const radios = Array.from(container.querySelectorAll('input[type="radio"]'))
    const firstName = radios[0]?.getAttribute('name') ?? ''
    expect(firstName).toContain('bundle-choice:class:fighter:0')
  })

  it('shows coming-soon text when no class bundle-choice grants exist', () => {
    mockContextValue.bundles = []

    render(<EquipmentStep />)

    expect(screen.getByText('comingSoon')).toBeTruthy()
  })

  it('summary panel lists materialized equipment grouped by type', () => {
    mockContextValue.bundles = [makeLoadoutBundle()]
    mockContextValue.resolved = makeResolved([
      {
        itemId: 'chain-mail',
        itemDef: requireItemDef('chain-mail'),
        quantity: 1,
        source: { origin: 'bundle', id: 'fighter-chainmail' },
        equipped: false,
      },
      {
        itemId: 'longsword',
        itemDef: requireItemDef('longsword'),
        quantity: 1,
        source: { origin: 'bundle', id: 'martial-weapon-and-shield' },
        equipped: false,
      },
    ]) as ResolvedCharacter

    render(<EquipmentStep />)

    // Summary should show both the weapon header and the armor header
    expect(screen.getByText('summary')).toBeTruthy()
    // Empty-state must NOT render when there's materialized equipment
    expect(screen.queryByText('summaryEmpty')).toBeNull()
  })
})
