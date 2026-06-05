import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { useGameData } from '@/hooks/useGameData';
import { type SpeciesId } from '@/lib/dnd-helpers';
import { collectGrantsByType } from '@/lib/resolver/helpers';
import { getChoiceSourceName } from '@/lib/character-builder/choice-source-name';
import { deriveOriginFeatInfo } from '@/lib/character-builder/origin-feat-info';
import type { PendingChoice } from '@/types/resolved';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { ChoicePicker } from './ChoicePicker';
import { LineagePicker } from './LineagePicker';
import { SPECIES_SOURCES } from '@/lib/sources/species';

export function OriginStep() {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');
  const { campaignSlug } = useParams<{ campaignSlug: string }>();
  const gameData = useGameData(campaignSlug);
  const context = useCharacterContext();
  const { character, bundles, build, resolved } = context;

  const background = character.background ?? '';
  const species = character.species as SpeciesId | undefined;
  const hasResolvedSpecies = !!species && SPECIES_SOURCES.some((s) => s.id === species);

  // Extract background grants (shared filter — avoids repeating the chain)
  const backgroundGrants = bundles.filter((b) => b.source.origin === 'background').flatMap((b) => b.grants);

  // Extract background origin grant info for the badge.
  // deriveOriginFeatInfo handles both shapes (feat grant and direct feat-magic-initiate-* feature),
  // returning { id, namespace } where namespace drives the i18n key prefix.
  const originFeatInfo = deriveOriginFeatInfo(backgroundGrants);

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

  // Species-origin feat-choices (e.g. Human Versatile origin feat picker). Collected from the
  // grant bundles rather than resolved.pendingChoices so the picker STAYS rendered after a feat
  // is chosen — otherwise the selection vanishes and the user can't change a misclick. The
  // ChoicePicker shows the current selection and a Clear button for re-selection.
  const speciesFeatChoices = useMemo<readonly Extract<PendingChoice, { type: 'feat-choice' }>[]>(() => {
    return collectGrantsByType(bundles, 'feat-choice')
      .filter(({ source }) => source.origin === 'species')
      .map(({ grant, source }) => ({
        type: 'feat-choice' as const,
        choiceKey: grant.key,
        source,
        from: grant.from,
        category: grant.category,
      }));
  }, [bundles]);

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

      {/* Species-origin feat-choice picker (e.g. Human Versatile origin feat) */}
      {speciesFeatChoices.length > 0 && (
        <div className="space-y-4">
          {speciesFeatChoices.map((choice) => (
            <div key={choice.choiceKey}>
              <ChoicePicker
                choice={choice}
                currentDecision={build?.choices[choice.choiceKey]}
                onDecide={(choiceKey, decision) => context.makeChoice(choiceKey, decision)}
                onClear={(choiceKey) => context.clearChoice(choiceKey)}
                allowedFeats={gameData.feats}
              />
            </div>
          ))}
        </div>
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
                {originFeatInfo.namespace === 'features'
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
              {originFeatInfo.namespace === 'features'
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

      {/* Tool proficiency choices are owned by the Proficiencies (Details) step to avoid
          duplicating the picker in two places — see ProficienciesStep. */}

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
