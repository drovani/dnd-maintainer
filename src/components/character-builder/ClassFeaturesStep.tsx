import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { type ChoiceKey } from '@/types/choices';
import { type FightingStyleId, DND_LAND_TERRAINS, type LandTerrainId } from '@/lib/dnd-helpers';
import { getChoiceSourceName } from '@/lib/character-builder/choice-source-name';
import { FIGHTING_STYLE_SOURCES } from '@/lib/sources/fighting-styles';
import { SPELL_CATALOG, getSpellNameKey, getSpellDescriptionKey, type SpellId } from '@/lib/sources/spells';
import { LAND_TERRAIN_SPELL_GRANTS } from '@/lib/sources/land-terrains';
import { collectGrantsByType } from '@/lib/resolver/helpers';
import type { SpellDef, SpellSchool } from '@/types/spells';
import type { ClassId } from '@/lib/dnd-helpers';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface FightingStyleChoiceInfo {
  readonly choiceKey: ChoiceKey;
  readonly count: number;
  readonly from: readonly FightingStyleId[];
}

interface SpellChoiceInfo {
  readonly choiceKey: ChoiceKey;
  readonly count: number;
  readonly fromList: ClassId;
  readonly maxLevel: number | null;
}

interface LandTerrainChoiceInfo {
  readonly choiceKey: ChoiceKey;
  readonly from: readonly LandTerrainId[];
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

  const spellChoices = useMemo<readonly SpellChoiceInfo[]>(() => {
    const seen = new Set<string>();
    const result: SpellChoiceInfo[] = [];
    for (const { grant } of collectGrantsByType(bundles, 'spell-choice')) {
      if (!seen.has(grant.key)) {
        seen.add(grant.key);
        result.push({
          choiceKey: grant.key,
          count: grant.count,
          fromList: grant.fromList,
          maxLevel: grant.maxLevel,
        });
      }
    }
    return result;
  }, [bundles]);

  const landTerrainChoices = useMemo<readonly LandTerrainChoiceInfo[]>(() => {
    const result: LandTerrainChoiceInfo[] = [];
    for (const { grant } of collectGrantsByType(bundles, 'land-terrain-choice')) {
      result.push({
        choiceKey: grant.key,
        from: grant.from ?? (DND_LAND_TERRAINS.map((t) => t.id) as readonly LandTerrainId[]),
      });
    }
    return result;
  }, [bundles]);

  function getSelectedFightingStyles(choiceKey: ChoiceKey): readonly FightingStyleId[] {
    const decision = build?.choices[choiceKey];
    if (decision?.type === 'fighting-style-choice') return decision.styles;
    return [];
  }

  function getSelectedSpellIds(choiceKey: ChoiceKey): readonly string[] {
    const decision = build?.choices[choiceKey];
    if (decision?.type === 'spell-choice') return decision.spellIds;
    return [];
  }

  function getSelectedTerrain(choiceKey: ChoiceKey): LandTerrainId | null {
    const decision = build?.choices[choiceKey];
    if (decision?.type === 'land-terrain-choice') return decision.terrainId;
    return null;
  }

  const spellcasting = resolved?.spellcasting;
  const hasFightingStyles = fightingStyleChoices.length > 0;
  const hasSpellChoices = spellChoices.length > 0;
  const hasLandTerrainChoices = landTerrainChoices.length > 0;
  const hasSpellcasting = !!spellcasting;
  const hasAnyContent = hasFightingStyles || hasSpellChoices || hasLandTerrainChoices || hasSpellcasting;

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

      {hasSpellChoices &&
        spellChoices.map((sc) => (
          <SpellChoicePicker
            key={sc.choiceKey}
            choiceKey={sc.choiceKey}
            count={sc.count}
            fromList={sc.fromList}
            maxLevel={sc.maxLevel}
            selected={getSelectedSpellIds(sc.choiceKey)}
            onToggle={(spellId, isSelected) => {
              const current = getSelectedSpellIds(sc.choiceKey);
              const next = isSelected ? [...current, spellId] : current.filter((id) => id !== spellId);
              context.makeChoice(sc.choiceKey, { type: 'spell-choice', spellIds: next });
            }}
          />
        ))}

      {hasLandTerrainChoices &&
        landTerrainChoices.map((ltc) => (
          <LandTerrainChoicePicker
            key={ltc.choiceKey}
            choiceKey={ltc.choiceKey}
            from={ltc.from}
            selected={getSelectedTerrain(ltc.choiceKey)}
            onSelect={(terrainId) => context.makeChoice(ltc.choiceKey, { type: 'land-terrain-choice', terrainId })}
          />
        ))}

