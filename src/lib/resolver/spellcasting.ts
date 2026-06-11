import type { GrantBundle } from '@/types/sources';
import type { AbilityKey, ClassId } from '@/lib/dnd-helpers';
import type { ChoiceKey, ChoiceDecision } from '@/types/choices';
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
  level: number,
  // choices is accepted for future use; cantripsKnown/spellsKnown are computed from spell-choice grants
  _choices?: Readonly<Record<ChoiceKey, ChoiceDecision>>
): ResolvedSpellcasting | null {
  const spellcastingGrants = collectGrantsByType(bundles, 'spellcasting');
  const spellGrants = collectGrantsByType(bundles, 'spell');
  const spellChoiceGrants = collectGrantsByType(bundles, 'spell-choice');

  if (spellcastingGrants.length === 0 && spellGrants.length === 0 && spellChoiceGrants.length === 0) return null;

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
  const knownSpells: { spellId: string; spellLevel: number }[] = [];
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
        knownSpells.push({ spellId: grant.spellId, spellLevel: 0 });
      } else if (def.level === 0) {
        cantrips.push(grant.spellId);
      } else {
        knownSpells.push({ spellId: grant.spellId, spellLevel: def.level });
      }
    }
  }

  // Aggregate cantrip and leveled-spell counts from spell-choice grants.
  // These represent the number of slots the character has to fill (via choices) —
  // not the choices themselves (those are expanded into spell grants by collectBundles).
  let cantripsKnown = 0;
  const spellsKnownMap = new Map<number, number>();
  for (const { grant } of spellChoiceGrants) {
    if (grant.spellLevel === 0) {
      cantripsKnown += grant.count;
    } else {
      spellsKnownMap.set(grant.spellLevel, (spellsKnownMap.get(grant.spellLevel) ?? 0) + grant.count);
    }
  }
  const spellsKnown = Array.from(spellsKnownMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([lvl, count]) => ({ level: lvl, count }));

  // TODO(#93): multiclass spell-slot tables not yet implemented; uses character level as class level.
  const isWarlock = classId === 'warlock';
  const pactMagic = isWarlock ? getPactMagicSlots(level) : null;
  const slots = isWarlock ? [] : classId ? getSpellSlots(classId, level) : [];
  const preparedCount = classId ? getPreparedSpellCount(classId, level, abilityMod) : 0;

  return {
    ability,
    spellSaveDC,
    spellAttackBonus,
    cantrips,
    cantripsKnown,
    knownSpells,
    spellsKnown,
    alwaysPreparedSpells,
    slots,
    preparedCount,
    pactMagic,
  };
}
