import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { exhaustionPenalty, type ExhaustionLevel } from '@/lib/dnd-helpers';
import type { Character } from '@/types/database';
import { useTranslation } from 'react-i18next';

interface StatusPanelProps {
  readonly character: Character;
  readonly onUpdate: (updates: Partial<Character>) => void;
}

export function StatusPanel({ character, onUpdate }: StatusPanelProps): React.JSX.Element {
  const { t } = useTranslation('common');

  const exhaustionLevel = character.exhaustion_level;
  const { d20Penalty, dead } = exhaustionPenalty(exhaustionLevel);

  const handleDecrement = (): void => {
    if (exhaustionLevel <= 0) return;
    onUpdate({ exhaustion_level: (exhaustionLevel - 1) as ExhaustionLevel });
  };

  const handleIncrement = (): void => {
    if (exhaustionLevel >= 6) return;
    onUpdate({ exhaustion_level: (exhaustionLevel + 1) as ExhaustionLevel });
  };

  return (
    <div className="bg-muted/50 p-4 rounded border">
      <div className="flex flex-wrap gap-6">
        {/* Heroic Inspiration */}
        <div className="flex items-center gap-2">
          <Switch
            checked={character.heroic_inspiration}
            onCheckedChange={(v) => onUpdate({ heroic_inspiration: v })}
            id="heroic-inspiration-switch"
          />
          <label htmlFor="heroic-inspiration-switch" className="text-sm font-medium cursor-pointer">
            {t('characterSheet.status.heroicInspiration')}
          </label>
        </div>

        {/* Exhaustion stepper */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t('characterSheet.status.exhaustionLevel')}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleDecrement}
              disabled={exhaustionLevel <= 0}
              aria-label={t('characterSheet.status.decrement')}
            >
              -
            </Button>
            <span className="w-4 text-center font-bold text-sm">{exhaustionLevel}</span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleIncrement}
              disabled={exhaustionLevel >= 6}
              aria-label={t('characterSheet.status.increment')}
            >
              +
            </Button>
          </div>
          {dead ? (
            <Badge variant="destructive">{t('characterSheet.status.dead')}</Badge>
          ) : exhaustionLevel >= 1 ? (
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>{t('characterSheet.status.exhaustionPenalty', { penalty: d20Penalty })}</p>
              {exhaustionLevel >= 5 && <p>{t('characterSheet.status.speedZero')}</p>}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
