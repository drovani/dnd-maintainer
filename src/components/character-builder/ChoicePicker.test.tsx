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
    })
  })

  it('selected radio reflects currentDecision.bundleId', () => {
    const currentDecision: ChoiceDecision = {
      type: 'bundle-choice',
      bundleId: 'fighter-archer-kit',
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
})
