import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { Character } from '@/types/database';
import type { ResolvedCharacter } from '@/types/resolved';
import type { ResolvedSpellcasting } from '@/types/resolved';
import { SPELL_CATALOG, getSpellDef } from '@/lib/sources/spells';
import type { SpellId } from '@/lib/sources/spells';
import { useCharacterMutations } from '@/hooks/useCharacters';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { getLogger } from '@/lib/logger';

const logger = getLogger('SpellcastingPanel');

interface SpellcastingPanelProps {
  readonly character: Character;
  readonly resolved: ResolvedCharacter;
  readonly spellcasting: ResolvedSpellcasting;
}

function RitualPill() {
  const { t: tc } = useTranslation('common');
  return (
    <Badge variant="outline" className="text-[10px] py-0 px-1 ml-1 border-purple-400 text-purple-600">
      {tc('characterSheet.spellcasting.ritualBadge')}
    </Badge>
  );
}

export function SpellcastingPanel({ character, resolved, spellcasting }: SpellcastingPanelProps) {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');
  const { rows } = useCharacterContext();
  const { updatePreparedSpells } = useCharacterMutations();

  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const classId = character.class!;
  const classLevel = useMemo(
    () =>
      rows.filter(
        (r) =>
          'class_id' in r &&
          r.class_id === classId &&
          'deleted_at' in r &&
          (r as { deleted_at?: string | null }).deleted_at == null
      ).length,
    [rows, classId]
  );

  const wisMod = resolved.abilities.wis.modifier;

  const preparedCap = Math.max(1, wisMod + classLevel);

  const preparedSpells: readonly string[] = useMemo(() => character.prepared_spells ?? [], [character.prepared_spells]);

  // slots[i] holds slots for spell level i+1, so length equals the highest castable spell level
  const highestSlotLevel = spellcasting.slots.length;

  const alwaysPreparedSet = useMemo(
    () => new Set(spellcasting.alwaysPreparedSpells),
    [spellcasting.alwaysPreparedSpells]
  );
  const cantripSet = useMemo(() => new Set(spellcasting.cantrips), [spellcasting.cantrips]);
  const preparedSet = useMemo(() => new Set(preparedSpells), [preparedSpells]);

  // Spells available to add: druid class, level 1..highestSlotLevel, not already in any list
  const availableSpells = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return SPELL_CATALOG.filter((s) => {
      if (!s.classes.includes(classId as Parameters<typeof s.classes.includes>[0])) return false;
      if (s.level === 0) return false; // cantrips excluded
      if (s.level > highestSlotLevel) return false;
      if (alwaysPreparedSet.has(s.id)) return false;
      if (cantripSet.has(s.id)) return false;
      if (preparedSet.has(s.id)) return false;
      if (lowerSearch) {
        const nameKey = `spells.${s.id}.name` as `spells.${SpellId}.name`;
        const name = t(nameKey, { defaultValue: s.id });
        return name.toLowerCase().includes(lowerSearch);
      }
      return true;
    });
  }, [classId, highestSlotLevel, alwaysPreparedSet, cantripSet, preparedSet, search, t]);

  const handleAddSpell = (spellId: string) => {
    if (preparedSpells.length >= preparedCap) return;
    const next = [...preparedSpells, spellId];
    updatePreparedSpells.mutate(
      { characterId: character.id, spellIds: next },
      {
        onError: (error) => {
          logger.error('Failed to add prepared spell', { characterId: character.id, spellId, error });
          toast.error(tc('characterSheet.spellcasting.updateFailed'));
        },
      }
    );
    setSearch('');
    setShowPicker(false);
  };

  const handleRemoveSpell = (spellId: string) => {
    const next = preparedSpells.filter((id) => id !== spellId);
    updatePreparedSpells.mutate(
      { characterId: character.id, spellIds: next },
      {
        onError: (error) => {
          logger.error('Failed to remove prepared spell', { characterId: character.id, spellId, error });
          toast.error(tc('characterSheet.spellcasting.updateFailed'));
        },
      }
    );
  };

  const abilityName = t(`abilities.${spellcasting.ability}`);

  return (
    <div className="bg-card border border-purple-200 dark:border-purple-900 rounded-lg p-6">
      <h2 className="text-lg font-bold text-foreground mb-1">{tc('characterSheet.spellcasting.panelTitle')}</h2>
      <div className="text-xs text-muted-foreground mb-3">
        {tc('characterSheet.spellcasting.abilityLabel', { ability: abilityName })}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="secondary" className="text-xs">
          {tc('characterSheet.spellcasting.saveDC', { dc: spellcasting.spellSaveDC })}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {tc('characterSheet.spellcasting.attackBonus', { bonus: spellcasting.spellAttackBonus })}
        </Badge>
      </div>

      {/* Spell Slots Row */}
      {spellcasting.slots.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-bold text-muted-foreground uppercase mb-2">
            {tc('characterSheet.spellcasting.slotsHeader')}
          </div>
          <div className="flex flex-wrap gap-1">
            {spellcasting.slots.map((count, idx) => (
              <Badge key={idx} variant="outline" className="text-xs font-mono">
                {tc('characterSheet.spellcasting.slotLabel', { level: idx + 1, count })}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {spellcasting.cantrips.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-bold text-muted-foreground uppercase mb-2">
            {tc('characterSheet.spellcasting.cantripsHeader')}
          </div>
          <div className="space-y-1">
            {spellcasting.cantrips.map((spellId) => {
              const def = getSpellDef(spellId);
              const nameKey = `spells.${spellId}.name` as `spells.${SpellId}.name`;
              const spellName = t(nameKey, { defaultValue: spellId });
              return (
                <div key={spellId} className="text-sm text-foreground flex items-center gap-1">
                  <span className="text-muted-foreground">&bull;</span>
                  {spellName}
                  {def?.ritual && <RitualPill />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Always Prepared */}
      {spellcasting.alwaysPreparedSpells.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-bold text-muted-foreground uppercase mb-2">
            {tc('characterSheet.spellcasting.alwaysPreparedHeader')}
          </div>
          <div className="space-y-1">
            {spellcasting.alwaysPreparedSpells.map((spellId) => {
              const def = getSpellDef(spellId);
              const nameKey = `spells.${spellId}.name` as `spells.${SpellId}.name`;
              const spellName = t(nameKey, { defaultValue: spellId });
              return (
                <div key={spellId} className="text-sm text-foreground flex items-center gap-1">
                  <span className="text-muted-foreground">&bull;</span>
                  {spellName}
                  {def?.ritual && <RitualPill />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Prepared Spells (editable) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-muted-foreground uppercase">
            {tc('characterSheet.spellcasting.preparedHeader')}
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {tc('characterSheet.spellcasting.preparedCap', {
              count: preparedSpells.length,
              max: preparedCap,
            })}
          </Badge>
        </div>

        <div className="space-y-1 mb-3">
          {preparedSpells.map((spellId) => {
            const def = getSpellDef(spellId);
            const nameKey = `spells.${spellId}.name` as `spells.${SpellId}.name`;
            const spellName = t(nameKey, { defaultValue: spellId });
            return (
              <div key={spellId} className="flex items-center justify-between group">
                <div className="text-sm text-foreground flex items-center gap-1">
                  <span className="text-muted-foreground">&bull;</span>
                  {spellName}
                  {def?.ritual && <RitualPill />}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveSpell(spellId)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={tc('characterSheet.spellcasting.removeSpellAria', { spellName })}
                >
                  <X className="size-3" />
                </Button>
              </div>
            );
          })}
        </div>

        {preparedSpells.length < preparedCap && (
          <div>
            {!showPicker ? (
              <Button variant="outline" size="sm" onClick={() => setShowPicker(true)} className="w-full text-xs">
                + {tc('characterSheet.spellcasting.addSpell')}
              </Button>
            ) : (
              <div className="border rounded-md p-2 space-y-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={tc('characterSheet.spellcasting.addSpell')}
                  className="w-full text-xs border rounded px-2 py-1 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                />
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {availableSpells.map((s) => {
                    const nameKey = `spells.${s.id}.name` as `spells.${SpellId}.name`;
                    const spellName = t(nameKey, { defaultValue: s.id });
                    const schoolName = t(`schools.${s.school}`);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleAddSpell(s.id)}
                        className="w-full text-left text-xs px-2 py-1 rounded hover:bg-muted/70 transition-colors flex items-center justify-between"
                      >
                        <span className="text-foreground">
                          {spellName}
                          {s.ritual && (
                            <span className="ml-1 text-purple-600 text-[10px]">
                              ({tc('characterSheet.spellcasting.ritualBadge')})
                            </span>
                          )}
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          L{s.level} · {schoolName}
                        </span>
                      </button>
                    );
                  })}
                  {availableSpells.length === 0 && (
                    <div className="text-xs text-muted-foreground px-2 py-1">
                      {search
                        ? tc('characterSheet.spellcasting.noSearchMatch')
                        : tc('characterSheet.spellcasting.noSpellsAvailable')}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPicker(false);
                    setSearch('');
                  }}
                  className="w-full text-xs"
                >
                  {tc('buttons.cancel')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
