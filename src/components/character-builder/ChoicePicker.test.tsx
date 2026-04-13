import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChoicePicker } from '@/components/character-builder/ChoicePicker'
import type { PendingChoice } from '@/types/resolved'
import type { ChoiceKey, ChoiceDecision } from '@/types/choices'
import type { BundleCategory } from '@/types/items'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      const segments = key.split('.')
      return opts?.defaultValue ?? segments[segments.length - 1]
    },
  }),
}))

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const FIGHTER_SOURCE = { origin: 'class' as const, id: 'fighter' as const, level: 1 }

// ---------------------------------------------------------------------------
// ChoicePicker — bundle-choice branch
// ---------------------------------------------------------------------------

const BUNDLE_CHOICE: PendingChoice & { type: 'bundle-choice' } = {
  type: 'bundle-choice',
  choiceKey: 'bundle-choice:class:fighter:0' as ChoiceKey,
  source: FIGHTER_SOURCE,
  category: 'loadout' as BundleCategory,
  bundleIds: ['fighter-chainmail', 'fighter-archer-kit'] as string[],
}

describe('ChoicePicker bundle-choice', () => {
  it('renders a radio group with one input per bundle option', () => {
    render(
      <ChoicePicker
        choice={BUNDLE_CHOICE}
        currentDecision={undefined}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(2)
  })

  it('no radio is checked when currentDecision is undefined', () => {
    render(
      <ChoicePicker
        choice={BUNDLE_CHOICE}
        currentDecision={undefined}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(radios.every((r) => !r.checked)).toBe(true)
  })

  it('clicking option calls onDecide with the bundleId', () => {
    const onDecide = vi.fn()
    render(
      <ChoicePicker
        choice={BUNDLE_CHOICE}
        currentDecision={undefined}
        onDecide={onDecide}
        onClear={vi.fn()}
      />,
    )
    const radios = screen.getAllByRole('radio')
    fireEvent.click(radios[0])
    expect(onDecide).toHaveBeenCalledWith(BUNDLE_CHOICE.choiceKey, {
      type: 'bundle-choice',
      bundleId: 'fighter-chainmail',
      slotPicks: {},
    })
  })

  it('selected radio reflects currentDecision.bundleId', () => {
    const currentDecision: ChoiceDecision = {
      type: 'bundle-choice',
      bundleId: 'fighter-archer-kit',
      slotPicks: {},
    }
    render(
      <ChoicePicker
        choice={BUNDLE_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(radios[0].checked).toBe(false)
    expect(radios[1].checked).toBe(true)
  })

  it('Clear button does NOT appear when no bundle is selected', () => {
    render(
      <ChoicePicker
        choice={BUNDLE_CHOICE}
        currentDecision={undefined}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: /clear/i })).toBeNull()
  })

  it('Clear button appears when a bundleId is selected', () => {
    const currentDecision: ChoiceDecision = {
      type: 'bundle-choice',
      bundleId: 'fighter-chainmail',
      slotPicks: {},
    }
    render(
      <ChoicePicker
        choice={BUNDLE_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /clear/i })).toBeTruthy()
  })

  it('clicking Clear calls onClear with the correct choiceKey', () => {
    const onClear = vi.fn()
    const currentDecision: ChoiceDecision = {
      type: 'bundle-choice',
      bundleId: 'fighter-chainmail',
      slotPicks: {},
    }
    render(
      <ChoicePicker
        choice={BUNDLE_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={onClear}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(onClear).toHaveBeenCalledWith(BUNDLE_CHOICE.choiceKey)
  })

  it('bundle option label uses + separator between items', () => {
    render(
      <ChoicePicker
        choice={BUNDLE_CHOICE}
        currentDecision={undefined}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    // mock t returns last key segment → 'itemBundleSeparator' for the separator key
    const labels = screen.getAllByRole('radio').map((r) => {
      const label = r.closest('div')?.querySelector('label')
      return label?.textContent ?? ''
    })
    // fighter-archer-kit has multiple items, so + separator appears
    expect(labels.some((l) => l.includes('itemBundleSeparator'))).toBe(true)
  })

  it('pack-type bundleId renders correctly', () => {
    const packChoice: PendingChoice & { type: 'bundle-choice' } = {
      type: 'bundle-choice',
      choiceKey: 'bundle-choice:class:fighter:3' as ChoiceKey,
      source: FIGHTER_SOURCE,
      category: 'pack' as BundleCategory,
      bundleIds: ['dungeoneers-pack', 'explorers-pack'] as string[],
    }
    render(
      <ChoicePicker
        choice={packChoice}
        currentDecision={undefined}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(2)
  })

  // -------------------------------------------------------------------------
  // Card rendering for pack category
  // -------------------------------------------------------------------------

  it('pack category renders each option as a card with contents listed', () => {
    const packChoice: PendingChoice & { type: 'bundle-choice' } = {
      type: 'bundle-choice',
      choiceKey: 'bundle-choice:class:fighter:3' as ChoiceKey,
      source: FIGHTER_SOURCE,
      category: 'pack' as BundleCategory,
      bundleIds: ['dungeoneers-pack', 'explorers-pack'] as string[],
    }
    render(
      <ChoicePicker
        choice={packChoice}
        currentDecision={undefined}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    // Both packs render as cards via their test ids
    expect(screen.getByTestId('bundle-pack-card-dungeoneers-pack')).toBeTruthy()
    expect(screen.getByTestId('bundle-pack-card-explorers-pack')).toBeTruthy()

    // Pack contents render as <ul>/<li> inside the card, including e.g. backpack
    const dungeoneerCard = screen.getByTestId('bundle-pack-card-dungeoneers-pack')
    expect(dungeoneerCard.querySelector('ul')).toBeTruthy()
    // The mocked t() returns the last segment of the key, so 'items.gear.backpack.name' → 'name'.
    // Easier assertion: there are list items inside
    expect(dungeoneerCard.querySelectorAll('li').length).toBeGreaterThan(0)
  })

  it('clicking a pack card calls onDecide with that bundleId and empty slotPicks', () => {
    const packChoice: PendingChoice & { type: 'bundle-choice' } = {
      type: 'bundle-choice',
      choiceKey: 'bundle-choice:class:fighter:3' as ChoiceKey,
      source: FIGHTER_SOURCE,
      category: 'pack' as BundleCategory,
      bundleIds: ['dungeoneers-pack', 'explorers-pack'] as string[],
    }
    const onDecide = vi.fn()
    render(
      <ChoicePicker
        choice={packChoice}
        currentDecision={undefined}
        onDecide={onDecide}
        onClear={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByTestId('bundle-pack-card-explorers-pack'))
    expect(onDecide).toHaveBeenCalledWith(packChoice.choiceKey, {
      type: 'bundle-choice',
      bundleId: 'explorers-pack',
      slotPicks: {},
    })
  })

  // -------------------------------------------------------------------------
  // Slotted bundle rendering
  // -------------------------------------------------------------------------

  const SLOTTED_CHOICE: PendingChoice & { type: 'bundle-choice' } = {
    type: 'bundle-choice',
    choiceKey: 'bundle-choice:class:fighter:1' as ChoiceKey,
    source: FIGHTER_SOURCE,
    category: 'melee-weapon' as BundleCategory,
    bundleIds: ['martial-weapon-and-shield', 'two-martial-weapons'] as string[],
  }

  it('selecting a bundle calls onDecide with empty slotPicks', () => {
    const onDecide = vi.fn()
    render(
      <ChoicePicker
        choice={SLOTTED_CHOICE}
        currentDecision={undefined}
        onDecide={onDecide}
        onClear={vi.fn()}
      />,
    )
    const radios = screen.getAllByRole('radio')
    fireEvent.click(radios[0])
    expect(onDecide).toHaveBeenCalledWith(SLOTTED_CHOICE.choiceKey, {
      type: 'bundle-choice',
      bundleId: 'martial-weapon-and-shield',
      slotPicks: {},
    })
  })

  it('does not render the fixed-contents panel for slotted bundles with no fixed contents', () => {
    // Both martial-weapon-and-shield and two-martial-weapons now have empty .contents,
    // so the "Also includes" panel should never render for either.
    const decision: ChoiceDecision = {
      type: 'bundle-choice',
      bundleId: 'martial-weapon-and-shield',
      slotPicks: {},
    }
    render(
      <ChoicePicker
        choice={SLOTTED_CHOICE}
        currentDecision={decision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(screen.queryByTestId('bundle-fixed-contents-martial-weapon-and-shield')).toBeNull()
  })

  it('slot pickers only appear when the slotted bundle is selected', () => {
    const { container, rerender } = render(
      <ChoicePicker
        choice={SLOTTED_CHOICE}
        currentDecision={undefined}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    // No bundle selected → no slot prompts visible
    expect(container.querySelectorAll('[data-slot="select-trigger"]').length).toBe(0)

    // Select "a martial weapon and a shield" — 2 slots (weapon + shield) should appear
    const decision: ChoiceDecision = {
      type: 'bundle-choice',
      bundleId: 'martial-weapon-and-shield',
      slotPicks: {},
    }
    rerender(
      <ChoicePicker
        choice={SLOTTED_CHOICE}
        currentDecision={decision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(container.querySelectorAll('[data-slot="select-trigger"]').length).toBe(2)

    // Switch to the "two martial weapons" bundle — 2 slot pickers
    const twoWeaponDecision: ChoiceDecision = {
      type: 'bundle-choice',
      bundleId: 'two-martial-weapons',
      slotPicks: {},
    }
    rerender(
      <ChoicePicker
        choice={SLOTTED_CHOICE}
        currentDecision={twoWeaponDecision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(container.querySelectorAll('[data-slot="select-trigger"]').length).toBe(2)
  })
})
