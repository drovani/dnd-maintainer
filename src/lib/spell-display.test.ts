import { describe, it, expect } from 'vitest';
import { getSpellDisplayMeta } from '@/lib/spell-display';

describe('getSpellDisplayMeta', () => {
  it('returns correct level and school for a catalogued spell id', () => {
    const meta = getSpellDisplayMeta('speak-with-animals');
    expect(meta).not.toBeNull();
    expect(meta!.level).toBe(1);
    expect(meta!.school).toBe('divination');
  });

  it('returns correct level and school for a cantrip', () => {
    const meta = getSpellDisplayMeta('guidance');
    expect(meta).not.toBeNull();
    expect(meta!.level).toBe(0);
    expect(meta!.school).toBe('divination');
  });

  it('returns null for an uncatalogued spell id', () => {
    expect(getSpellDisplayMeta('totally-unknown-spell')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(getSpellDisplayMeta('')).toBeNull();
  });
});
