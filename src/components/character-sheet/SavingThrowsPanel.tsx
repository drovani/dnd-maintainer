import { BonusBreakdown } from '@/components/character-sheet/BonusBreakdown';
import type { ResolvedCharacter } from '@/types/resolved';
import { useTranslation } from 'react-i18next';

export function SavingThrowsPanel({
  savingThrows,
  buildError,
}: {
  savingThrows: ResolvedCharacter['savingThrows'] | undefined;
  buildError: string | null;
}) {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');

  if (!savingThrows) {
    return (
      <div className="sheet-panel text-center text-muted-foreground">
        <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.savingThrows')}</h2>
        <p>
          {buildError
            ? tc('characterSheet.buildError.savingThrows', { message: buildError })
            : tc('characterSheet.emptyState.savingThrows')}
        </p>
      </div>
    );
  }

  return (
    <div className="sheet-panel">
      <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.savingThrows')}</h2>
      <div className="space-y-2 text-xs">
        {(Object.keys(savingThrows) as Array<keyof typeof savingThrows>).map((ability) => {
          const save = savingThrows[ability];
          return (
            <div key={ability} className="flex justify-between items-center text-foreground">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`inline-block size-2.5 rounded-full border ${save.proficient ? 'bg-foreground border-foreground' : 'border-muted-foreground/50'}`}
                />
                <span className={save.proficient ? 'font-bold' : ''}>{t(`abilities.${ability}`)}</span>
              </span>
              <BonusBreakdown components={save.breakdown} total={save.bonus} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
