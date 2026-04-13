/** Formats a number with an explicit sign prefix (+3 or -1). */
export function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`
}
