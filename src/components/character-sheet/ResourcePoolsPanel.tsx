import { getSourceDisplayName } from '@/lib/class-icons';
import type { ResolvedCharacter } from '@/types/resolved';
import { useTranslation } from 'react-i18next';

interface ResourcePoolsPanelProps {
  readonly resolved: ResolvedCharacter;
}

export function ResourcePoolsPanel({ resolved }: ResourcePoolsPanelProps): React.JSX.Element | null {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');

  if (resolved.resourcePools.length === 0) return null;

  return (
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.resourcePools')}</h2>
      <div className="space-y-3">
        {resolved.resourcePools.map((pool) => {
          const regenLabel =
            typeof pool.regen === 'string'
              ? tc(`characterSheet.resourcePools.regen.${pool.regen}`)
              : tc('characterSheet.resourcePools.regen.compound', { shortRestAmount: pool.regen.shortRestAmount });
          return (
            <div key={pool.poolId} className="bg-muted/50 p-3 rounded border">
              <div className="font-semibold text-foreground text-sm mb-1">
                {t(`resourcePools.${pool.poolId}.name`, { defaultValue: pool.poolId })}
              </div>
              <div className="text-xs text-muted-foreground">
                {tc('characterSheet.resourcePools.max', { max: pool.max })}
                {pool.dieSize !== undefined && (
                  <>
                    {' · '}
                    {tc('characterSheet.resourcePools.dieSize', { dieSize: pool.dieSize })}
                  </>
                )}
                {' · '}
                {regenLabel}
              </div>
              <div className="text-xs text-muted-foreground/70 mt-1">
                {tc('characterSheet.resourcePools.source', { source: getSourceDisplayName(pool.source, t) })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
