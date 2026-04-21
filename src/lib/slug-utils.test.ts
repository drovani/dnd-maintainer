import { validateSlug } from '@/lib/slug-utils';

describe('validateSlug', () => {
  it('returns the slug unchanged when it is valid', () => {
    expect(validateSlug('my-campaign')).toBe('my-campaign');
  });

  it('accepts slugs with only lowercase letters', () => {
    expect(validateSlug('abc')).toBe('abc');
  });

  it('accepts slugs with digits and hyphens', () => {
    expect(validateSlug('session-1')).toBe('session-1');
  });

  it('accepts slugs that are purely numeric', () => {
    expect(validateSlug('123')).toBe('123');
  });

  it('throws when slug contains a comma', () => {
    expect(() => validateSlug('slug,injected.eq.1')).toThrow('Invalid slug format');
  });

  it('throws when slug contains a period', () => {
    expect(() => validateSlug('slug.eq.1')).toThrow('Invalid slug format');
  });

  it('throws when slug is an empty string', () => {
    expect(() => validateSlug('')).toThrow('Invalid slug format');
  });

  it('throws when slug contains uppercase letters', () => {
    expect(() => validateSlug('MySlug')).toThrow('Invalid slug format');
  });

  it('throws when slug contains spaces', () => {
    expect(() => validateSlug('my slug')).toThrow('Invalid slug format');
  });

  it('throws when slug has a leading hyphen', () => {
    expect(() => validateSlug('-leading')).toThrow('Invalid slug format');
  });

  it('throws when slug has a trailing hyphen', () => {
    expect(() => validateSlug('trailing-')).toThrow('Invalid slug format');
  });

  it('throws when slug is only hyphens', () => {
    expect(() => validateSlug('---')).toThrow('Invalid slug format');
  });

  it('throws when slug exceeds 128 characters', () => {
    const longSlug = 'a'.repeat(129);
    expect(() => validateSlug(longSlug)).toThrow('Slug too long');
  });

  it('accepts a slug at exactly 128 characters', () => {
    const maxSlug = 'a'.repeat(128);
    expect(validateSlug(maxSlug)).toBe(maxSlug);
  });

  it('rejects underscores', () => {
    expect(() => validateSlug('my_slug')).toThrow('Invalid slug format');
  });

  it('accepts a single character slug', () => {
    expect(validateSlug('a')).toBe('a');
  });
});
