import type { GrantBundle } from '@/types/sources';
import type { AbilityKey, ClassId } from '@/lib/dnd-helpers';
import type { ResolvedAbility, ResolvedSpellcasting } from '@/types/resolved';
import { getPactMagicSlots, getPreparedSpellCount, getSpellSlots } from '@/lib/dnd-helpers';
import { collectGrantsByType } from '@/lib/resolver/helpers';
import { getSpellDef } from '@/lib/sources/spells';
import { getLogger } from '@/lib/logger';

const logger = getLogger('resolver');

export function resolveSpellcasting(
  bundles: readonly GrantBundle[],
  abilities: Readonly<Record<AbilityKey, ResolvedAbility>>,
  proficiencyBonus: number,
  level: number
): ResolvedSpellcasting | null {
  const spellcastingGrants = collectGrantsByType(bundles, 'spellcasting');
  const spellGrants = collectGrantsByType(bundles, 'spell');

  if (spellcastingGrants.length === 0 && spellGrants.length === 0) return null;

  let ability: AbilityKey | null = null;
  let spellSaveDC: number | null = null;
  let spellAttackBonus: number | null = null;
  let classId: ClassId | null = null;
  let abilityMod = 0;

  if (spellcastingGrants.length > 0) {
    const primary = spellcastingGrants.find((g) => g.grant.source === 'class') ?? spellcastingGrants[0];
    ability = primary.grant.ability;
    abilityMod = abilities[ability].modifier;
    spellSaveDC = 8 + proficiencyBonus + abilityMod;
    spellAttackBonus = proficiencyBonus + abilityMod;
    classId = primary.source.origin === 'class' ? primary.source.id : null;
  }

  const cantrips: string[] = [];
  const knownSpells: string[] = [];
  const alwaysPreparedSpells: string[] = [];
  for (const { grant } of spellGrants) {
    if (grant.alwaysPrepared) {
      if (!getSpellDef(grant.spellId)) {
        logger.warn(`always-prepared spell grant references uncatalogued spell "${grant.spellId}"`);
      }
      alwaysPreparedSpells.push(grant.spellId);
    } else {
      const def = getSpellDef(grant.spellId);
      if (!def) {
        logger.warn(`spell grant references uncatalogued spell "${grant.spellId}"`);
        knownSpells.push(grant.spellId);
      } else if (def.level === 0) {
        cantrips.push(grant.spellId);
      } else {
        knownSpells.push(grant.spellId);
      }
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
