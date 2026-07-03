import { useMemo } from 'react';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { collectGrantsByType } from '@/lib/resolver/helpers';
import { mapNonEmpty } from '@/lib/non-empty';
import { WEAPON_CATALOG } from '@/lib/sources/items';
import { createChoiceKey, parseChoiceKey } from '@/types/choices';
import type { ChoiceDecision, ChoiceKey } from '@/types/choices';
import type { PendingChoice } from '@/types/resolved';
import type { Grant } from '@/types/grants';
import type { SourceTag } from '@/types/sources';
import type { FightingStyleId } from '@/lib/dnd-helpers';
import { getLogger } from '@/lib/logger';

const logger = getLogger('use-all-choice-grants');

/**
 * Context passed to `collectChoiceGrantsFromGrants` to enable cross-bundle
 * dedup (fighting-style, weapon-mastery) and either-or ASI↔feat-choice suppression.
 */
export interface CollectChoiceGrantsContext {
  /** All choices made so far — used for suppression logic. */
  readonly choices?: Readonly<Record<ChoiceKey, ChoiceDecision>>;
  /** Resolved weapon proficiencies — used to compute eligible mastery weapons. */
  readonly resolvedWeaponProficiencies?: readonly { readonly value: string }[];
  /** Set of weapon ids already claimed by earlier grants — maintained across bundle calls. */
  readonly alreadyClaimedMasteries?: Set<string>;
  /** All fighting styles already chosen across all grants — maintained across bundle calls. */
  readonly allChosenStyles?: FightingStyleId[];
}

/**
 * Returns the companion feat-choice key for a given ASI key (or vice versa).
 * Two grants are companions when they share the same origin, id, and index —
 * only the category differs ('asi' vs 'feat-choice').
 */
function buildCompanionKey(key: ChoiceKey, from: 'asi' | 'feat-choice'): ChoiceKey {
  const parsed = parseChoiceKey(key);
  return createChoiceKey(from, parsed.origin, parsed.id, parsed.index);
}

/**
 * Returns true if a feat-choice decision is "valid" (i.e. a feat was selected).
 */
function isSatisfiedFeatDecision(decision: ChoiceDecision | undefined): boolean {
  return decision?.type === 'feat-choice' && decision.featId.length > 0;
}

/**
 * Returns true if an ASI decision is "valid" (i.e. points were allocated).
 */
function isSatisfiedAsiDecision(decision: ChoiceDecision | undefined): boolean {
  if (decision?.type !== 'asi') return false;
  return Object.values(decision.allocation).reduce((sum, v) => sum + (v ?? 0), 0) > 0;
}

/**
 * Pure function: collects PendingChoice shapes from the given grants array for
 * the types that produce choices. Handles all 16 PendingChoice types.
 *
 * @param grants - The grants to scan (from a single GrantBundle).
 * @param source - The source tag for those grants.
 * @param context - Optional cross-bundle context for dedup and either-or suppression.
 */
