import { render, screen, fireEvent } from '@testing-library/react'
import { AttacksPanel } from '@/components/character-sheet/AttacksPanel'
import type { ResolvedAttack } from '@/types/resolved'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      const segments = key.split('.')
      return opts?.defaultValue ?? segments[segments.length - 1]
    },
  }),
}))

const LONGSWORD_ATTACK: ResolvedAttack = {
  weaponId: 'longsword',
  name: 'longsword',
  attackBonus: 5,
  attackBreakdown: [
    { type: 'ability', value: 3, label: 'str' },
    { type: 'proficiency', value: 2, label: 'proficiency' },
  ],
  damageDice: '1d8',
  damageBonus: 3,
  damageBreakdown: [{ type: 'ability', value: 3, label: 'str' }],
  damageType: 'slashing',
  properties: ['versatile'],
  range: 'melee',
}

const LONGBOW_ATTACK: ResolvedAttack = {
  weaponId: 'longbow',
  name: 'longbow',
  attackBonus: 6,
  attackBreakdown: [
    { type: 'ability', value: 2, label: 'dex' },
    { type: 'proficiency', value: 2, label: 'proficiency' },
    { type: 'fighting-style', value: 2, label: 'archery' },
  ],
  damageDice: '1d8',
  damageBonus: 2,
  damageBreakdown: [{ type: 'ability', value: 2, label: 'dex' }],
  damageType: 'piercing',
  properties: ['ammunition', 'heavy', 'two-handed'],
  range: 'ranged',
  normalRange: 150,
  longRange: 600,
}

describe('AttacksPanel', () => {
  it('renders empty state message when no attacks', () => {
    render(<AttacksPanel attacks={[]} />)
    // mock returns last segment of key 'characterSheet.attacks.noAttacks' → 'noAttacks'
    expect(screen.getByText('noAttacks')).toBeInTheDocument()
  })

  it('renders attack row with name, attack bonus, and damage string', () => {
    render(<AttacksPanel attacks={[LONGSWORD_ATTACK]} />)
    // weapon name from t(`items.weapons.longsword.name`) → 'name' (last segment)
    expect(screen.getByText('name')).toBeInTheDocument()
    // attack bonus formatted
    expect(screen.getByText('+5')).toBeInTheDocument()
    // damage: '1d8+3 slashing' — damageType from t(`damageTypes.slashing`) → 'slashing'
    expect(screen.getByText('1d8+3 slashing')).toBeInTheDocument()
  })

  it('renders multiple attack rows', () => {
    render(<AttacksPanel attacks={[LONGSWORD_ATTACK, LONGBOW_ATTACK]} />)
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2)
  })

  it('does not show breakdown details before expanding', () => {
    render(<AttacksPanel attacks={[LONGSWORD_ATTACK]} />)
    // breakdown values (+3 from STR, +2 from proficiency) not shown until expanded
    expect(screen.queryByText('+3')).not.toBeInTheDocument()
    expect(screen.queryByText('+2')).not.toBeInTheDocument()
  })

  it('shows breakdown details after expanding a row', () => {
    render(<AttacksPanel attacks={[LONGSWORD_ATTACK]} />)
    const rows = screen.getAllByRole('button')
    // First row button expands the attack
    fireEvent.click(rows[0])
    // After expanding, the attack breakdown values appear
    // versatile property badge — t(`weaponProperties.versatile`) → 'versatile'
    expect(screen.getByText('versatile')).toBeInTheDocument()
  })

  it('collapses row after second click', () => {
    render(<AttacksPanel attacks={[LONGSWORD_ATTACK]} />)
    const rows = screen.getAllByRole('button')
    fireEvent.click(rows[0])
    fireEvent.click(rows[0])
    expect(screen.queryByText('versatile')).not.toBeInTheDocument()
  })

  it('shows range badge for ranged weapons when expanded', () => {
    render(<AttacksPanel attacks={[LONGBOW_ATTACK]} />)
    const rows = screen.getAllByRole('button')
    fireEvent.click(rows[0])
    // range label from t('characterSheet.attacks.range') → 'range'
    expect(screen.getByText(/range/i)).toBeInTheDocument()
  })

  it('renders negative damage bonus without double sign', () => {
    const negAttack: ResolvedAttack = {
      ...LONGSWORD_ATTACK,
      damageBonus: -1,
      damageBreakdown: [{ type: 'ability', value: -1, label: 'str' }],
    }
    render(<AttacksPanel attacks={[negAttack]} />)
    // damage string: '1d8-1 slashing'
    expect(screen.getByText('1d8-1 slashing')).toBeInTheDocument()
  })

  it('renders damage without bonus suffix when damageBonus is 0', () => {
    const noBonus: ResolvedAttack = {
      ...LONGSWORD_ATTACK,
      damageBonus: 0,
      damageBreakdown: [{ type: 'ability', value: 0, label: 'str' }],
    }
    render(<AttacksPanel attacks={[noBonus]} />)
    expect(screen.getByText('1d8 slashing')).toBeInTheDocument()
  })
})
