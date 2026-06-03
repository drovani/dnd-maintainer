import { getSpellSlotMax, markSpellSlot, recoverSpellSlot } from '@/lib/rest';
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

  function handleToggle(level: number | 'pact'): void {
    const key = String(level);
    const usedCount = used[key] ?? 0;
    const maxCount = max[key] ?? 0;
    const next = usedCount < maxCount ? markSpellSlot(used, level, max) : recoverSpellSlot(used, level);
    onUpdate({ spell_slots_used: next });
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
              <span className="text-sm font-semibold text-foreground w-16 shrink-0">Level {level}</span>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: slotMax }, (_, i) => {
                  const isFilled = i < usedCount;
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={isFilled ? `recover level ${level} slot` : `use level ${level} slot`}
                      aria-pressed={isFilled}
                      onClick={() => handleToggle(level)}
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
              Pact (L{spellcasting.pactMagic.slotLevel})
            </span>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: spellcasting.pactMagic.count }, (_, i) => {
                const usedCount = used['pact'] ?? 0;
                const isFilled = i < usedCount;
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={isFilled ? 'recover pact slot' : 'use pact slot'}
                    aria-pressed={isFilled}
                    onClick={() => handleToggle('pact')}
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
