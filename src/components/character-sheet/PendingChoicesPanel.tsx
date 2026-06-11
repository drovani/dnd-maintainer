import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AsiAllocator } from '@/components/character-sheet/AsiAllocator';
import { ExpertiseChoicePicker } from '@/components/character-sheet/ExpertiseChoicePicker';
import { FightingStylePicker } from '@/components/character-sheet/FightingStylePicker';
import { DamageTypePicker } from '@/components/character-sheet/DamageTypePicker';
import { SubclassPicker } from '@/components/character-sheet/SubclassPicker';
import { ChoicePicker } from '@/components/character-builder/ChoicePicker';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { collectGrantsByType } from '@/lib/resolver/helpers';
import { useAllChoiceGrants } from '@/lib/use-all-choice-grants';
import type { PendingChoice, ResolvedCharacter } from '@/types/resolved';
import type { ChoiceDecision, ChoiceKey } from '@/types/choices';
import { useTranslation } from 'react-i18next';

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
