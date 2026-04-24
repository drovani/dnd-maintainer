import { getSpellSlots } from '@/lib/dnd-helpers';
import type { ClassId, AbilityKey } from '@/lib/dnd-helpers';
import type { GrantBundle } from '@/types/sources';
import type { ChoiceKey, ChoiceDecision } from '@/types/choices';
import type { ResolvedAbility, ResolvedSpellcasting } from '@/types/resolved';
import { collectGrantsByType } from '@/lib/resolver/helpers';

export function resolveSpellcasting(
  bundles: readonly GrantBundle[],
  deps: {
    readonly classId: ClassId | null;
    readonly level: number;
    readonly abilities: Readonly<Record<AbilityKey, ResolvedAbility>>;
    readonly proficiencyBonus: number;
    readonly choices: Readonly<Record<ChoiceKey, ChoiceDecision>>;
  }
): ResolvedSpellcasting | null {
  const spellcastingGrants = collectGrantsByType(bundles, 'spellcasting');
  if (spellcastingGrants.length === 0) return null;

  const { grant } = spellcastingGrants[0];
  const ability = grant.ability;
  const abilityMod = deps.abilities[ability].modifier;
  const spellSaveDC = 8 + deps.proficiencyBonus + abilityMod;
  const spellAttackBonus = deps.proficiencyBonus + abilityMod;

  // Cantrips: collect spell-choice decisions for grants with maxLevel === 0
  const spellChoiceGrants = collectGrantsByType(bundles, 'spell-choice');
  const cantripSet = new Set<string>();
  for (const { grant: scGrant } of spellChoiceGrants) {
    if (scGrant.maxLevel !== 0) continue;
    const decision = deps.choices[scGrant.key];
    if (decision?.type === 'spell-choice') {
      for (const spellId of decision.spellIds) {
        cantripSet.add(spellId);
      }
    }
  }
  const cantrips = Array.from(cantripSet);

  // knownSpells: empty for prepared casters (Druid); placeholder for Wizard/Bard later
  const knownSpells: string[] = [];

  // alwaysPreparedSpells: spell grants with alwaysPrepared === true (deduplicated)
  const alwaysPreparedSet = new Set<string>();
  for (const { grant: spellGrant } of collectGrantsByType(bundles, 'spell')) {
    if (spellGrant.alwaysPrepared) {
      alwaysPreparedSet.add(spellGrant.spellId);
    }
  }
  const alwaysPreparedSpells = Array.from(alwaysPreparedSet);

  // Spell slots from class table
  const slots = deps.classId !== null ? getSpellSlots(deps.classId, deps.level) : [];

  return {
    ability,
    spellSaveDC,
    spellAttackBonus,
    cantrips,
    knownSpells,
    alwaysPreparedSpells,
    slots,
  };
}
