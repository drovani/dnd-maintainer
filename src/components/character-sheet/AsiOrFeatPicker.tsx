import { AsiAllocator } from '@/components/character-sheet/AsiAllocator';
import { ChoicePicker } from '@/components/character-builder/ChoicePicker';
import { Button } from '@/components/ui/button';
import type { AbilityKey } from '@/lib/dnd-helpers';
import type { ChoiceDecision, ChoiceKey } from '@/types/choices';
import type { PendingChoice, ResolvedCharacter } from '@/types/resolved';
import { useTranslation } from 'react-i18next';

interface AsiOrFeatPickerProps {
  readonly asiChoice: Extract<PendingChoice, { type: 'asi' }>;
  readonly featChoice: Extract<PendingChoice, { type: 'feat-choice' }>;
  readonly abilities: ResolvedCharacter['abilities'];
  readonly asiDecision?: ChoiceDecision | undefined;
  readonly featDecision?: ChoiceDecision | undefined;
  readonly onDecide: (key: ChoiceKey, decision: ChoiceDecision) => void;
  readonly onClear: (key: ChoiceKey) => void;
}

export function AsiOrFeatPicker({
  asiChoice,
  featChoice,
  abilities,
  asiDecision,
  featDecision,
  onDecide,
  onClear,
}: AsiOrFeatPickerProps) {
  const { t } = useTranslation('common');

  // Determine active mode: feat mode if there's a feat decision, otherwise ASI
  const activeMode = featDecision?.type === 'feat-choice' ? 'feat' : 'asi';

  const handleModeChange = (newMode: 'asi' | 'feat') => {
    if (newMode === 'asi' && activeMode !== 'asi') {
      // Switching to ASI: clear the feat decision
      onClear(featChoice.choiceKey);
    } else if (newMode === 'feat' && activeMode !== 'feat') {
      // Switching to Feat: clear the ASI decision
      onClear(asiChoice.choiceKey);
    }
  };

  const handleAsiDecide = (key: ChoiceKey, allocation: Partial<Record<AbilityKey, number>>) => {
    onDecide(key, { type: 'asi', allocation });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('characterSheet.levelUp.asiOrFeatPrompt')}</p>
      <div
        className="flex gap-1 rounded-lg border p-1"
        role="group"
        aria-label={t('characterSheet.levelUp.asiOrFeatPrompt')}
      >
        <Button
          variant={activeMode === 'asi' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1"
          onClick={() => {
            if (activeMode !== 'asi') handleModeChange('asi');
          }}
          aria-pressed={activeMode === 'asi'}
        >
          {t('characterSheet.levelUp.chooseAsi')}
        </Button>
        <Button
          variant={activeMode === 'feat' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1"
          onClick={() => {
            if (activeMode !== 'feat') handleModeChange('feat');
          }}
          aria-pressed={activeMode === 'feat'}
        >
          {t('characterSheet.levelUp.chooseFeat')}
        </Button>
      </div>

      {activeMode === 'asi' ? (
        <AsiAllocator
          choice={asiChoice}
          abilities={abilities}
          currentDecision={asiDecision}
          onDecide={handleAsiDecide}
          onClear={onClear}
          autoCommit
        />
      ) : (
        <ChoicePicker choice={featChoice} currentDecision={featDecision} onDecide={onDecide} onClear={onClear} />
      )}
    </div>
  );
}
