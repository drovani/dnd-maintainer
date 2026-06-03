export const SOURCE_BOOK_IDS = ['phb-2024'] as const;
export type SourceBookId = (typeof SOURCE_BOOK_IDS)[number];

export interface SourceBookDef {
  readonly id: SourceBookId;
  readonly abbreviation: string;
}

export const SOURCE_BOOKS: readonly SourceBookDef[] = [{ id: 'phb-2024', abbreviation: 'PHB 2024' }] as const;

export function filterBySourceBooks<T extends { readonly sourceBook?: SourceBookId }>(
  items: readonly T[],
  allowed: readonly SourceBookId[]
): readonly T[] {
  return items.filter((item) => allowed.includes(item.sourceBook ?? 'phb-2024'));
}
