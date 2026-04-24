import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { type ChoiceKey } from '@/types/choices';
import { type FightingStyleId } from '@/lib/dnd-helpers';
import { getChoiceSourceName } from '@/lib/character-builder/choice-source-name';
import { FIGHTING_STYLE_SOURCES } from '@/lib/sources/fighting-styles';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface FightingStyleChoiceInfo {
  readonly choiceKey: ChoiceKey;
  readonly count: number;
  readonly from: readonly FightingStyleId[];
}

export function ClassFeaturesStep() {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');
  const context = useCharacterContext();
  const { resolved, build, bundles } = context;

  const fightingStyleChoices = useMemo<readonly FightingStyleChoiceInfo[]>(() => {
    const fsc: FightingStyleChoiceInfo[] = [];
    for (const bundle of bundles) {
      for (const grant of bundle.grants) {
        if (grant.type === 'fighting-style-choice') {
          fsc.push({
            choiceKey: grant.key,
            count: grant.count,
            from: grant.from,
          });
        }
      }
    }
    return fsc;
  }, [bundles]);

  function getSelectedFightingStyles(choiceKey: ChoiceKey): readonly FightingStyleId[] {
    const decision = build?.choices[choiceKey];
    if (decision?.type === 'fighting-style-choice') return decision.styles;
    return [];
  }

  const spellcasting = resolved?.spellcasting;
  const hasFightingStyles = fightingStyleChoices.length > 0;
  const hasSpellcasting = !!spellcasting;

  const levelOneClassFeatures = useMemo(() => {
    if (!resolved?.features) return [];
    return resolved.features.filter((f) => f.source.origin === 'class' && f.source.level === 1);
  }, [resolved]);
  const hasLevelOneFeatures = levelOneClassFeatures.length > 0;

  const hasAnyContent = hasFightingStyles || hasSpellcasting || hasLevelOneFeatures;

  return (
    <div className="space-y-6">
      {hasFightingStyles && (
        <div>
          <h3 className="text-sm font-semibold mb-2">{tc('characterBuilder.classFeatures.fightingStyles')}</h3>
          {fightingStyleChoices.map((fsc) => {
            const selected = getSelectedFightingStyles(fsc.choiceKey);
            const remaining = fsc.count - selected.length;
            return (
              <div key={fsc.choiceKey} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm text-muted-foreground">
                    {tc('characterBuilder.pendingChoices.fightingStyleChoice', { count: fsc.count })}{' '}
                    <span className="text-xs">
                      {tc('characterBuilder.pendingChoices.fromSource', {
                        source: getChoiceSourceName(fsc.choiceKey, t),
                      })}
                    </span>
                  </p>
                  <Badge variant={remaining === 0 ? 'default' : 'outline'} className="text-xs">
                    {selected.length} / {fsc.count}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {fsc.from.map((styleId) => {
                    const styleSource = FIGHTING_STYLE_SOURCES.find((s) => s.id === styleId);
                    if (!styleSource) return null;
                    const isSelected = selected.includes(styleId);
                    const radioId = `fighting-style-${fsc.choiceKey}-${styleId}`;
                    return (
                      <div
                        key={styleId}
                        className={`flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50 ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <input
                          type="radio"
                          id={radioId}
                          name={`fighting-style-${fsc.choiceKey}`}
                          checked={isSelected}
                          onChange={() =>
                            context.makeChoice(fsc.choiceKey, {
                              type: 'fighting-style-choice',
                              styles: [styleId],
                            })
                          }
                          className="mt-0.5 size-4 text-primary"
                        />
                        <Label htmlFor={radioId} className="flex-1 cursor-pointer">
                          <div className={`text-sm ${isSelected ? 'font-semibold' : ''}`}>
                            {t(`fightingStyles.${styleId}.name`)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t(`fightingStyles.${styleId}.description`)}
                          </p>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasSpellcasting && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">{tc('characterBuilder.classFeatures.spellcasting')}</h3>
          <p className="text-muted-foreground text-sm">{tc('characterBuilder.classFeatures.basicVersion')}</p>
          {spellcasting.cantrips.length > 0 && (
            <div>
              <span className="text-sm font-semibold">{tc('characterBuilder.classFeatures.cantrips')}: </span>
              <span className="text-sm">{spellcasting.cantrips.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {hasLevelOneFeatures && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{tc('characterBuilder.classFeatures.features')}</h3>
          <ul className="space-y-3">
            {levelOneClassFeatures.map(({ feature }) => (
              <li key={feature.id} className="rounded-md border border-border p-3">
                <div className="text-sm font-semibold">
                  {t(`features.${feature.id}.name`, { defaultValue: feature.name ?? feature.id })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(`features.${feature.id}.description`, { defaultValue: feature.description ?? '' })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!hasAnyContent && (
        <p className="text-muted-foreground text-sm">{tc('characterBuilder.classFeatures.noClassChoices')}</p>
      )}
    </div>
  );
}
