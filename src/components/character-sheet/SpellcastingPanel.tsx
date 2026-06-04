import { isSpellId } from '@/lib/sources/spells';
import { getSpellDisplayMeta } from '@/lib/spell-display';
import type { ResolvedCharacter } from '@/types/resolved';
import { useTranslation } from 'react-i18next';

type Spellcasting = NonNullable<ResolvedCharacter['spellcasting']>;

export function SpellcastingPanel({ spellcasting }: { spellcasting: Spellcasting }) {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');

  return (
    <div className="bg-card border border-purple-200 rounded-lg p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.spells')}</h2>
      <div className="space-y-3">
        {spellcasting.cantrips.length > 0 && (
          <div>
            <div className="text-xs font-bold text-muted-foreground mb-2">{tc('characterSheet.sections.cantrips')}</div>
            <div className="space-y-1">
              {spellcasting.cantrips.map((cantrip, i) => (
                <div key={i} className="text-sm text-foreground">
                  &bull; {cantrip}
                </div>
              ))}
            </div>
          </div>
        )}
        {spellcasting.alwaysPreparedSpells.length > 0 && (
          <div>
            <div className="text-xs font-bold text-muted-foreground mb-2">
              {tc('characterSheet.sections.alwaysPrepared')}
            </div>
            <div className="space-y-1">
              {spellcasting.alwaysPreparedSpells.map((id, i) => {
                const meta = getSpellDisplayMeta(id);
                return (
                  <div key={i} className="text-sm text-foreground">
                    &bull; {isSpellId(id) ? t(`spells.${id}.name`) : id}
                    {meta && (
                      <span className="text-xs text-muted-foreground ml-2">{`(lvl ${meta.level} ${meta.school})`}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
