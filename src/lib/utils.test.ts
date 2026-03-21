import { cn } from '@/lib/utils'

describe('cn', () => {
  it('merges multiple class strings', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz')
  })

  it('handles conditional and falsy values', () => {
    const condA = false
    const condB = 0
    expect(cn('foo', condA && 'bar', null, undefined, condB && 'baz')).toBe('foo')
  })

  it('resolves Tailwind conflicts — last value wins', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('returns empty string for empty input', () => {
    expect(cn()).toBe('')
  })
})
