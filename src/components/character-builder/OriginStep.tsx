import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import {
  DND_BACKGROUNDS,
  type AbilityKey,
  type LanguageId,
  type SpeciesId,
  type ToolProficiencyId,
} from '@/lib/dnd-helpers';
import { collectGrantsByType } from '@/lib/resolver/helpers';
import type { ChoiceDecision, ChoiceKey } from '@/types/choices';
import type { PendingChoice } from '@/types/resolved';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChoicePicker } from './ChoicePicker';
import { LineagePicker } from './LineagePicker';
import { SPECIES_SOURCES } from '@/lib/sources/species';

type AsiMode = '+2/+1' | '+1/+1/+1';

function inferAsiMode(alloc: Partial<Record<AbilityKey, number>>): AsiMode {
  const values = Object.values(alloc).filter((v): v is number => typeof v === 'number' && v > 0);
  if (values.some((v) => v === 2)) return '+2/+1';
  if (values.length === 3 && values.every((v) => v === 1)) return '+1/+1/+1';
  return '+2/+1';
}

export function OriginStep() {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');
  const context = useCharacterContext();
  const { character, bundles, build, resolved } = context;

  const background = character.background ?? '';
  const species = character.species as SpeciesId | undefined;
  const hasResolvedSpecies = !!species && SPECIES_SOURCES.some((s) => s.id === species);

  const handleBackgroundChange = (value: string) => {
    context.updateCharacter({ background: value });
  };

  // Extract background grants (shared filter — avoids repeating the chain)
  const backgroundGrants = bundles.filter((b) => b.source.origin === 'background').flatMap((b) => b.grants);

  // Extract background ASI grant from bundles
  const backgroundAsiGrant = backgroundGrants.find((g): g is Extract<typeof g, { type: 'asi' }> => g.type === 'asi');

  const backgroundAsiChoiceKey = backgroundAsiGrant?.key;
  const backgroundAsiDecision = backgroundAsiChoiceKey ? build?.choices[backgroundAsiChoiceKey] : undefined;
  const backgroundAsiAllocation: Partial<Record<AbilityKey, number>> =
    backgroundAsiDecision?.type === 'asi' ? backgroundAsiDecision.allocation : {};
  const backgroundAsiPointsUsed = Object.values(backgroundAsiAllocation).reduce((s, v) => s + (v ?? 0), 0);

  const [asiMode, setAsiMode] = useState<AsiMode>(() => inferAsiMode(backgroundAsiAllocation));

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

  const backgroundLanguageChoiceGrants = collectGrantsByType(bundles, 'proficiency-choice').filter(
    (tg) => tg.source.origin === 'background' && tg.grant.category === 'language'
  );
  const backgroundLanguageChoices: readonly (PendingChoice & { type: 'language-choice' })[] =
    backgroundLanguageChoiceGrants.map(({ grant, source }) => ({
      type: 'language-choice' as const,
      choiceKey: grant.key,
      source,
      count: grant.count,
      from: grant.from as readonly LanguageId[] | null,
    }));

  // Eligible abilities for ASI (null means all)
  const asiFrom = backgroundAsiGrant?.from ?? null;
  const allAbilityKeys: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const eligibleAbilities: readonly AbilityKey[] = asiFrom ?? allAbilityKeys;

  const canIncrement = (ability: AbilityKey): boolean => {
    if (!backgroundAsiChoiceKey || !backgroundAsiGrant) return false;
    const cur = backgroundAsiAllocation[ability] ?? 0;
    const totalAsiPoints = backgroundAsiGrant.points;
    if (backgroundAsiPointsUsed >= totalAsiPoints) return false;
    if (cur >= 2) return false; // per-ability hard cap (no +3)
    const currentTotal = resolved?.abilities[ability].total ?? 10;
    if (currentTotal + 1 > 20) return false;
    if (asiMode === '+2/+1') {
      if (cur === 0) {
        // Adding a new ability — +2/+1 allows at most 2 distinct abilities
        const distinct = Object.values(backgroundAsiAllocation).filter((v) => (v ?? 0) > 0).length;
        if (distinct >= 2) return false;
      }
      if (cur === 1) {
        // Bumping to +2 — only allowed if no other ability is already at +2
        const someOtherAt2 = (Object.entries(backgroundAsiAllocation) as [AbilityKey, number][]).some(
          ([a, v]) => a !== ability && v === 2
        );
        if (someOtherAt2) return false;
      }
    }
    if (asiMode === '+1/+1/+1') {
      if (cur >= 1) return false; // each ability capped at +1
    }
    return true;
  };

  const canDecrement = (ability: AbilityKey): boolean => {
    if (!backgroundAsiChoiceKey) return false;
    const currentAlloc = backgroundAsiAllocation[ability] ?? 0;
    return currentAlloc > 0;
  };

  const incrementAsi = (ability: AbilityKey) => {
    if (!backgroundAsiChoiceKey || !canIncrement(ability)) return;
    const currentAlloc = backgroundAsiAllocation[ability] ?? 0;
    const next = { ...backgroundAsiAllocation, [ability]: currentAlloc + 1 };
    context.makeChoice(backgroundAsiChoiceKey, { type: 'asi', allocation: next });
  };

  const decrementAsi = (ability: AbilityKey) => {
    if (!backgroundAsiChoiceKey || !canDecrement(ability)) return;
    const currentAlloc = backgroundAsiAllocation[ability] ?? 0;
    const next: Partial<Record<AbilityKey, number>> = { ...backgroundAsiAllocation, [ability]: currentAlloc - 1 };
    if (next[ability] === 0) delete next[ability];
    context.makeChoice(backgroundAsiChoiceKey, { type: 'asi', allocation: next });
  };

  const handleModeChange = (mode: AsiMode) => {
    setAsiMode(mode);
    // Reset allocation when mode changes since the constraints differ
    if (backgroundAsiChoiceKey) {
      context.clearChoice(backgroundAsiChoiceKey);
    }
  };

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

      {/* Background picker */}
      <div className="space-y-2">
        <Label>
          {tc('characterBuilder.fields.background')}
          <span className="text-destructive">*</span>
        </Label>
        <Select
          value={background || null}
          onValueChange={(value) => {
            if (!value) return;
            handleBackgroundChange(value);
          }}
          items={DND_BACKGROUNDS.map((b) => ({ value: b.id, label: t(`backgrounds.${b.id}`) }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={tc('characterBuilder.placeholders.chooseBackground')} />
          </SelectTrigger>
          <SelectContent>
            {DND_BACKGROUNDS.map((bg) => (
              <SelectItem key={bg.id} value={bg.id}>
                {t(`backgrounds.${bg.id}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!background && (
        <p className="text-sm text-muted-foreground">{tc('characterBuilder.backgroundStep.noBackground')}</p>
      )}

      {background && backgroundAsiGrant && (
        <div className="space-y-4">
          {/* ASI mode selector */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">{tc('characterBuilder.backgroundStep.asiModeTitle')}</Label>
            <p className="text-sm text-muted-foreground">{tc('characterBuilder.backgroundStep.asiModeDescription')}</p>
            <div className="space-y-2">
              {(
                [
                  { mode: '+2/+1', labelKey: 'characterBuilder.backgroundStep.asiMode21Label' },
                  { mode: '+1/+1/+1', labelKey: 'characterBuilder.backgroundStep.asiMode111Label' },
                ] as const
              ).map(({ mode, labelKey }) => {
                const radioId = `asi-mode-${mode}`;
                return (
                  <div
                    key={mode}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50"
                  >
                    <input
                      type="radio"
                      id={radioId}
                      name="asi-mode"
                      checked={asiMode === mode}
                      onChange={() => handleModeChange(mode)}
                      className="size-4 text-primary"
                    />
                    <Label htmlFor={radioId} className="flex-1 cursor-pointer">
                      {tc(labelKey)}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-ability ASI allocation */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {eligibleAbilities.map((ability) => {
                const alloc = backgroundAsiAllocation[ability] ?? 0;
                const canInc = canIncrement(ability);
                const canDec = canDecrement(ability);
                return (
                  <div key={ability} className="flex items-center gap-2 p-2 rounded-md border border-border/50">
                    <span className="text-sm font-semibold min-w-8">{t(`abilities.${ability}`)}</span>
                    <div className="flex items-center gap-1 ml-auto">
                      {alloc > 0 && <span className="text-sm font-bold text-green-600 mr-1">+{alloc}</span>}
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={!canDec}
                        onClick={() => decrementAsi(ability)}
                        aria-label={tc('characterSheet.asi.decreaseAbility', { ability: t(`abilities.${ability}`) })}
                      >
                        <ChevronDown className="size-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={!canInc}
                        onClick={() => incrementAsi(ability)}
                        aria-label={tc('characterSheet.asi.increaseAbility', { ability: t(`abilities.${ability}`) })}
                      >
                        <ChevronUp className="size-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge
                variant={backgroundAsiPointsUsed === backgroundAsiGrant.points ? 'default' : 'outline'}
                className="text-xs"
              >
                {backgroundAsiPointsUsed} / {backgroundAsiGrant.points}
              </Badge>
              {backgroundAsiPointsUsed < backgroundAsiGrant.points && (
                <span>
                  {tc('characterBuilder.abilities.backgroundAsiRemaining', {
                    count: backgroundAsiGrant.points - backgroundAsiPointsUsed,
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
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

      {/* Language choices */}
      {background && backgroundLanguageChoices.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-semibold">{tc('characterBuilder.backgroundStep.languageTitle')}</Label>
          <div className="space-y-4">
            {backgroundLanguageChoices.map((choice) => {
              const decision = build?.choices[choice.choiceKey as ChoiceKey];
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
