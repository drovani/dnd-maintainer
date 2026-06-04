import type { ResolvedCharacter } from '@/types/resolved';
import { useTranslation } from 'react-i18next';

export function AbilityScoresPanel({
  abilities,
  buildError,
}: {
  abilities: ResolvedCharacter['abilities'] | undefined;
  buildError: string | null;
}) {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');

  if (!abilities) {
    return (
      <div className="sheet-panel text-center text-muted-foreground">
        <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.abilities')}</h2>
        <p>
          {buildError
            ? tc('characterSheet.buildError.abilities', { message: buildError })
            : tc('characterSheet.emptyState.abilities')}
        </p>
      </div>
    );
  }

  return (
    <div className="sheet-panel">
      <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.abilities')}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
        {(Object.keys(abilities) as Array<keyof typeof abilities>).map((ability) => {
          const resolvedAbility = abilities[ability];
          const modifier = resolvedAbility.modifier;
          return (
            <div key={ability} className="ability-shield">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t(`abilities.${ability}`)}</div>
              <div className={`text-3xl font-bold leading-tight ${modifier >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {modifier >= 0 ? '+' : ''}
                {modifier}
              </div>
              <div className="mt-1 rounded-full border bg-card px-2 text-sm font-bold text-foreground">
                {resolvedAbility.total}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
