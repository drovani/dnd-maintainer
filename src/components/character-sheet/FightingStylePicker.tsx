import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FIGHTING_STYLE_SOURCES } from '@/lib/sources/fighting-styles';
import type { PendingChoice } from '@/types/resolved';
import type { ChoiceKey, ChoiceDecision } from '@/types/choices';
import type { FightingStyleId } from '@/lib/dnd-helpers';
import { useTranslation } from 'react-i18next';

interface FightingStylePickerProps {
  readonly choice: Extract<PendingChoice, { type: 'fighting-style-choice' }>;
  readonly currentDecision?: ChoiceDecision | undefined;
  readonly onDecide: (choiceKey: ChoiceKey, decision: ChoiceDecision) => void;
  readonly onClear?: (key: ChoiceKey) => void;
}

export function FightingStylePicker({ choice, currentDecision, onDecide, onClear }: FightingStylePickerProps) {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');

  const existingStyleId =
    currentDecision?.type === 'fighting-style-choice' ? (currentDecision.styles[0] ?? null) : null;
  const [selected, setSelected] = useState<FightingStyleId | null>(existingStyleId);
  const hasExistingDecision = existingStyleId !== null;

  // Show styles from the grant's pool, excluding styles chosen by OTHER grants
  // (but keep the current grant's own selection visible so it stays selectable)
  const availableStyles = FIGHTING_STYLE_SOURCES.filter(
    (s) => choice.from.includes(s.id) && (s.id === existingStyleId || !choice.alreadyChosen.includes(s.id))
  );

  const handleConfirm = () => {
    if (!selected) return;
    onDecide(choice.choiceKey, { type: 'fighting-style-choice', styles: [selected] });
  };

  const handleClear = () => {
    setSelected(null);
    onClear?.(choice.choiceKey);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tc('characterSheet.fightingStylePicker.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{tc('characterSheet.fightingStylePicker.description')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableStyles.map((style) => {
          const isSelected = selected === style.id;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => setSelected(style.id)}
              className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
              }`}
            >
              <div className={`text-sm text-foreground ${isSelected ? 'font-semibold' : ''}`}>
                {t(`fightingStyles.${style.id}.name`)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t(`fightingStyles.${style.id}.description`)}</p>
            </button>
          );
        })}

        <div className="flex gap-2 mt-4">
          {hasExistingDecision && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="flex-1">
              {tc('buttons.clearSelection')}
            </Button>
          )}
          <Button className="flex-1" disabled={!selected} onClick={handleConfirm}>
            {tc('buttons.confirm')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
