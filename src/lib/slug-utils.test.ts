import { validateSlug } from '@/lib/slug-utils'

describe('validateSlug', () => {
  it('returns the slug unchanged when it is valid', () => {
    expect(validateSlug('my-campaign')).toBe('my-campaign')
  })

  it('accepts slugs with only lowercase letters', () => {
    expect(validateSlug('abc')).toBe('abc')
  })

  it('accepts slugs with digits and hyphens', () => {
    expect(validateSlug('session-1')).toBe('session-1')
  })

  it('accepts slugs that are purely numeric', () => {
    expect(validateSlug('123')).toBe('123')
  })

  it('throws when slug contains a comma', () => {
    expect(() => validateSlug('slug,injected.eq.1')).toThrow('Invalid slug format')
  })

  it('throws when slug contains a period', () => {
    expect(() => validateSlug('slug.eq.1')).toThrow('Invalid slug format')
  })

  it('throws when slug is an empty string', () => {
    expect(() => validateSlug('')).toThrow('Invalid slug format')
  })

  it('throws when slug contains uppercase letters', () => {
    expect(() => validateSlug('MySlug')).toThrow('Invalid slug format')
  })

  it('throws when slug contains spaces', () => {
    expect(() => validateSlug('my slug')).toThrow('Invalid slug format')
  })
})
