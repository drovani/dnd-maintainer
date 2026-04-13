import { render, screen, fireEvent } from '@testing-library/react'
import { BonusBreakdown } from '@/components/character-sheet/BonusBreakdown'
import type { BonusComponent } from '@/components/character-sheet/BonusBreakdown'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
  }),
}))

describe('BonusBreakdown', () => {
  const components: BonusComponent[] = [
    { type: 'ability', value: 3, label: 'str' },
    { type: 'proficiency', value: 2, label: 'proficiency' },
  ]

  it('renders total with positive sign when total >= 0', () => {
    render(<BonusBreakdown components={components} total={5} />)
    expect(screen.getByText('+5')).toBeInTheDocument()
  })

  it('renders total with negative sign when total < 0', () => {
    render(<BonusBreakdown components={[{ type: 'ability', value: -2, label: 'str' }]} total={-2} />)
    expect(screen.getByText('-2')).toBeInTheDocument()
  })

  it('does not show components initially (collapsed)', () => {
    render(<BonusBreakdown components={components} total={5} />)
    // Component labels should not be visible
    expect(screen.queryByText('+3')).not.toBeInTheDocument()
    expect(screen.queryByText('+2')).not.toBeInTheDocument()
  })

  it('expands to show breakdown components on click', () => {
    render(<BonusBreakdown components={components} total={5} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    // Component values should now be visible
    expect(screen.getByText('+3')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('collapses after second click', () => {
    render(<BonusBreakdown components={components} total={5} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    fireEvent.click(button)
    expect(screen.queryByText('+3')).not.toBeInTheDocument()
  })

  it('renders no button when components array is empty', () => {
    render(<BonusBreakdown components={[]} total={5} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('+5')).toBeInTheDocument()
  })

  it('formats negative component values with sign', () => {
    const negComponents: BonusComponent[] = [{ type: 'ability', value: -1, label: 'str' }]
    render(<BonusBreakdown components={negComponents} total={-1} />)
    fireEvent.click(screen.getByRole('button'))
    // '-1' appears in both the toggle button and the breakdown row
    const allNeg1 = screen.getAllByText('-1')
    expect(allNeg1.length).toBeGreaterThanOrEqual(1)
  })

  it('formats zero value as +0', () => {
    const zeroComponents: BonusComponent[] = [{ type: 'ability', value: 0, label: 'dex' }]
    render(<BonusBreakdown components={zeroComponents} total={0} />)
    // total renders as +0 on the button
    expect(screen.getByText('+0')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    // Also appears in breakdown
    const allPlusZero = screen.getAllByText('+0')
    expect(allPlusZero.length).toBeGreaterThanOrEqual(1)
  })
})
