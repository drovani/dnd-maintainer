import { CHARACTER_DETAIL_COLS, CHARACTER_SUMMARY_COLS } from '@/lib/query-columns';

describe('CHARACTER_SUMMARY_COLS', () => {
  it('contains species (word boundary match)', () => {
    expect(CHARACTER_SUMMARY_COLS).toMatch(/\bspecies\b/);
  });

  it('does not contain race (word boundary match)', () => {
    expect(CHARACTER_SUMMARY_COLS).not.toMatch(/\brace\b/);
  });
});

describe('CHARACTER_DETAIL_COLS', () => {
  it('contains species (word boundary match)', () => {
    expect(CHARACTER_DETAIL_COLS).toMatch(/\bspecies\b/);
  });

  it('does not contain race (word boundary match)', () => {
    expect(CHARACTER_DETAIL_COLS).not.toMatch(/\brace\b/);
  });
});
