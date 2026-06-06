import type { ResolvedCharacter } from '@/types/resolved';
import { useTranslation } from 'react-i18next';

export function FeaturesPanel({ features }: { features: ResolvedCharacter['features'] }) {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');

  return (
    <div className="sheet-panel">
      <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.featuresAndTraits')}</h2>
      <div className="space-y-3">
        {features.map((resolvedFeature, i) => (
          <div key={i} className="bg-muted/50 p-3 rounded border">
            <div className="font-semibold text-foreground text-sm mb-1">
              {t(`features.${resolvedFeature.feature.id}.name`, {
                defaultValue: resolvedFeature.feature.name ?? resolvedFeature.feature.id,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {t(`features.${resolvedFeature.feature.id}.description`, {
                defaultValue: resolvedFeature.feature.description ?? '',
              })}
            </p>
            {resolvedFeature.source && (
              <div className="text-xs text-muted-foreground/70 mt-1">
                {tc('characterSheet.fields.source', {
                  source:
                    resolvedFeature.source.origin === 'class'
                      ? t(`classes.${resolvedFeature.source.id}`)
                      : resolvedFeature.source.origin === 'subclass'
                        ? t(`subclasses.${resolvedFeature.source.id}.name`)
                        : resolvedFeature.source.origin === 'species'
                          ? t(`species.${resolvedFeature.source.id}`)
                          : resolvedFeature.source.origin === 'background'
                            ? t(`backgrounds.${resolvedFeature.source.id}`)
                            : resolvedFeature.source.origin === 'loot'
                              ? resolvedFeature.source.description
                              : resolvedFeature.source.origin === 'feat'
                                ? t(`feats.${resolvedFeature.source.id}.name`, {
                                    defaultValue: resolvedFeature.source.id,
                                  })
                                : resolvedFeature.source.id,
                })}
              </div>
            )}
            {resolvedFeature.saveDC !== undefined && resolvedFeature.feature.saveDC && (
              <div className="text-xs font-semibold text-foreground mt-1">
                {tc('characterSheet.fields.saveDC', {
                  dc: resolvedFeature.saveDC,
                  ability: t(`abilities.${resolvedFeature.feature.saveDC.dcAbility}`),
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
