import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { type SpeciesId, type ToolProficiencyId } from '@/lib/dnd-helpers';
import { collectGrantsByType } from '@/lib/resolver/helpers';
import type { ChoiceDecision } from '@/types/choices';
import type { PendingChoice } from '@/types/resolved';
import { useTranslation } from 'react-i18next';
import { ChoicePicker } from './ChoicePicker';
import { LineagePicker } from './LineagePicker';
import { SPECIES_SOURCES } from '@/lib/sources/species';

export function OriginStep() {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');
  const context = useCharacterContext();
  const { character, bundles, build } = context;

  const background = character.background ?? '';
  const species = character.species as SpeciesId | undefined;
  const hasResolvedSpecies = !!species && SPECIES_SOURCES.some((s) => s.id === species);

  // Extract background grants (shared filter — avoids repeating the chain)
  const backgroundGrants = bundles.filter((b) => b.source.origin === 'background').flatMap((b) => b.grants);

  // Extract background feat grant
  const backgroundFeatGrant = backgroundGrants.find((g): g is Extract<typeof g, { type: 'feat' }> => g.type === 'feat');

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
      {/* Species lineage sub-choice */}
      {hasResolvedSpecies && (
        <div className="space-y-2">
          <Label>{tc('characterBuilder.fields.species')}</Label>
          <LineagePicker
            race={species}
            bundles={context.bundles}
            build={context.build}
            makeChoice={context.makeChoice}
            clearChoice={context.clearChoice}
          />
        </div>
      )}

      {!background && (
        <p className="text-sm text-muted-foreground">
          {tc('characterBuilder.backgroundStep.selectBackgroundInBasics')}
        </p>
      )}

      {/* Origin Feat */}
      {background && backgroundFeatGrant && (
        <div className="space-y-2">
          <Label className="text-base font-semibold">{tc('characterBuilder.backgroundStep.originFeatTitle')}</Label>
          <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/30">
            <Badge variant="secondary" className="text-sm">
              {t(`feats.${backgroundFeatGrant.featId}.name` as `feats.${string}.name`, {
                defaultValue: backgroundFeatGrant.featId,
              })}
            </Badge>
            {backgroundName && (
              <span className="text-xs text-muted-foreground">
                {tc('characterBuilder.backgroundStep.originFeatGranted', { background: backgroundName })}
              </span>
            )}
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
    </div>
  );
}
