import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AsiAllocator } from '@/components/character-sheet/AsiAllocator';
import { ExpertiseChoicePicker } from '@/components/character-sheet/ExpertiseChoicePicker';
import { FightingStylePicker } from '@/components/character-sheet/FightingStylePicker';
import { DamageTypePicker } from '@/components/character-sheet/DamageTypePicker';
import { SubclassPicker } from '@/components/character-sheet/SubclassPicker';
import { ChoicePicker } from '@/components/character-builder/ChoicePicker';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { collectGrantsByType } from '@/lib/resolver/helpers';
import { mapNonEmpty } from '@/lib/non-empty';
import { WEAPON_CATALOG } from '@/lib/sources/items';
import type { PendingChoice, ResolvedCharacter } from '@/types/resolved';
import type { ChoiceDecision, ChoiceKey } from '@/types/choices';
import type { FightingStyleId } from '@/lib/dnd-helpers';
import { useTranslation } from 'react-i18next';

/**
 * Synthesize PendingChoice shapes from all choice-producing grants,
 * so pickers stay visible even after a decision is made (as long as the
 * overall panel is rendered because other grants remain unresolved).
 */
function useAllChoiceGrants() {
  const { bundles, build, resolved } = useCharacterContext();
  const buildChoices = build?.choices;
  const resolvedWeaponProficiencies = resolved?.weaponProficiencies;

  return useMemo(() => {
    const choices = buildChoices ?? {};
    const allGrants: PendingChoice[] = [];

    // bundle-choice grants
    for (const { grant, source } of collectGrantsByType(bundles, 'bundle-choice')) {
      allGrants.push({
        type: 'bundle-choice',
        choiceKey: grant.key,
        source,
        category: grant.category,
        bundleIds: grant.bundleIds,
      });
    }

    // fighting-style-choice grants — compute alreadyChosen from all valid decisions
    const fightingStyleGrants = collectGrantsByType(bundles, 'fighting-style-choice');
    const allChosenStyles: FightingStyleId[] = [];
    for (const { grant } of fightingStyleGrants) {
      const decision = choices[grant.key];
      if (decision?.type === 'fighting-style-choice') {
        const validStyles = decision.styles.filter((s): s is FightingStyleId =>
          grant.from.includes(s as FightingStyleId)
        );
        allChosenStyles.push(...validStyles);
      }
    }
    for (const { grant, source } of fightingStyleGrants) {
      allGrants.push({
        type: 'fighting-style-choice',
        choiceKey: grant.key,
        source,
        count: grant.count,
        from: grant.from,
        alreadyChosen: allChosenStyles,
      });
    }

    // weapon-mastery-choice grants — eligibility and dedup mirror the resolver
    const weaponMasteryGrants = collectGrantsByType(bundles, 'weapon-mastery-choice');
    if (weaponMasteryGrants.length > 0) {
      const weaponProfSet = new Set<string>(resolvedWeaponProficiencies?.map((p) => p.value) ?? []);
      const eligibleMasteryWeapons = WEAPON_CATALOG.filter(
        (w) => w.mastery !== undefined && (weaponProfSet.has(w.category) || weaponProfSet.has(w.weaponProficiencyId))
      ).map((w) => w.id);

      const claimed = new Set<string>();
      for (const { grant, source } of weaponMasteryGrants) {
        const decision = choices[grant.key];
        const rawIds = decision?.type === 'weapon-mastery-choice' ? decision.weaponIds : [];
        const seenInDecision = new Set<string>();
        const validWeaponIds: string[] = [];
        for (const id of rawIds) {
          if (seenInDecision.has(id)) continue;
          seenInDecision.add(id);
          if (!eligibleMasteryWeapons.includes(id)) continue;
          if (claimed.has(id)) continue;
          validWeaponIds.push(id);
        }
        const alreadyChosenByOthers = Array.from(claimed);
        allGrants.push({
          type: 'weapon-mastery-choice',
          choiceKey: grant.key,
          source,
          count: grant.count,
          from: eligibleMasteryWeapons,
          alreadyChosen: alreadyChosenByOthers,
        });
        for (const id of validWeaponIds) claimed.add(id);
      }
    }

    // damage-choice grants
    for (const { grant, source } of collectGrantsByType(bundles, 'damage-choice')) {
      allGrants.push({
        type: 'damage-choice',
        choiceKey: grant.key,
        source,
        count: grant.count,
        from: grant.from,
        featureIdPrefix: grant.featureIdPrefix,
      });
    }

    // subclass grants
    for (const { grant, source } of collectGrantsByType(bundles, 'subclass')) {
      allGrants.push({
        type: 'subclass',
        choiceKey: grant.key,
        source,
        classId: grant.classId,
      });
    }

    // ASI grants
    for (const { grant, source } of collectGrantsByType(bundles, 'asi')) {
      allGrants.push({
        type: 'asi',
        choiceKey: grant.key,
        source,
        points: grant.points,
        from: grant.from,
      });
    }

    // ability-choice grants
    for (const { grant, source } of collectGrantsByType(bundles, 'ability-choice')) {
      allGrants.push({
        type: 'ability-choice',
        choiceKey: grant.key,
        source,
        count: grant.count,
        bonus: grant.bonus,
        from: grant.from,
      });
    }

    // proficiency-choice grants → skill-choice, tool-choice, language-choice
    for (const { grant, source } of collectGrantsByType(bundles, 'proficiency-choice')) {
      if (grant.category === 'skill') {
        allGrants.push({
          type: 'skill-choice',
          choiceKey: grant.key,
          source,
          category: 'skill',
          count: grant.count,
          from: grant.from,
        });
      } else if (grant.category === 'tool') {
        allGrants.push({
          type: 'tool-choice',
          choiceKey: grant.key,
          source,
          category: 'tool',
          count: grant.count,
          from: grant.from,
        });
      } else if (grant.category === 'language') {
        allGrants.push({
          type: 'language-choice',
          choiceKey: grant.key,
          source,
          count: grant.count,
          from: grant.from,
        });
      }
    }

    // expertise-choice grants
    for (const { grant, source } of collectGrantsByType(bundles, 'expertise-choice')) {
      allGrants.push({
        type: 'expertise-choice',
        choiceKey: grant.key,
        source,
        count: grant.count,
        from: grant.from,
        fromTools: grant.fromTools,
      });
    }

    // lineage-choice grants
    for (const { grant, source } of collectGrantsByType(bundles, 'lineage-choice')) {
      allGrants.push({
        type: 'lineage-choice',
        choiceKey: grant.key,
        source,
        speciesId: grant.speciesId,
        from: grant.from,
      });
    }

    // feature-choice grants
    for (const { grant, source } of collectGrantsByType(bundles, 'feature-choice')) {
      allGrants.push({
        type: 'feature-choice',
        choiceKey: grant.key,
        source,
        options: mapNonEmpty(grant.options, (o) => ({ optionId: o.optionId, featureId: o.featureId })),
      });
    }

    return allGrants;
  }, [bundles, buildChoices, resolvedWeaponProficiencies]);
}

