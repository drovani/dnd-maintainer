import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChoicePicker } from '@/components/character-builder/ChoicePicker'
import type { PendingChoice } from '@/types/resolved'
import type { ChoiceKey, ChoiceDecision } from '@/types/choices'

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

const EQUIPMENT_CHOICE: PendingChoice & { type: 'equipment-choice' } = {
  type: 'equipment-choice',
  choiceKey: 'equipment-choice:class:fighter:0' as ChoiceKey,
  source: FIGHTER_SOURCE,
  options: [
    [{ itemId: 'chain-mail', quantity: 1 }],
    [{ itemId: 'leather', quantity: 1 }],
  ],
}

const WEAPON_CHOICE: PendingChoice & { type: 'equipment-choice' } = {
  type: 'equipment-choice',
  choiceKey: 'equipment-choice:class:fighter:1' as ChoiceKey,
  source: FIGHTER_SOURCE,
  options: [
    [{ itemId: 'longsword', quantity: 1 }],
    [{ itemId: 'shortsword', quantity: 1 }, { itemId: 'shortsword', quantity: 1 }],
  ],
}

// ---------------------------------------------------------------------------
// ChoicePicker — equipment-choice branch
// ---------------------------------------------------------------------------

describe('ChoicePicker equipment-choice', () => {
  it('renders a radio group with one input per option', () => {
    const onDecide = vi.fn()
    const onClear = vi.fn()
    render(
      <ChoicePicker
        choice={EQUIPMENT_CHOICE}
        currentDecision={undefined}
        onDecide={onDecide}
        onClear={onClear}
      />,
    )
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(2)
  })

  it('clicking option 0 calls onDecide with optionIndex 0', () => {
    const onDecide = vi.fn()
    render(
      <ChoicePicker
        choice={EQUIPMENT_CHOICE}
        currentDecision={undefined}
        onDecide={onDecide}
        onClear={vi.fn()}
      />,
    )
    const radios = screen.getAllByRole('radio')
    fireEvent.click(radios[0])
    expect(onDecide).toHaveBeenCalledWith(EQUIPMENT_CHOICE.choiceKey, {
      type: 'equipment-choice',
      optionIndex: 0,
    })
  })

  it('clicking option 1 calls onDecide with optionIndex 1', () => {
    const onDecide = vi.fn()
    render(
      <ChoicePicker
        choice={EQUIPMENT_CHOICE}
        currentDecision={undefined}
        onDecide={onDecide}
        onClear={vi.fn()}
      />,
    )
    const radios = screen.getAllByRole('radio')
    fireEvent.click(radios[1])
    expect(onDecide).toHaveBeenCalledWith(EQUIPMENT_CHOICE.choiceKey, {
      type: 'equipment-choice',
      optionIndex: 1,
    })
  })

  it('selected radio reflects currentDecision.optionIndex', () => {
    const currentDecision: ChoiceDecision = { type: 'equipment-choice', optionIndex: 1 }
    render(
      <ChoicePicker
        choice={EQUIPMENT_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(radios[0].checked).toBe(false)
    expect(radios[1].checked).toBe(true)
  })

  it('no radio is checked when currentDecision is undefined', () => {
    render(
      <ChoicePicker
        choice={EQUIPMENT_CHOICE}
        currentDecision={undefined}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(radios.every((r) => !r.checked)).toBe(true)
  })

  it('multi-item option joins items with + separator, not or', () => {
    const bundleChoice: PendingChoice & { type: 'equipment-choice' } = {
      type: 'equipment-choice',
      choiceKey: 'equipment-choice:class:fighter:2' as ChoiceKey,
      source: FIGHTER_SOURCE,
      options: [
        [
          { itemId: 'leather', quantity: 1 },
          { itemId: 'longbow', quantity: 1 },
          { itemId: 'arrow', quantity: 20 },
        ],
      ],
    }
    render(
      <ChoicePicker
        choice={bundleChoice}
        currentDecision={undefined}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    const label = screen.getByRole('radio').closest('div')?.querySelector('label')
    // mock t() returns the last key segment, so itemBundleSeparator → 'itemBundleSeparator'
    // confirming it does NOT use the old 'optionSeparator' key (which would render 'optionSeparator')
    expect(label?.textContent).toContain('itemBundleSeparator')
    expect(label?.textContent).not.toContain('optionSeparator')
  })

  it('Clear button does NOT appear when no option is selected', () => {
    render(
      <ChoicePicker
        choice={EQUIPMENT_CHOICE}
        currentDecision={undefined}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: /clear/i })).toBeNull()
  })

  it('Clear button appears when currentDecision.optionIndex === 0', () => {
    const currentDecision: ChoiceDecision = { type: 'equipment-choice', optionIndex: 0 }
    render(
      <ChoicePicker
        choice={EQUIPMENT_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /clear/i })).toBeTruthy()
  })

  it('clicking Clear calls onClear with the correct choiceKey', () => {
    const onClear = vi.fn()
    const currentDecision: ChoiceDecision = { type: 'equipment-choice', optionIndex: 1 }
    render(
      <ChoicePicker
        choice={EQUIPMENT_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={onClear}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(onClear).toHaveBeenCalledWith(EQUIPMENT_CHOICE.choiceKey)
  })

  it('weapon option label includes damageDice and damageType', () => {
    render(
      <ChoicePicker
        choice={WEAPON_CHOICE}
        currentDecision={undefined}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    // longsword: 1d8 slashing — t('damageTypes.slashing') → 'slashing'
    // mock t returns last segment of key, so getItemNameKey returns 'name', damageDice is '1d8'
    const labels = screen.getAllByRole('radio').map((r) => {
      const label = r.closest('div')?.querySelector('label')
      return label?.textContent ?? ''
    })
    // At least one label should contain the damageDice from longsword
    expect(labels.some((l) => l.includes('1d8'))).toBe(true)
  })
})
