import { filterBySourceBooks, SOURCE_BOOKS, SOURCE_BOOK_IDS, type SourceBookId } from '@/lib/source-books';

// ---------------------------------------------------------------------------
// SOURCE_BOOKS integrity
// ---------------------------------------------------------------------------
describe('SOURCE_BOOKS integrity', () => {
  it('every SOURCE_BOOKS entry id is in SOURCE_BOOK_IDS', () => {
    for (const book of SOURCE_BOOKS) {
      expect(SOURCE_BOOK_IDS).toContain(book.id);
    }
  });

  it('SOURCE_BOOK_IDS.length equals SOURCE_BOOKS.length', () => {
    expect(SOURCE_BOOK_IDS.length).toBe(SOURCE_BOOKS.length);
  });
});

// ---------------------------------------------------------------------------
// filterBySourceBooks
// ---------------------------------------------------------------------------
describe('filterBySourceBooks', () => {
  it('includes an item whose sourceBook is in the allowed list', () => {
    const items = [{ id: 'a', sourceBook: 'phb-2024' as SourceBookId }];
    expect(filterBySourceBooks(items, ['phb-2024'])).toHaveLength(1);
  });

  it('excludes an item whose sourceBook is not in the allowed list', () => {
    // Cast to SourceBookId to satisfy the generic constraint for testing future values
    const items = [{ id: 'a', sourceBook: 'dmg-2024' as SourceBookId }];
    expect(filterBySourceBooks(items, ['phb-2024'])).toHaveLength(0);
  });

  it('includes an untagged item (no sourceBook field) by defaulting to phb-2024', () => {
    const items: Array<{ sourceBook?: SourceBookId }> = [{}];
    expect(filterBySourceBooks(items, ['phb-2024'])).toHaveLength(1);
  });

  it('returns empty array when allowed list is empty', () => {
    const items: Array<{ sourceBook?: SourceBookId }> = [{ sourceBook: 'phb-2024' }, {}];
    expect(filterBySourceBooks(items, [])).toHaveLength(0);
  });

  it('returns only the allowed items from a mixed list, preserving order', () => {
    const a = { id: 'a', sourceBook: 'phb-2024' as SourceBookId };
    const b = { id: 'b', sourceBook: 'dmg-2024' as SourceBookId };
    const c = { id: 'c' }; // untagged -> defaults to phb-2024
    // Identity (not just length): the right subset survives, in original order.
    expect(filterBySourceBooks([a, b, c], ['phb-2024'])).toEqual([a, c]);
  });

  it('does not crash when allowed contains an unknown id', () => {
    const items = [{ id: 'a', sourceBook: 'phb-2024' as SourceBookId }];
    // unknown id in allowed → the phb-2024 item won't match 'dmg-2024'
    expect(filterBySourceBooks(items, ['dmg-2024' as SourceBookId])).toHaveLength(0);
  });
});
