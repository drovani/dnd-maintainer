import { getProficiencyBonus } from '@/lib/dnd-helpers';
import type { ToolProficiencyId, SkillId } from '@/lib/dnd-helpers';
import { getLogger } from '@/lib/logger';

const logger = getLogger('resolver');
import type { FightingStyleId } from '@/lib/dnd-helpers';
import type { AbilityScores } from '@/types/database';
import type { GrantBundle, SourceTag } from '@/types/sources';
import type { ChoiceKey, ChoiceDecision } from '@/types/choices';
import type { ResolvedCharacter, PendingChoice, ResolvedSkill } from '@/types/resolved';
import type { HitDie, ExpertiseChoiceGrant } from '@/types/grants';
import { collectGrantsByType } from '@/lib/resolver/helpers';
import { resolveAbilities } from '@/lib/resolver/abilities';
import { resolveSavingThrows, resolveSkills, resolveProficiencies } from '@/lib/resolver/proficiencies';
import { resolveFeatures } from '@/lib/resolver/features';
import { resolveHp, resolveSpeed, resolveAc } from '@/lib/resolver/combat';
import { resolveSpellcasting } from '@/lib/resolver/spellcasting';
import { resolveEquipment, resolveAttacks, resolveEquippedArmorAc } from '@/lib/resolver/equipment';
import { getItemDef } from '@/lib/sources/items';

export interface PersistedItem {
  readonly itemId: string;
  readonly quantity: number;
  readonly equipped: boolean;
  readonly source: SourceTag;
}

export interface ResolverInput {
  readonly baseAbilities: AbilityScores;
  readonly level: number;
  readonly bundles: readonly GrantBundle[];
  readonly choices: Readonly<Record<ChoiceKey, ChoiceDecision>>;
  readonly hpRolls?: readonly (number | null)[];
  readonly levels?: readonly { readonly hpRoll: number | null }[];
  readonly equippedItemIds?: readonly string[];
  readonly persistedItems?: readonly PersistedItem[];
  readonly useDBInventory?: boolean;
}

function isValidExpertiseSkillPick(
  skillId: SkillId,
  grant: ExpertiseChoiceGrant,
  resolvedSkills: Readonly<Record<SkillId, ResolvedSkill>>
): boolean {
  if (!resolvedSkills[skillId]?.proficient) return false;
  if (grant.from === null) return true;
  return grant.from.includes(skillId);
}

