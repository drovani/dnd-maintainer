import type { ResolvedCharacter } from '@/types/resolved';
import { useTranslation } from 'react-i18next';

export function CombatPanel({
  resolved,
  abilities,
  armorClass,
  speedValue,
  speed,
  maxHP,
  profBonus,
  passivePerception,
  isStale,
  buildError,
}: {
  resolved: ResolvedCharacter | null;
  abilities: ResolvedCharacter['abilities'] | undefined;
  armorClass: number | null;
  speedValue: number | null | undefined;
  speed?: ResolvedCharacter['speed'];
  maxHP: number | null | undefined;
  profBonus: number;
  passivePerception?: number | null;
  isStale: boolean;
  buildError: string | null;
}) {
  const { t: tc } = useTranslation('common');

  const speedDisplay = (() => {
    if (speed && Object.keys(speed).length > 0) {
      const parts: string[] = [];
      const walk = speed.walk;
      if (walk != null) {
        const walkStr = tc('characterSheet.fields.speedFt', { value: walk.value });
        parts.push(walkStr);
      }
      const otherModes = (['fly', 'climb', 'swim', 'burrow'] as const).filter((m) => speed[m] != null);
      for (const mode of otherModes) {
        const entry = speed[mode]!;
        const modeLabel = tc(`characterSheet.fields.speedModes.${mode}`);
        let part = `${modeLabel} ${tc('characterSheet.fields.speedFt', { value: entry.value })}`;
        if (entry.condition != null) {
          part += ` (${tc(`characterSheet.fields.speedConditions.${entry.condition}`, { defaultValue: entry.condition })})`;
        }
        parts.push(part);
      }
      return parts.length > 0 ? parts.join(', ') : '—';
    }
    return speedValue != null ? tc('characterSheet.fields.speedFt', { value: speedValue }) : '—';
  })();

  return (
    <div className="bg-card border-2 border-destructive/30 rounded-lg p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.combat')}</h2>

      {!resolved && (
        <p className="text-sm text-muted-foreground mb-4">
          {buildError
            ? tc('characterSheet.buildError.combat', { message: buildError })
            : tc('characterSheet.emptyState.combat')}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`bg-muted/50 p-4 rounded border text-center ${isStale ? 'opacity-50' : ''}`}>
          <div className="text-xs text-muted-foreground mb-2">{tc('characterSheet.fields.armorClass')}</div>
          <div className="text-4xl font-bold text-foreground">{armorClass}</div>
        </div>

        <div className="bg-muted/50 p-4 rounded border text-center">
          <div className="text-xs text-muted-foreground mb-2">{tc('characterSheet.fields.initiative')}</div>
          <div className="text-4xl font-bold text-foreground">
            {resolved
              ? (resolved.initiative >= 0 ? '+' : '') + resolved.initiative
              : abilities
                ? (abilities.dex.modifier >= 0 ? '+' : '') + abilities.dex.modifier
                : '—'}
          </div>
        </div>
      </div>

      {/* HP Display (read-only) */}
      <div className={`bg-muted/50 p-4 rounded border mb-4 ${isStale ? 'opacity-50' : ''}`}>
        <div className="text-xs text-muted-foreground mb-2">{tc('characterSheet.fields.hitPoints')}</div>
        <div className="text-2xl font-bold text-red-600">{maxHP ?? '—'}</div>
      </div>

      <div className={`text-xs text-muted-foreground ${isStale ? 'opacity-50' : ''}`}>
        <div className="flex justify-between py-1">
          <span>{tc('characterSheet.fields.proficiencyBonus')}</span>
          <span className="font-mono font-bold text-foreground">+{profBonus}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>{tc('characterSheet.fields.speed')}</span>
          <span className="font-mono font-bold text-foreground">{speedDisplay}</span>
        </div>
        {passivePerception != null && (
          <div className="flex justify-between py-1">
            <span>{tc('characterSheet.fields.passivePerception')}</span>
            <span className="font-mono font-bold text-foreground">{passivePerception}</span>
          </div>
        )}
      </div>
    </div>
  );
}
