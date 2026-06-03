import { CAMPAIGN_DETAIL_COLS, CHARACTER_DETAIL_COLS, CHARACTER_SUMMARY_COLS } from '@/lib/query-columns';

describe('CAMPAIGN_DETAIL_COLS', () => {
  it('contains allowed_source_books so the campaign detail loads source book settings (word boundary match)', () => {
    expect(CAMPAIGN_DETAIL_COLS).toMatch(/\ballowed_source_books\b/);
  });
});

describe('CHARACTER_SUMMARY_COLS', () => {
  it('contains species (word boundary match)', () => {
    expect(CHARACTER_SUMMARY_COLS).toMatch(/\bspecies\b/);
  });

  it('does not contain race (word boundary match)', () => {
    expect(CHARACTER_SUMMARY_COLS).not.toMatch(/\brace\b/);
  });

  it('contains portrait_url for list thumbnails (word boundary match)', () => {
    expect(CHARACTER_SUMMARY_COLS).toMatch(/\bportrait_url\b/);
  });
});

describe('CHARACTER_DETAIL_COLS', () => {
  it('contains species (word boundary match)', () => {
    expect(CHARACTER_DETAIL_COLS).toMatch(/\bspecies\b/);
  });

  it('does not contain race (word boundary match)', () => {
    expect(CHARACTER_DETAIL_COLS).not.toMatch(/\brace\b/);
  });

  it('contains conditions so the sheet loads persisted conditions (word boundary match)', () => {
    expect(CHARACTER_DETAIL_COLS).toMatch(/\bconditions\b/);
  });

  it('contains hit_dice_used so the sheet loads hit dice tracking (word boundary match)', () => {
    expect(CHARACTER_DETAIL_COLS).toMatch(/\bhit_dice_used\b/);
  });

  it('contains spell_slots_used so the sheet loads spell slot tracking (word boundary match)', () => {
    expect(CHARACTER_DETAIL_COLS).toMatch(/\bspell_slots_used\b/);
  });
});
