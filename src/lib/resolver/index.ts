import { getProficiencyBonus } from '@/lib/dnd-helpers';
import type { AbilityKey, ToolProficiencyId, SkillId, FeatId, ClassId } from '@/lib/dnd-helpers';
import { getLogger } from '@/lib/logger';

const logger = getLogger('resolver');
import type { FightingStyleId } from '@/lib/dnd-helpers';
import type { AbilityScores } from '@/types/database';
import type { GrantBundle, SourceTag } from '@/types/sources';
import { createChoiceKey, parseChoiceKey } from '@/types/choices';
import type { ChoiceKey, ChoiceDecision } from '@/types/choices';
import type { ResolvedCharacter, PendingChoice, ResolvedSkill } from '@/types/resolved';
import type { HitDie, ExpertiseChoiceGrant } from '@/types/grants';
import { mapNonEmpty } from '@/lib/non-empty';
import type { WeaponMasteryId, WeaponRange } from '@/types/items';
import { collectGrantsByType, getClassLevel } from '@/lib/resolver/helpers';
import { resolveAbilities } from '@/lib/resolver/abilities';
import { resolveSavingThrows, resolveSkills, resolveProficiencies } from '@/lib/resolver/proficiencies';
import { resolveFeatures } from '@/lib/resolver/features';
import { resolveHp, resolveSpeed, resolveAc, resolveBardicInspiration } from '@/lib/resolver/combat';
import { resolveSpellcasting } from '@/lib/resolver/spellcasting';
import { resolveEquipment, resolveAttacks, resolveEquippedArmorAc } from '@/lib/resolver/equipment';
import { resolveResourcePools } from '@/lib/resolver/resource-pools';
import { getItemDef, WEAPON_CATALOG } from '@/lib/sources/items';
import { getFeatSource } from '@/lib/sources';
import { getSpellsForList } from '@/lib/sources/spells';

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
  readonly expandedFeats?: ReadonlySet<FeatId>;
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
  const expandedFeats = input.expandedFeats ?? new Set<FeatId>();

  const proficiencyBonus = getProficiencyBonus(level);
  const abilities = resolveAbilities(baseAbilities, bundles, choices);
  const conModifier = abilities.con.modifier;
  const dexModifier = abilities.dex.modifier;

  const savingThrows = resolveSavingThrows(abilities, bundles, proficiencyBonus, choices);
  const skills = resolveSkills(abilities, bundles, proficiencyBonus, choices);
  const proficiencies = resolveProficiencies(bundles, choices);
  const features = resolveFeatures(bundles, abilities, proficiencyBonus);
  const hitPoints = resolveHp(bundles, hpRolls, conModifier, level);
  const speed = resolveSpeed(bundles);
  const spellcasting = resolveSpellcasting(bundles, abilities, proficiencyBonus, level);

  // Equipment resolution — finalized characters read from DB inventory directly
  const equipmentResult =
    input.useDBInventory && input.persistedItems
      ? resolveEquipmentFromPersisted(input.persistedItems)
      : resolveEquipment(bundles, choices, equippedItemIds);
  const equippedArmorAc = resolveEquippedArmorAc(equipmentResult.items, dexModifier);
  const bardLevel = getClassLevel(bundles, 'bard' satisfies ClassId);
  const chaModifier = abilities.cha.modifier;
  const bardicInspiration = resolveBardicInspiration(bundles, bardLevel, chaModifier);
  const bardicDieSize = bardicInspiration?.dieSize ?? null;
  const wisModifier = abilities.wis.modifier;
  const armorClass = resolveAc(bundles, dexModifier, equippedArmorAc, bardicDieSize, conModifier, wisModifier);

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

  // Unresolved saving-throw-choice grants (e.g. the conditional Iron Mind INT/CHA branch)
  for (const { grant, source } of collectGrantsByType(bundles, 'proficiency-choice')) {
    if (grant.category === 'saving-throw') {
      const decision = choices[grant.key];
      if (!decision || decision.type !== 'saving-throw-choice') {
        pendingChoices.push({
          type: 'saving-throw-choice',
          choiceKey: grant.key,
          source,
          category: 'saving-throw',
          count: grant.count,
          from: grant.from,
        });
      }
    }
  }

  // Unresolved or invalid ASI grants
  const asiGrants = collectGrantsByType(bundles, 'asi');
  const asiGrantKeys = new Set(asiGrants.map(({ grant }) => grant.key));
  const featChoiceGrantKeys = new Set(collectGrantsByType(bundles, 'feat-choice').map(({ grant }) => grant.key));
  for (const { grant, source } of asiGrants) {
    const decision = choices[grant.key];
    const totalAllocated =
      decision?.type === 'asi' ? Object.values(decision.allocation).reduce((sum, v) => sum + (v ?? 0), 0) : 0;
    const isValid = (() => {
      if (decision?.type !== 'asi') return false;
      if (totalAllocated !== grant.points) return false;
      if (grant.from != null) {
        return Object.entries(decision.allocation).every(
          ([k, v]) => (v ?? 0) === 0 || grant.from!.includes(k as AbilityKey)
        );
      }
      return true;
    })();
    if (!isValid) {
      // Either-or suppression: if the companion feat-choice grant exists AND is satisfied,
      // skip ASI pending. Guard on the grant's presence, not just the choices map — a
      // persisted decision at this key may be stale from before a source data change that
      // removed the companion grant (#302), so a satisfied-looking decision without a live
      // companion grant must never suppress this pending choice.
      const parsed = parseChoiceKey(grant.key);
      const companionFeatKey = createChoiceKey('feat-choice', parsed.origin, parsed.id, parsed.index);
      const companionFeatDecision = choices[companionFeatKey];
      const featSatisfied =
        featChoiceGrantKeys.has(companionFeatKey) &&
        companionFeatDecision?.type === 'feat-choice' &&
        companionFeatDecision.featId.length > 0;
      if (!featSatisfied) {
        pendingChoices.push({
          type: 'asi',
          choiceKey: grant.key,
          source,
          points: grant.points,
          from: grant.from,
        });
      }
    } else {
      // Both-set guard: warn when ASI is valid AND the companion feat-choice is also satisfied —
      // the picker should prevent this state; log it so it surfaces during debugging.
      const parsed = parseChoiceKey(grant.key);
      const companionFeatKey = createChoiceKey('feat-choice', parsed.origin, parsed.id, parsed.index);
      const companionFeatDecision = choices[companionFeatKey];
      const featAlsoSatisfied =
        featChoiceGrantKeys.has(companionFeatKey) &&
        companionFeatDecision?.type === 'feat-choice' &&
        companionFeatDecision.featId.length > 0;
      if (featAlsoSatisfied) {
        logger.warn(
          `BUG: both ASI "${grant.key}" and feat-choice "${companionFeatKey}" are satisfied for the same origin — this should never happen`
        );
      }
    }
  }

  // Diagnostic: any feat grant that reaches the resolver was not expanded by collectBundles — this is a bug
  for (const { grant } of collectGrantsByType(bundles, 'feat')) {
    if (expandedFeats.has(grant.featId)) continue; // expected leftover from expansion pass
    logger.warn(`BUG: unexpanded FeatGrant "${grant.featId}" reached resolver — nested feat grants are not supported`);
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

  // Unresolved or invalid damage-choice grants
  for (const { grant, source } of collectGrantsByType(bundles, 'damage-choice')) {
    const decision = choices[grant.key];
    const validTypes =
      decision?.type === 'damage-choice' ? decision.damageTypes.filter((t) => grant.from.includes(t)) : [];
    if (!decision || decision.type !== 'damage-choice' || validTypes.length < grant.count) {
      pendingChoices.push({
        type: 'damage-choice',
        choiceKey: grant.key,
        source,
        count: grant.count,
        from: grant.from,
        featureIdPrefix: grant.featureIdPrefix,
      });
    }
  }

  // Aggregate weapon mastery choices — eligible weapons are those the character is proficient with that have a mastery
  const weaponProfSet = new Set(proficiencies.weapon.map((p) => p.value));
  const eligibleMasteryDefs = WEAPON_CATALOG.filter(
    (w) => w.mastery !== undefined && (weaponProfSet.has(w.category) || weaponProfSet.has(w.weaponProficiencyId))
  );
  // A grant may restrict eligibility by weapon range (#290: Barbarian is melee-only).
  const eligibleWeaponsForGrant = (range: WeaponRange | undefined): string[] =>
    eligibleMasteryDefs.filter((w) => range === undefined || w.range === range).map((w) => w.id);

  // Emit pending choices for underfilled grants; build resolved weaponMasteries.
  // Iterate grants in stable order (collectGrantsByType preserves bundle/level order from collectBundles).
  // Track claimed weaponIds across grants to detect cross-grant duplicates; also dedupe within each decision.
  const weaponMasteryGrants = collectGrantsByType(bundles, 'weapon-mastery-choice');
  const weaponMasteriesMap = new Map<string, WeaponMasteryId>();
  const claimed = new Set<string>();
  for (const { grant, source } of weaponMasteryGrants) {
    const decision = choices[grant.key];
    const rawIds = decision?.type === 'weapon-mastery-choice' ? decision.weaponIds : [];
    const eligibleMasteryWeapons = eligibleWeaponsForGrant(grant.range);

    // Dedupe within the decision, filter to eligible, exclude already claimed by earlier grants
    const seenInDecision = new Set<string>();
    const validWeaponIds: string[] = [];
    for (const id of rawIds) {
      if (seenInDecision.has(id)) continue;
      seenInDecision.add(id);
      if (!eligibleMasteryWeapons.includes(id)) continue;
      if (claimed.has(id)) continue;
      validWeaponIds.push(id);
    }

    // alreadyChosen reflects ids claimed by *other* grants only (snapshot before adding this grant's selections)
    const alreadyChosenByOthers = Array.from(claimed);

    if (!decision || decision.type !== 'weapon-mastery-choice' || validWeaponIds.length < grant.count) {
      pendingChoices.push({
        type: 'weapon-mastery-choice',
        choiceKey: grant.key,
        source,
        count: grant.count,
        from: eligibleMasteryWeapons,
        alreadyChosen: alreadyChosenByOthers,
      });
    }
    for (const weaponId of validWeaponIds) {
      const weaponDef = WEAPON_CATALOG.find((w) => w.id === weaponId);
      if (weaponDef?.mastery !== undefined) {
        weaponMasteriesMap.set(weaponId, weaponDef.mastery);
      }
      claimed.add(weaponId);
    }
  }
  const weaponMasteries: readonly { readonly weaponId: string; readonly masteryId: WeaponMasteryId }[] = Array.from(
    weaponMasteriesMap.entries()
  ).map(([weaponId, masteryId]) => ({ weaponId, masteryId }));

  // Unresolved feature-choice grants
  for (const { grant, source } of collectGrantsByType(bundles, 'feature-choice')) {
    const decision = choices[grant.key];
    const validOption =
      decision?.type === 'feature-choice' ? grant.options.find((o) => o.optionId === decision.optionId) : undefined;
    if (!validOption) {
      pendingChoices.push({
        type: 'feature-choice',
        choiceKey: grant.key,
        source,
        options: mapNonEmpty(grant.options, (o) => ({ optionId: o.optionId, featureId: o.featureId })),
      });
    }
  }

  // Unresolved lineage-choice grants
  for (const { grant, source } of collectGrantsByType(bundles, 'lineage-choice')) {
    const decision = choices[grant.key];
    if (!decision || decision.type !== 'lineage-choice') {
      pendingChoices.push({
        type: 'lineage-choice',
        choiceKey: grant.key,
        source,
        speciesId: grant.speciesId,
        from: grant.from,
      });
    }
  }

  // Unresolved feat-choice grants (or decided with an unresolvable featId — invalid/corrupted decision)
  for (const { grant, source } of collectGrantsByType(bundles, 'feat-choice')) {
    const decision = choices[grant.key];
    const resolvedFeat = decision?.type === 'feat-choice' ? getFeatSource(decision.featId) : undefined;
    if (!decision || decision.type !== 'feat-choice' || !resolvedFeat) {
      // Either-or suppression: if the companion ASI grant exists AND is satisfied, skip
      // feat-choice pending. Guard on the grant's presence, not just the choices map — a
      // persisted decision at this key may be stale from before a source data change that
      // removed the companion grant (#302), so a satisfied-looking decision without a live
      // companion grant must never suppress this pending choice.
      const parsed = parseChoiceKey(grant.key);
      const companionAsiKey = createChoiceKey('asi', parsed.origin, parsed.id, parsed.index);
      const companionAsiDecision = choices[companionAsiKey];
      const asiSatisfied =
        asiGrantKeys.has(companionAsiKey) &&
        companionAsiDecision?.type === 'asi' &&
        Object.values(companionAsiDecision.allocation).reduce((sum, v) => sum + (v ?? 0), 0) > 0;
      if (!asiSatisfied) {
        pendingChoices.push({
          type: 'feat-choice',
          choiceKey: grant.key,
          source,
          from: grant.from,
          category: grant.category,
        });
      }
    }
  }

  // Unresolved or underfilled spell-choice grants
  for (const { grant, source } of collectGrantsByType(bundles, 'spell-choice')) {
    const decision = choices[grant.key];
    const chosenIds = decision?.type === 'spell-choice' ? decision.spellIds : [];
    const inPool = getSpellsForList(grant.spellList, grant.spellLevel);
    const validDistinct = new Set(chosenIds.filter((id) => inPool.some((s) => s.id === id)));
    if (!decision || decision.type !== 'spell-choice' || validDistinct.size < grant.count) {
      pendingChoices.push({
        type: 'spell-choice',
        choiceKey: grant.key,
        source,
        count: grant.count,
        spellList: grant.spellList,
        spellLevel: grant.spellLevel,
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
    bardicInspiration,
    pendingChoices,
    weaponMasteries,
    resourcePools: resolveResourcePools(bundles),
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
