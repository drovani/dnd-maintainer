import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { type SpeciesId, type ToolProficiencyId } from '@/lib/dnd-helpers';
import { collectGrantsByType } from '@/lib/resolver/helpers';
import { getChoiceSourceName } from '@/lib/character-builder/choice-source-name';
import type { ChoiceDecision } from '@/types/choices';
import type { PendingChoice } from '@/types/resolved';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChoicePicker } from './ChoicePicker';
import { LineagePicker } from './LineagePicker';
import { SPECIES_SOURCES } from '@/lib/sources/species';

export function OriginStep() {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');
  const context = useCharacterContext();
  const { character, bundles, build, resolved } = context;

  const background = character.background ?? '';
  const species = character.species as SpeciesId | undefined;
  const hasResolvedSpecies = !!species && SPECIES_SOURCES.some((s) => s.id === species);

  // Extract background grants (shared filter — avoids repeating the chain)
  const backgroundGrants = bundles.filter((b) => b.source.origin === 'background').flatMap((b) => b.grants);

  // Extract background origin grant info for the badge.
  // PR #177 made acolyte/guide/sage grant Magic Initiate as a direct `feature` grant (not a `feat`
  // grant), so we must check both shapes:
  //   1. `{ type: 'feat', featId }` — the common case (e.g. Alert, Savage Attacker)
  //   2. `{ type: 'feature', feature.id }` where id starts with 'feat-magic-initiate-' — the
  //      direct-feature path used by acolyte/guide/sage after #177
  // The returned object carries a `isDirectFeature` flag so the render picks the right i18n namespace
  // (features.* vs feats.*.name).
  const originFeatInfo: { id: string; isDirectFeature: boolean } | null = (() => {
    const featGrant = backgroundGrants.find((g): g is Extract<typeof g, { type: 'feat' }> => g.type === 'feat');
    if (featGrant) return { id: featGrant.featId, isDirectFeature: false };
    const directFeatureGrant = backgroundGrants.find(
      (g): g is Extract<typeof g, { type: 'feature' }> =>
        g.type === 'feature' && g.feature.id.startsWith('feat-magic-initiate-')
    );
    if (directFeatureGrant) return { id: directFeatureGrant.feature.id, isDirectFeature: true };
    return null;
  })();

  // Pending feat-origin feature-choices (e.g. magic-initiate class picker, elemental-adept, resilient).
  // NOTE: the general-feat ENTRY POINT (a UI to select feats at ASI level) is OUT OF SCOPE for #178.
  // This only renders a picker when such a choice is already pending in the resolved state — e.g.
  // when magic-initiate is in build.feats and the user must still pick a spellcasting class.
  const featFeatureChoices = useMemo<readonly Extract<PendingChoice, { type: 'feature-choice' }>[]>(() => {
    return (resolved?.pendingChoices ?? []).filter(
      (c): c is Extract<PendingChoice, { type: 'feature-choice' }> =>
        c.type === 'feature-choice' && c.source.origin === 'feat'
    );
  }, [resolved]);

  // Synthesize tool-choice and language-choice PendingChoices from background grants
  const backgroundToolChoiceGrants = collectGrantsByType(bundles, 'proficiency-choice').filter(
    (tg) => tg.source.origin === 'background' && tg.grant.category === 'tool'
  );
  const backgroundToolChoices: readonly (PendingChoice & { type: 'tool-choice' })[] = backgroundToolChoiceGrants.map(
    ({ grant, source }) => ({
      type: 'tool-choice' as const,
      choiceKey: grant.key,
      source,
      category: 'tool' as const,
      count: grant.count,
      from: grant.from as readonly ToolProficiencyId[] | null,
    })
  );

  const backgroundName = background
    ? t(`backgrounds.${background}` as `backgrounds.${string}`, { defaultValue: background })
    : null;

  return (
    <div className="space-y-6">
      {/* Species lineage sub-choice (LineagePicker renders null for species without lineages) */}
      {hasResolvedSpecies && (
        <LineagePicker
          race={species}
          bundles={context.bundles}
          build={context.build}
          makeChoice={context.makeChoice}
          clearChoice={context.clearChoice}
        />
      )}

      {!background && (
        <p className="text-sm text-muted-foreground">
          {tc('characterBuilder.backgroundStep.selectBackgroundInBasics')}
        </p>
      )}

      {/* Origin Feat */}
      {background && originFeatInfo && (
        <div className="space-y-2">
          <Label className="text-base font-semibold">{tc('characterBuilder.backgroundStep.originFeatTitle')}</Label>
          <div className="space-y-2 p-3 rounded-md border border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {originFeatInfo.isDirectFeature
                  ? t(`features.${originFeatInfo.id}.name` as `features.${string}.name`, {
                      defaultValue: originFeatInfo.id,
                    })
                  : t(`feats.${originFeatInfo.id}.name` as `feats.${string}.name`, {
                      defaultValue: originFeatInfo.id,
                    })}
              </Badge>
              {backgroundName && (
                <span className="text-xs text-muted-foreground">
                  {tc('characterBuilder.backgroundStep.originFeatGranted', { background: backgroundName })}
                </span>
              )}
            </div>
            <p className="text-sm text-foreground">
              {originFeatInfo.isDirectFeature
                ? t(`features.${originFeatInfo.id}.description` as `features.${string}.description`, {
                    defaultValue: '',
                  })
                : t(`feats.${originFeatInfo.id}.description` as `feats.${string}.description`, {
                    defaultValue: '',
                  })}
            </p>
          </div>
        </div>
      )}

      {/* Tool proficiency choices */}
      {background && backgroundToolChoices.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            {tc('characterBuilder.backgroundStep.toolProficiencyTitle')}
          </Label>
          <div className="space-y-4">
            {backgroundToolChoices.map((choice) => {
              const decision = build?.choices[choice.choiceKey];
              return (
                <ChoicePicker
                  key={choice.choiceKey}
                  choice={choice}
                  currentDecision={decision as ChoiceDecision | undefined}
                  onDecide={(key, d) => context.makeChoice(key, d)}
                  onClear={(key) => context.clearChoice(key)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Feat-origin feature-choices (e.g. magic-initiate spellcasting class, elemental-adept element).
          Renders only when such a choice is pending — i.e. the feat is in build.feats but the user
          has not yet picked an option. The general-feat ENTRY POINT (selecting feats at ASI level)
          is OUT OF SCOPE for #178 and is not rendered here. */}
      {featFeatureChoices.length > 0 && (
        <div className="space-y-4">
          {featFeatureChoices.map((choice) => (
            <div key={choice.choiceKey}>
              <p className="text-xs text-muted-foreground mb-1">
                {tc('characterBuilder.pendingChoices.fromSource', {
                  source: getChoiceSourceName(choice.choiceKey, t),
                })}
              </p>
              <ChoicePicker
                choice={choice}
                currentDecision={build?.choices[choice.choiceKey]}
                onDecide={(choiceKey, decision) => context.makeChoice(choiceKey, decision)}
                onClear={(choiceKey) => context.clearChoice(choiceKey)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