export function resolveCharacter(input: ResolverInput): ResolvedCharacter {
  const { baseAbilities, level, bundles, choices } = input;
  const hpRolls = input.hpRolls ?? input.levels?.map((l) => l.hpRoll) ?? [];
  const equippedItemIds = input.equippedItemIds ?? [];

  const proficiencyBonus = getProficiencyBonus(level);
  const abilities = resolveAbilities(baseAbilities, bundles, choices);
  const conModifier = abilities.con.modifier;
  const dexModifier = abilities.dex.modifier;

  const savingThrows = resolveSavingThrows(abilities, bundles, proficiencyBonus);
  const skills = resolveSkills(abilities, bundles, proficiencyBonus, choices);
  const proficiencies = resolveProficiencies(bundles, choices);
  const features = resolveFeatures(bundles);
  const hitPoints = resolveHp(bundles, hpRolls, conModifier, level);
  const speed = resolveSpeed(bundles);
  const spellcasting = resolveSpellcasting(bundles);

  // Equipment resolution — finalized characters read from DB inventory directly
  const equipmentResult =
    input.useDBInventory && input.persistedItems
      ? resolveEquipmentFromPersisted(input.persistedItems)
      : resolveEquipment(bundles, choices, equippedItemIds);
  const equippedArmorAc = resolveEquippedArmorAc(equipmentResult.items, dexModifier);
  const armorClass = resolveAc(bundles, dexModifier, equippedArmorAc);

  // Extract chosen fighting style IDs for attack resolver, validating against each grant's from list.
  // Stale persisted decisions containing removed style IDs are filtered out and re-prompted.
  const fightingStyleIds: FightingStyleId[] = [];
  for (const { grant } of collectGrantsByType(bundles, 'fighting-style-choice')) {
    const decision = choices[grant.key];
    if (decision?.type === 'fighting-style-choice') {
      const validStyles = decision.styles.filter((s): s is FightingStyleId =>
        grant.from.includes(s as FightingStyleId)
      );
      fightingStyleIds.push(...validStyles);
    }
  }

  const attacks = resolveAttacks(
    equipmentResult.items,
    abilities,
    proficiencyBonus,
    proficiencies.weapon,
    fightingStyleIds
  );

  // Build hitDie array from hit-die grants
  const hitDieGrants = collectGrantsByType(bundles, 'hit-die');
  const hitDieMap = new Map<HitDie, number>();
  for (const { grant } of hitDieGrants) {
    hitDieMap.set(grant.die, (hitDieMap.get(grant.die) ?? 0) + 1);
  }
  const hitDie = Array.from(hitDieMap.entries()).map(([die, count]) => ({ die, count }));

  // Aggregate pending choices
  const pendingChoices: PendingChoice[] = [...proficiencies.pendingChoices, ...equipmentResult.pendingChoices];

  // Unresolved ability-choice grants
  for (const { grant, source } of collectGrantsByType(bundles, 'ability-choice')) {
    const decision = choices[grant.key];
    if (!decision || decision.type !== 'ability-choice') {
      pendingChoices.push({
        type: 'ability-choice',
        choiceKey: grant.key,
        source,
        count: grant.count,
        bonus: grant.bonus,
        from: grant.from,
      });
    }
  }

  // Unresolved skill-choice grants
  for (const { grant, source } of collectGrantsByType(bundles, 'proficiency-choice')) {
    if (grant.category === 'skill') {
      const decision = choices[grant.key];
      if (!decision || decision.type !== 'skill-choice') {
        pendingChoices.push({
          type: 'skill-choice',
          choiceKey: grant.key,
          source,
          category: 'skill',
          count: grant.count,
          from: grant.from,
        });
      }
    }
  }

  // Unresolved or invalid ASI grants
  for (const { grant, source } of collectGrantsByType(bundles, 'asi')) {
    const decision = choices[grant.key];
    const totalAllocated =
      decision?.type === 'asi' ? Object.values(decision.allocation).reduce((sum, v) => sum + (v ?? 0), 0) : 0;
    const isValid = decision?.type === 'asi' && totalAllocated === grant.points;
    if (!isValid) {
      pendingChoices.push({
        type: 'asi',
        choiceKey: grant.key,
        source,
        points: grant.points,
      });
    }
  }

  // Unresolved or invalid fighting-style-choice grants (single pass)
  const allFightingStyleDecisions: FightingStyleId[] = [];
  const fightingStyleGrants = collectGrantsByType(bundles, 'fighting-style-choice');
  // First collect all valid chosen styles for the alreadyChosen list
  for (const { grant } of fightingStyleGrants) {
    const decision = choices[grant.key];
    if (decision?.type === 'fighting-style-choice') {
      const validStyles = decision.styles.filter((s): s is FightingStyleId =>
        grant.from.includes(s as FightingStyleId)
      );
      allFightingStyleDecisions.push(...validStyles);
    }
  }
  // Then emit pending choices for grants that are unresolved or have invalid/missing styles
  for (const { grant, source } of fightingStyleGrants) {
    const decision = choices[grant.key];
    const validStyles =
      decision?.type === 'fighting-style-choice'
        ? decision.styles.filter((s) => grant.from.includes(s as FightingStyleId))
        : [];
    if (!decision || decision.type !== 'fighting-style-choice' || validStyles.length < grant.count) {
      pendingChoices.push({
        type: 'fighting-style-choice',
        choiceKey: grant.key,
        source,
        count: grant.count,
        from: grant.from,
        alreadyChosen: allFightingStyleDecisions,
      });
    }
  }

  // Unresolved subclass grants
  for (const { grant, source } of collectGrantsByType(bundles, 'subclass')) {
    const decision = choices[grant.key];
    if (!decision || decision.type !== 'subclass') {
      pendingChoices.push({
        type: 'subclass',
        choiceKey: grant.key,
        source,
        classId: grant.classId,
      });
    }
  }

  // Unresolved or underfilled expertise-choice grants
  for (const { grant, source } of collectGrantsByType(bundles, 'expertise-choice')) {
    const decision = choices[grant.key];
    const validSkills =
      decision?.type === 'expertise-choice'
        ? decision.skills.filter((s) => isValidExpertiseSkillPick(s, grant, skills))
        : [];
    const validTools =
      decision?.type === 'expertise-choice' ? decision.tools.filter((t) => grant.fromTools.includes(t)) : [];
    if (!decision || decision.type !== 'expertise-choice' || validSkills.length + validTools.length !== grant.count) {
      pendingChoices.push({
        type: 'expertise-choice',
        choiceKey: grant.key,
        source,
        count: grant.count,
        from: grant.from,
        fromTools: grant.fromTools,
      });
    }
  }

  // Collect tool expertise, filtered by fromTools and capped at grant.count so a
  // malformed overfilled decision cannot double the PB on more tools than granted.
  const toolExpertise: ToolProficiencyId[] = [];
  for (const { grant } of collectGrantsByType(bundles, 'expertise-choice')) {
    const decision = choices[grant.key];
    if (decision?.type === 'expertise-choice') {
      const pool = decision.tools.filter((t) => grant.fromTools.includes(t));
      for (const toolId of pool.slice(0, grant.count)) {
        toolExpertise.push(toolId);
      }
    }
  }

  return {
    abilities,
    hitDie,
    hitPoints,
    speed,
    initiative: dexModifier,
    proficiencyBonus,
    armorClass,
    savingThrows,
    skills,
    armorProficiencies: proficiencies.armor,
    weaponProficiencies: proficiencies.weapon,
    toolProficiencies: proficiencies.tool,
    languages: proficiencies.language,
    features,
    resistances: collectGrantsByType(bundles, 'resistance').map(({ grant, source }) => ({
      value: grant.damageType,
      sources: [source],
    })),
    immunities: [],
    spellcasting,
    equipment: equipmentResult.items,
    attacks,
    toolExpertise,
    pendingChoices,
  };
}

/**
 * Builds ResolvedEquipmentItem entries directly from persisted DB rows.
 * Used for finalized characters where inventory is read from character_items
 * rather than derived from grant processing.
 */
function resolveEquipmentFromPersisted(persistedItems: readonly PersistedItem[]): {
  readonly items: readonly import('@/types/resolved').ResolvedEquipmentItem[];
  readonly pendingChoices: readonly import('@/types/resolved').PendingChoice[];
} {
  const items: import('@/types/resolved').ResolvedEquipmentItem[] = [];
  for (const row of persistedItems) {
    const itemDef = getItemDef(row.itemId);
    if (!itemDef) {
      logger.warn(`Skipping unknown persisted item "${row.itemId}" — removed from catalog?`);
      continue;
    }
    items.push({
      itemId: row.itemId,
      itemDef,
      quantity: row.quantity,
      source: row.source,
      equipped: row.equipped,
    });
  }
  return { items, pendingChoices: [] };
}
