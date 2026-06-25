import { isSpellId } from '@/lib/sources/spells';
import { getSpellDisplayMeta } from '@/lib/spell-display';
import type { ResolvedCharacter } from '@/types/resolved';
import { useTranslation } from 'react-i18next';

type Spellcasting = NonNullable<ResolvedCharacter['spellcasting']>;

export function SpellcastingPanel({ spellcasting }: { spellcasting: Spellcasting }) {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');

  // Group knownSpells by level, ascending
  const spellsByLevel = spellcasting.knownSpells.reduce<Record<number, string[]>>((acc, { spellId, spellLevel }) => {
    const group = acc[spellLevel] ?? [];
    group.push(spellId);
    return { ...acc, [spellLevel]: group };
  }, {});
  const sortedLevels = Object.keys(spellsByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  // Cantrips header: show "CANTRIPS (chosen/target)" when cantripsKnown > 0
  const cantripsHeader =
    spellcasting.cantripsKnown > 0
      ? `${tc('characterSheet.sections.cantrips')} (${tc('characterSheet.fields.chosenOfTarget', { chosen: spellcasting.cantrips.length, target: spellcasting.cantripsKnown })})`
      : tc('characterSheet.sections.cantrips');

  return (
    <div className="bg-card border border-purple-200 rounded-lg p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.spells')}</h2>

      {/* Spellcasting stats header */}
      {(spellcasting.ability != null || spellcasting.spellSaveDC != null || spellcasting.spellAttackBonus != null) && (
        <div className="flex flex-wrap gap-4 mb-4 text-sm border-b border-border pb-3">
          {spellcasting.ability != null && (
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">
                {tc('characterSheet.fields.spellcastingAbility')}
              </div>
              <div className="font-bold text-foreground">{t(`abilities.${spellcasting.ability}`)}</div>
            </div>
          )}
          {spellcasting.spellSaveDC != null && (
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{tc('characterSheet.fields.spellSaveDC')}</div>
              <div className="font-bold text-foreground">{spellcasting.spellSaveDC}</div>
            </div>
          )}
          {spellcasting.spellAttackBonus != null && (
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{tc('characterSheet.fields.spellAttackBonus')}</div>
              <div className="font-bold text-foreground">
                {spellcasting.spellAttackBonus >= 0 ? '+' : ''}
                {spellcasting.spellAttackBonus}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {spellcasting.cantrips.length > 0 && (
          <div>
            <div className="text-xs font-bold text-muted-foreground mb-2">{cantripsHeader}</div>
            <div className="space-y-1">
              {spellcasting.cantrips.map((cantrip, i) => {
                const meta = getSpellDisplayMeta(cantrip);
                return (
                  <div key={i} className="text-sm text-foreground">
                    &bull; {isSpellId(cantrip) ? t(`spells.${cantrip}.name`) : cantrip}
                    {meta && <span className="text-xs text-muted-foreground ml-2">{`(${meta.school})`}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {sortedLevels.length > 0 && (
          <div>
            <div className="text-xs font-bold text-muted-foreground mb-2">
              {tc('characterSheet.sections.knownSpells')}
            </div>
            <div className="space-y-2">
              {sortedLevels.map((level) => {
                // Level 0 in knownSpells means the spell was uncatalogued — show "Unknown level"
                const levelLabel =
                  level === 0
                    ? tc('characterSheet.fields.spellLevelUnknown')
                    : tc('characterSheet.fields.spellLevelLabel', { level });
                // Find matching spellsKnown target count for this level
                const spellsKnownEntry = spellcasting.spellsKnown.find((e) => e.spellLevel === level);
                const levelHeader =
                  spellsKnownEntry != null
                    ? `${levelLabel} (${tc('characterSheet.fields.chosenOfTarget', { chosen: spellsByLevel[level].length, target: spellsKnownEntry.count })})`
                    : levelLabel;
                return (
                  <div key={level}>
                    <div className="text-xs text-muted-foreground mb-1">{levelHeader}</div>
                    <div className="space-y-1">
                      {spellsByLevel[level].map((id, i) => {
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
                );
              })}
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
