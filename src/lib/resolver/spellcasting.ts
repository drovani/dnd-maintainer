import type { GrantBundle } from '@/types/sources'
import type { ResolvedSpellcasting } from '@/types/resolved'

// TODO: Phase 1 stub — spellcasting resolution not yet implemented.
// Fighter (Phase 1) has no spells, so this returns null safely.
// Phase 2 should resolve cantrips, spell slots, and known/prepared spells from class grants.
export function resolveSpellcasting(_bundles: readonly GrantBundle[]): ResolvedSpellcasting | null {
  return null
}
