import { fireEvent, render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders without disabled, aria-busy, or animation classes by default', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })

    expect(button).not.toBeDisabled()
    expect(button).not.toHaveAttribute('aria-busy')
    expect(button).not.toHaveClass('btn-pending-shimmer')
    expect(button).not.toHaveClass('btn-pending-pulse')
  })

  it('is disabled, aria-busy, and has btn-pending-shimmer when pending={true} with default size', () => {
    render(<Button pending={true}>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveClass('btn-pending-shimmer')
    expect(button).not.toHaveClass('btn-pending-pulse')
  })

  it('has btn-pending-pulse instead of shimmer when pending={true} with size="icon"', () => {
    render(<Button pending={true} size="icon">X</Button>)
    const button = screen.getByRole('button', { name: 'X' })

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveClass('btn-pending-pulse')
    expect(button).not.toHaveClass('btn-pending-shimmer')
  })

  it('is disabled when both pending={true} and disabled prop are passed', () => {
    render(<Button pending={true} disabled={true}>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })

    expect(button).toBeDisabled()
  })

  it('is disabled without aria-busy or animation classes when pending={false} and disabled={true}', () => {
    render(<Button pending={false} disabled={true}>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })

    expect(button).toBeDisabled()
    expect(button).not.toHaveAttribute('aria-busy')
    expect(button).not.toHaveClass('btn-pending-shimmer')
    expect(button).not.toHaveClass('btn-pending-pulse')
  })

  it('does not fire click handler when pending={true}', () => {
    const onClick = vi.fn()
    render(<Button pending={true} onClick={onClick}>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })

    fireEvent.click(button)

    expect(onClick).not.toHaveBeenCalled()
  })
})
