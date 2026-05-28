export type NonEmptyArray<T> = readonly [T, ...T[]];

export function mapNonEmpty<A, B>(xs: NonEmptyArray<A>, f: (a: A) => B): NonEmptyArray<B> {
  const [first, ...rest] = xs;
  return [f(first), ...rest.map(f)] as const;
}
