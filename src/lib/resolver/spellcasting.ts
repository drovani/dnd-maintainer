import type { GrantBundle } from '@/types/sources';
import type { AbilityKey } from '@/lib/dnd-helpers';
import type { ResolvedAbility, ResolvedSpellcasting } from '@/types/resolved';
import { getPactMagicSlots, getPreparedSpellCount, getSpellSlots } from '@/lib/dnd-helpers';
import { collectGrantsByType } from '@/lib/resolver/helpers';
import { getSpellDef } from '@/lib/sources/spells';

export function resolveSpellcasting(
  bundles: readonly GrantBundle[],
  abilities: Readonly<Record<AbilityKey, ResolvedAbility>>,
  proficiencyBonus: number,
  level: number
): ResolvedSpellcasting | null {
  const spellcastingGrants = collectGrantsByType(bundles, 'spellcasting');
  if (spellcastingGrants.length === 0) return null;

  const primary = spellcastingGrants.find((g) => g.grant.source === 'class') ?? spellcastingGrants[0];
  const ability = primary.grant.ability;
  const abilityMod = abilities[ability].modifier;
  const spellSaveDC = 8 + proficiencyBonus + abilityMod;
  const spellAttackBonus = proficiencyBonus + abilityMod;

  const classId = primary.source.origin === 'class' ? primary.source.id : null;

  const cantrips: string[] = [];
  const knownSpells: string[] = [];
  const alwaysPreparedSpells: string[] = [];
  for (const { grant } of collectGrantsByType(bundles, 'spell')) {
    if (grant.alwaysPrepared) {
      alwaysPreparedSpells.push(grant.spellId);
    } else if (getSpellDef(grant.spellId)?.level === 0) {
      cantrips.push(grant.spellId);
    } else {
      knownSpells.push(grant.spellId);
    }
  }

  // TODO(#93): multiclass spell-slot tables not yet implemented; uses character level as class level.
  // TODO(#93): bard/sorcerer/warlock known-spell casters and half-caster formula for paladin/ranger
  // are out of scope for this issue; preparedCount returns 0 for those classes.
  const isWarlock = classId === 'warlock';
  const pactMagic = isWarlock ? getPactMagicSlots(level) : null;
  const slots = isWarlock ? [] : classId ? getSpellSlots(classId, level) : [];
  const preparedCount = classId ? getPreparedSpellCount(classId, level, abilityMod) : 0;

  return {
    ability,
    spellSaveDC,
    spellAttackBonus,
    cantrips,
    knownSpells,
    alwaysPreparedSpells,
    slots,
    preparedCount,
    pactMagic,
  };
}