      {hasSpellcasting && (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold">{tc('characterBuilder.classFeatures.spellcasting')}</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{tc('characterBuilder.spellcasting.saveDC')}</p>
              <p className="font-semibold">{spellcasting.spellSaveDC}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{tc('characterBuilder.spellcasting.attackBonus')}</p>
              <p className="font-semibold">+{spellcasting.spellAttackBonus}</p>
            </div>
          </div>
          {spellcasting.slots.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">{tc('characterBuilder.spellcasting.slots')}</p>
              <div className="flex flex-wrap gap-2">
                {spellcasting.slots.map((count, idx) => (
                  <span key={idx} className="text-xs rounded bg-muted px-2 py-0.5">
                    {tc('characterBuilder.spellcasting.slotLevel', { level: idx + 1 })}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
          {spellcasting.cantrips.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">{tc('characterBuilder.spellcasting.cantrips')}</p>
              <p className="text-sm">
                {spellcasting.cantrips.map((id) => t(getSpellNameKey(id as SpellId))).join(', ')}
              </p>
            </div>
          )}
          {spellcasting.alwaysPreparedSpells.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">{tc('characterBuilder.spellcasting.alwaysPrepared')}</p>
              <p className="text-sm">
                {spellcasting.alwaysPreparedSpells.map((id) => t(getSpellNameKey(id as SpellId))).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {!hasAnyContent && (
        <p className="text-muted-foreground text-sm">{tc('characterBuilder.classFeatures.noClassChoices')}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SpellChoicePicker — multi-select capped at count, grouped by school
// ---------------------------------------------------------------------------

interface SpellChoicePickerProps {
  readonly choiceKey: ChoiceKey;
  readonly count: number;
  readonly fromList: ClassId;
  readonly maxLevel: number | null;
  readonly selected: readonly string[];
  readonly onToggle: (spellId: string, isSelected: boolean) => void;
}

function SpellChoicePicker({ choiceKey, count, fromList, maxLevel, selected, onToggle }: SpellChoicePickerProps) {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');

  const spellsBySchool = useMemo<ReadonlyMap<SpellSchool, readonly SpellDef[]>>(() => {
    const filtered = SPELL_CATALOG.filter((spell) => {
      if (!spell.classes.includes(fromList)) return false;
      if (maxLevel !== null && spell.level > maxLevel) return false;
      return true;
    });
    const map = new Map<SpellSchool, SpellDef[]>();
    for (const spell of filtered) {
      const list = map.get(spell.school) ?? [];
      list.push(spell);
      map.set(spell.school, list);
    }
    return map;
  }, [fromList, maxLevel]);

  const atMax = selected.length >= count;
  const isCantrips = maxLevel === 0;
  const header = isCantrips
    ? tc('characterBuilder.spellChoice.header')
    : tc('characterBuilder.spellChoice.headerSpells');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">{header}</h3>
        <Badge variant={atMax ? 'default' : 'outline'} className="text-xs">
          {tc('characterBuilder.spellChoice.progress', { selected: selected.length, count })}
        </Badge>
      </div>
      {Array.from(spellsBySchool.entries()).map(([school, spells]) => (
        <div key={school}>
          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">
            {tc('characterBuilder.spellChoice.groupHeader', { school: t(`schools.${school}`) })}
          </p>
          <div className="space-y-1">
            {spells.map((spell) => {
              const isSelected = selected.includes(spell.id);
              const isDisabled = atMax && !isSelected;
              const checkboxId = `spell-${choiceKey}-${spell.id}`;
              return (
                <div
                  key={spell.id}
                  className="flex items-start gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={(checked) => onToggle(spell.id, !!checked)}
                    className="mt-0.5"
                  />
                  <Label htmlFor={checkboxId} className="flex-1 cursor-pointer">
                    <span className="text-sm">{t(getSpellNameKey(spell.id as SpellId))}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t(getSpellDescriptionKey(spell.id as SpellId))}
                    </p>
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LandTerrainChoicePicker — radio cards with per-tier spell previews
// ---------------------------------------------------------------------------

interface LandTerrainChoicePickerProps {
  readonly choiceKey: ChoiceKey;
  readonly from: readonly LandTerrainId[];
  readonly selected: LandTerrainId | null;
  readonly onSelect: (terrainId: LandTerrainId) => void;
}

function LandTerrainChoicePicker({ choiceKey, from, selected, onSelect }: LandTerrainChoicePickerProps) {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{tc('characterBuilder.landTerrain.header')}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{tc('characterBuilder.landTerrain.description')}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {from.map((terrainId) => {
          const isSelected = selected === terrainId;
          const radioId = `land-terrain-${choiceKey}-${terrainId}`;
          const terrainGrant = LAND_TERRAIN_SPELL_GRANTS.find((g) => g.terrainId === terrainId);

          return (
            <Card
              key={terrainId}
              size="sm"
              onClick={() => onSelect(terrainId)}
              className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
            >
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={radioId}
                    name={`land-terrain-${choiceKey}`}
                    checked={isSelected}
                    onChange={() => onSelect(terrainId)}
                    className="size-4 text-primary"
                  />
                  <Label htmlFor={radioId} className="cursor-pointer font-semibold">
                    {t(`terrains.${terrainId}.name`)}
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">{t(`terrains.${terrainId}.description`)}</p>
                {terrainGrant && (
                  <div className="ml-6 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      {tc('characterBuilder.landTerrain.circleSpellsTitle')}
                    </p>
                    {terrainGrant.tiers.map((tier) => (
                      <div key={tier.level} className="text-xs flex gap-1">
                        <span className="text-muted-foreground shrink-0">
                          {tc('characterBuilder.landTerrain.tierLabel', { level: tier.level })}:
                        </span>
                        <span>{tier.spellIds.map((id) => t(getSpellNameKey(id as SpellId))).join(', ')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