function PendingChoiceRow({
  choice,
  currentDecision,
  onDecide,
  onClear,
}: {
  choice: PendingChoice;
  currentDecision: ChoiceDecision | undefined;
  onDecide: (key: ChoiceKey, decision: ChoiceDecision) => void;
  onClear: (key: ChoiceKey) => void;
}) {
  const { resolved, build, bundles } = useCharacterContext();
  const { t: tc } = useTranslation('common');

  if (choice.type === 'subclass') {
    return (
      <SubclassPicker
        choice={choice}
        currentDecision={currentDecision}
        onDecide={(choiceKey, subclassId) => onDecide(choiceKey, { type: 'subclass', subclassId })}
        onClear={onClear}
      />
    );
  }

  if (choice.type === 'fighting-style-choice') {
    return (
      <FightingStylePicker choice={choice} currentDecision={currentDecision} onDecide={onDecide} onClear={onClear} />
    );
  }

  if (choice.type === 'damage-choice') {
    return <DamageTypePicker choice={choice} currentDecision={currentDecision} onDecide={onDecide} onClear={onClear} />;
  }

  if (choice.type === 'asi') {
    if (!resolved) {
      return (
        <Card className="opacity-60">
          <CardContent className="p-4 space-y-1">
            <p className="text-sm text-muted-foreground">{tc('characterSheet.asi.asiTitle')}</p>
            <p className="text-xs text-destructive">{tc('characterSheet.levelUp.abilitiesUnavailable')}</p>
          </CardContent>
        </Card>
      );
    }
    return (
      <AsiAllocator
        choice={choice}
        abilities={resolved.abilities}
        currentDecision={currentDecision}
        onDecide={(choiceKey, allocation) => onDecide(choiceKey, { type: 'asi', allocation })}
        onClear={onClear}
      />
    );
  }

  if (choice.type === 'expertise-choice') {
    // Collect all expertise-choice keys so the picker can dedupe across grants
    // (e.g. rogue L1 + L6 both active simultaneously after a schema migration)
    const allExpertiseChoiceKeys = collectGrantsByType(bundles, 'expertise-choice').map(({ grant }) => grant.key);
    return (
      <ExpertiseChoicePicker
        choice={choice}
        currentDecision={currentDecision}
        allDecisions={build?.choices ?? {}}
        allExpertiseChoiceKeys={allExpertiseChoiceKeys}
        resolvedSkills={resolved?.skills ?? ({} as ResolvedCharacter['skills'])}
        onDecide={onDecide}
        onClear={onClear}
      />
    );
  }

  return <ChoicePicker choice={choice} currentDecision={currentDecision} onDecide={onDecide} onClear={onClear} />;
}

export function PendingChoicesPanel() {
  const { t } = useTranslation('common');
  const { resolved, build, makeChoice, clearChoice } = useCharacterContext();

  // Drive the picker list from grants so resolved pickers stay mounted
  const allChoiceGrants = useAllChoiceGrants();

  const pendingChoices = resolved?.pendingChoices ?? [];
  const choices = build?.choices ?? {};

  // Panel is only visible when there are unresolved choices
  if (pendingChoices.length === 0) return null;

  const handleDecide = (key: ChoiceKey, decision: ChoiceDecision) => {
    makeChoice(key, decision);
  };

  const handleClear = (key: ChoiceKey) => {
    clearChoice(key);
  };

  return (
    <Card className="border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader>
        <CardTitle className="text-amber-700 dark:text-amber-400">
          {t('characterBuilder.pendingChoices.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('characterSheet.pendingChoices.description', { count: pendingChoices.length })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {allChoiceGrants.map((choice) => {
          const currentDecision = choices[choice.choiceKey];
          // Include a hash of the decision in the key so pickers with local state
          // (AsiAllocator, FightingStylePicker, SubclassPicker) remount when the
          // decision is cleared or changed externally.
          const decisionHash = currentDecision ? JSON.stringify(currentDecision) : 'none';
          return (
            <PendingChoiceRow
              key={`${choice.choiceKey}::${decisionHash}`}
              choice={choice}
              currentDecision={currentDecision}
              onDecide={handleDecide}
              onClear={handleClear}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
