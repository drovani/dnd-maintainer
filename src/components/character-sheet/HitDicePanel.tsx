import { Button } from '@/components/ui/button';
import { getHitDiceMax, spendHitDie } from '@/lib/rest';
import type { Character } from '@/types/database';
import type { ResolvedCharacter } from '@/types/resolved';
import { useTranslation } from 'react-i18next';

interface HitDicePanelProps {
  readonly resolved: ResolvedCharacter;
  readonly character: Character;
  readonly onUpdate: (u: Partial<Character>) => void;
}

export function HitDicePanel({ resolved, character, onUpdate }: HitDicePanelProps): React.JSX.Element | null {
  const { t: tc } = useTranslation('common');

  if (resolved.hitDie.length === 0) return null;

  const maxByDie = getHitDiceMax(resolved);
  const used = character.hit_dice_used ?? {};

  function handleSpend(die: number): void {
    const next = spendHitDie(used, die, maxByDie);
    onUpdate({ hit_dice_used: next });
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.hitDice')}</h2>
      <div className="space-y-3">
        {resolved.hitDie.map(({ die, count }) => {
          const key = String(die);
          const usedCount = used[key] ?? 0;
          const available = (maxByDie[key] ?? 0) - usedCount;
          const isDisabled = usedCount >= (maxByDie[key] ?? 0);

          return (
            <div key={die} className="flex items-center justify-between bg-muted/50 p-3 rounded border">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground text-sm">
                  d{die} × {count}
                </span>
                <span className="text-xs text-muted-foreground">
                  {available} / {maxByDie[key] ?? 0} available
                </span>
              </div>
              <Button type="button" variant="outline" size="sm" disabled={isDisabled} onClick={() => handleSpend(die)}>
                Spend
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
