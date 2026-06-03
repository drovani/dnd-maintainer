import { getSpellSlotMax } from '@/lib/rest';
import type { Character } from '@/types/database';
import type { ResolvedCharacter } from '@/types/resolved';
import { useTranslation } from 'react-i18next';

interface SpellSlotsPanelProps {
  readonly resolved: ResolvedCharacter;
  readonly character: Character;
  readonly onUpdate: (u: Partial<Character>) => void;
}

export function SpellSlotsPanel({ resolved, character, onUpdate }: SpellSlotsPanelProps): React.JSX.Element | null {
  const { t: tc } = useTranslation('common');

  const spellcasting = resolved.spellcasting;
  if (!spellcasting) return null;

  const hasNormalSlots = spellcasting.slots.some((n) => n > 0);
  const hasPactMagic = spellcasting.pactMagic !== null;
  if (!hasNormalSlots && !hasPactMagic) return null;

  const max = getSpellSlotMax(resolved);
  const used = character.spell_slots_used ?? {};

  function handlePipClick(key: string, i: number, isFilled: boolean): void {
    const maxCount = max[key] ?? 0;
    const newUsed = isFilled ? Math.max(0, i) : Math.min(i + 1, maxCount);
    onUpdate({ spell_slots_used: { ...used, [key]: newUsed } });
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.spellSlots')}</h2>
      <div className="space-y-3">
        {/* Normal spell slots: levels 1–9 */}
        {spellcasting.slots.map((slotMax, index) => {
          if (slotMax === 0) return null;
          const level = index + 1;
          const key = String(level);
          const usedCount = used[key] ?? 0;

          return (
            <div key={level} className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-foreground w-16 shrink-0">
                {tc('characterSheet.spellSlots.levelLabel', { level })}
              </span>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: slotMax }, (_, i) => {
                  const isFilled = i < usedCount;
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={
                        isFilled
                          ? tc('characterSheet.spellSlots.recoverSlot', { level })
                          : tc('characterSheet.spellSlots.useSlot', { level })
                      }
                      aria-pressed={isFilled}
                      onClick={() => handlePipClick(key, i, isFilled)}
                      className={`size-6 rounded-full border-2 transition-colors cursor-pointer ${
                        isFilled
                          ? 'bg-primary border-primary'
                          : 'bg-transparent border-muted-foreground hover:border-primary'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Pact magic row */}
        {hasPactMagic && spellcasting.pactMagic !== null && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-foreground w-16 shrink-0">
              {tc('characterSheet.spellSlots.pactLabel', { slotLevel: spellcasting.pactMagic.slotLevel })}
            </span>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: spellcasting.pactMagic.count }, (_, i) => {
                const usedCount = used['pact'] ?? 0;
                const isFilled = i < usedCount;
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={
                      isFilled ? tc('characterSheet.spellSlots.recoverPact') : tc('characterSheet.spellSlots.usePact')
                    }
                    aria-pressed={isFilled}
                    onClick={() => handlePipClick('pact', i, isFilled)}
                    className={`size-6 rounded-full border-2 transition-colors cursor-pointer ${
                      isFilled
                        ? 'bg-purple-600 border-purple-600'
                        : 'bg-transparent border-muted-foreground hover:border-purple-600'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