export function collectChoiceGrantsFromGrants(
  grants: readonly Grant[],
  source: SourceTag,
  context: CollectChoiceGrantsContext = {}
): PendingChoice[] {
  const { choices = {}, resolvedWeaponProficiencies, alreadyClaimedMasteries, allChosenStyles = [] } = context;
  const result: PendingChoice[] = [];

  for (const grant of grants) {
    switch (grant.type) {
      case 'bundle-choice':
        result.push({
          type: 'bundle-choice',
          choiceKey: grant.key,
          source,
          category: grant.category,
          bundleIds: grant.bundleIds,
        });
        break;

      case 'fighting-style-choice': {
        result.push({
          type: 'fighting-style-choice',
          choiceKey: grant.key,
          source,
          count: grant.count,
          from: grant.from,
          alreadyChosen: [...allChosenStyles],
        });
        break;
      }

      case 'weapon-mastery-choice': {
        if (alreadyClaimedMasteries !== undefined) {
          const weaponProfSet = new Set<string>(resolvedWeaponProficiencies?.map((p) => p.value) ?? []);
          const eligibleMasteryWeapons = WEAPON_CATALOG.filter(
            (w) =>
              w.mastery !== undefined && (weaponProfSet.has(w.category) || weaponProfSet.has(w.weaponProficiencyId))
          ).map((w) => w.id);

          const decision = choices[grant.key];
          const rawIds = decision?.type === 'weapon-mastery-choice' ? decision.weaponIds : [];
          const seenInDecision = new Set<string>();
          const validWeaponIds: string[] = [];
          for (const id of rawIds) {
            if (seenInDecision.has(id)) continue;
            seenInDecision.add(id);
            if (!eligibleMasteryWeapons.includes(id)) continue;
            if (alreadyClaimedMasteries.has(id)) continue;
            validWeaponIds.push(id);
          }
          const alreadyChosenByOthers = Array.from(alreadyClaimedMasteries);
          result.push({
            type: 'weapon-mastery-choice',
            choiceKey: grant.key,
            source,
            count: grant.count,
            from: eligibleMasteryWeapons,
            alreadyChosen: alreadyChosenByOthers,
          });
          for (const id of validWeaponIds) alreadyClaimedMasteries.add(id);
        } else {
          logger.warn(
            'collectChoiceGrantsFromGrants: weapon-mastery-choice grant skipped — alreadyClaimedMasteries context not provided'
          );
        }
        break;
      }

      case 'damage-choice':
        result.push({
          type: 'damage-choice',
          choiceKey: grant.key,
          source,
          count: grant.count,
          from: grant.from,
          featureIdPrefix: grant.featureIdPrefix,
        });
        break;

      case 'subclass':
        result.push({
          type: 'subclass',
          choiceKey: grant.key,
          source,
          classId: grant.classId,
        });
        break;

      case 'asi': {
        // Either-or suppression: if the companion feat-choice is satisfied, skip ASI
        const companionFeatKey = buildCompanionKey(grant.key, 'feat-choice');
        if (isSatisfiedFeatDecision(choices[companionFeatKey])) break;
        result.push({
          type: 'asi',
          choiceKey: grant.key,
          source,
          points: grant.points,
          from: grant.from,
        });
        break;
      }

      case 'feat-choice': {
        // Either-or suppression: if the companion ASI is satisfied, skip feat-choice
        const companionAsiKey = buildCompanionKey(grant.key, 'asi');
        if (isSatisfiedAsiDecision(choices[companionAsiKey])) break;
        result.push({
          type: 'feat-choice',
          choiceKey: grant.key,
          source,
          from: grant.from,
          category: grant.category,
        });
        break;
      }

      case 'ability-choice':
        result.push({
          type: 'ability-choice',
          choiceKey: grant.key,
          source,
          count: grant.count,
          bonus: grant.bonus,
          from: grant.from,
        });
        break;

      case 'proficiency-choice': {
        if (grant.category === 'skill') {
          result.push({
            type: 'skill-choice',
            choiceKey: grant.key,
            source,
            category: 'skill',
            count: grant.count,
            from: grant.from,
          });
        } else if (grant.category === 'tool') {
          result.push({
            type: 'tool-choice',
            choiceKey: grant.key,
            source,
            category: 'tool',
            count: grant.count,
            from: grant.from,
          });
        } else if (grant.category === 'language') {
          result.push({
            type: 'language-choice',
            choiceKey: grant.key,
            source,
            count: grant.count,
            from: grant.from,
          });
        } else if (grant.category === 'saving-throw') {
          result.push({
            type: 'saving-throw-choice',
            choiceKey: grant.key,
            source,
            category: 'saving-throw',
            count: grant.count,
            from: grant.from,
          });
        } else {
          logger.warn(
            `collectChoiceGrantsFromGrants: unhandled proficiency-choice category "${grant.category}" — no PendingChoice emitted`
          );
        }
        break;
      }

      case 'expertise-choice':
        result.push({
          type: 'expertise-choice',
          choiceKey: grant.key,
          source,
          count: grant.count,
          from: grant.from,
          fromTools: grant.fromTools,
        });
        break;

      case 'lineage-choice':
        result.push({
          type: 'lineage-choice',
          choiceKey: grant.key,
          source,
          speciesId: grant.speciesId,
          from: grant.from,
        });
        break;

      case 'feature-choice':
        result.push({
          type: 'feature-choice',
          choiceKey: grant.key,
          source,
          options: mapNonEmpty(grant.options, (o) => ({ optionId: o.optionId, featureId: o.featureId })),
        });
        break;

      case 'spell-choice':
        result.push({
          type: 'spell-choice',
          choiceKey: grant.key,
          source,
          count: grant.count,
          spellList: grant.spellList,
          spellLevel: grant.spellLevel,
        });
        break;

      // Non-choice grants — no pending choice emitted
      default:
        break;
    }
  }

  return result;
}

/**
 * React hook: synthesizes PendingChoice shapes from ALL choice-producing grants
 * across all bundles, so pickers stay visible even after a decision is made
 * (as long as the panel is rendered because other grants remain unresolved).
 *
 * Cross-bundle state (fighting-style/weapon-mastery dedup, either-or ASI↔feat-choice
 * suppression) is maintained via shared mutable context objects passed across
 * the per-bundle calls.
 */
export function useAllChoiceGrants(): PendingChoice[] {
  const { bundles, build, resolved } = useCharacterContext();
  const buildChoices = build?.choices;
  const resolvedWeaponProficiencies = resolved?.weaponProficiencies;

  return useMemo(() => {
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = buildChoices ?? {};
    const allChoiceGrants: PendingChoice[] = [];

    // Shared mutable context for cross-bundle dedup
    const allChosenStyles: FightingStyleId[] = [];
    const alreadyClaimedMasteries = new Set<string>();

    // Pre-compute allChosenStyles across ALL fighting-style-choice grants first
    // (mirrors the resolver's two-pass approach for fighting styles)
    for (const { grant } of collectGrantsByType(bundles, 'fighting-style-choice')) {
      const decision = choices[grant.key];
      if (decision?.type === 'fighting-style-choice') {
        const validStyles = decision.styles.filter((s): s is FightingStyleId =>
          grant.from.includes(s as FightingStyleId)
        );
        allChosenStyles.push(...validStyles);
      }
    }

    // Collect choices per bundle in order
    for (const bundle of bundles) {
      const context: CollectChoiceGrantsContext = {
        choices,
        resolvedWeaponProficiencies,
        alreadyClaimedMasteries,
        allChosenStyles,
      };
      // Skip weapon-mastery grants when mastery dedup context is not set up yet.
      // The weapon mastery block above is only enabled when we pass alreadyClaimedMasteries.
      // When there are no weapon-mastery grants at all, the Set stays empty and context passes through fine.
      allChoiceGrants.push(...collectChoiceGrantsFromGrants(bundle.grants, bundle.source, context));
    }

    return allChoiceGrants;
  }, [bundles, buildChoices, resolvedWeaponProficiencies]);
}
