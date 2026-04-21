import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RollingNumber } from '@/components/ui/rolling-number';
import { averageDice, rollDice } from '@/lib/dnd-helpers';
import type { RaceId } from '@/lib/dnd-helpers';
import { diceRange, formatHeight, formatWeight, parseHeight, parseWeight, RACE_PHYSICALS } from '@/lib/race-physicals';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PhysicalCharacteristicsProps {
  readonly raceId: RaceId | null;
  readonly height: string | null;
  readonly weight: string | null;
  readonly onChange: (updates: { height: string | null; weight: string | null }) => void;
}

type RollingField = 'height' | 'weight' | 'all' | null;

export function PhysicalCharacteristics({ raceId, height, weight, onChange }: PhysicalCharacteristicsProps) {
  const { t } = useTranslation('common');

  const physicals = raceId ? RACE_PHYSICALS[raceId] : null;

  const [hMin, hMax] = physicals ? diceRange(physicals.heightDice) : [0, 0];
  const [wMin, wMax] = physicals?.weightDice ? diceRange(physicals.weightDice) : [1, 1];

  // Derive initial modifier values from saved height/weight strings
  const deriveHeightMod = (): number | null => {
    if (!physicals) return null;
    const parsed = parseHeight(height);
    if (parsed === null) return null;
    const mod = parsed - physicals.heightBase;
    if (mod < hMin || mod > hMax) return null;
    return mod;
  };

  const deriveWeightMod = (hMod: number | null): number | null => {
    if (!physicals || !physicals.weightDice) return null;
    if (hMod === null || hMod === 0) return null;
    const parsed = parseWeight(weight);
    if (parsed === null) return null;
    const mod = (parsed - physicals.weightBase) / hMod;
    if (!Number.isInteger(mod)) return null;
    if (mod < wMin || mod > wMax) return null;
    return mod;
  };

  const initialHMod = deriveHeightMod();
  const initialWMod = deriveWeightMod(initialHMod);

  const [heightMod, setHeightMod] = useState<number | null>(initialHMod);
  const [weightMod, setWeightMod] = useState<number | null>(initialWMod);
  const [rollingField, setRollingField] = useState<RollingField>(null);
  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track previous raceId to reset modifiers when race changes.
  // Using mid-render setState (React's recommended pattern for derived state resets)
  // rather than useEffect to avoid cascading renders.
  const [prevRaceId, setPrevRaceId] = useState<RaceId | null>(raceId);
  if (prevRaceId !== raceId) {
    setPrevRaceId(raceId);
    setHeightMod(null);
    setWeightMod(null);
    // Notify parent — deferred so we're not calling onChange during render
    Promise.resolve().then(() => onChange({ height: null, weight: null }));
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    };
  }, []);

  if (!physicals) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        {t('characterBuilder.backstory.physicals.noRace')}
      </div>
    );
  }

  const effectiveWeightMod =
    weightMod ?? (physicals.weightDice ? averageDice(physicals.weightDice.count, physicals.weightDice.sides) : 1);
  const finalHeightInches = physicals.heightBase + (heightMod ?? 0);
  const finalWeightLbs = physicals.weightBase + (heightMod ?? 0) * (physicals.weightDice ? effectiveWeightMod : 1);

  const commitValues = (hMod: number | null, wMod: number | null) => {
    const p = physicals;
    const hVal = hMod !== null ? formatHeight(p.heightBase + hMod) : null;
    const effW = wMod ?? (p.weightDice ? averageDice(p.weightDice.count, p.weightDice.sides) : 1);
    const wVal = hMod !== null ? formatWeight(p.weightBase + hMod * (p.weightDice ? effW : 1)) : null;
    onChange({ height: hVal, weight: wVal });
  };

  const startRoll = (field: 'height' | 'weight' | 'all') => {
    if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    setRollingField(field);
    rollTimerRef.current = setTimeout(() => {
      const newHMod =
        field === 'height' || field === 'all'
          ? rollDice(physicals.heightDice.count, physicals.heightDice.sides)
          : heightMod;
      const newWMod =
        (field === 'weight' || field === 'all') && physicals.weightDice
          ? rollDice(physicals.weightDice.count, physicals.weightDice.sides)
          : weightMod;
      setHeightMod(newHMod);
      setWeightMod(newWMod);
      commitValues(newHMod, newWMod);
      setRollingField(null);
    }, 600);
  };

  const applyAverage = (field: 'height' | 'weight' | 'all') => {
    const newHMod =
      field === 'height' || field === 'all'
        ? averageDice(physicals.heightDice.count, physicals.heightDice.sides)
        : heightMod;
    const newWMod =
      (field === 'weight' || field === 'all') && physicals.weightDice
        ? averageDice(physicals.weightDice.count, physicals.weightDice.sides)
        : weightMod;
    setHeightMod(newHMod);
    setWeightMod(newWMod);
    commitValues(newHMod, newWMod);
  };

  const handleHeightModChange = (raw: string) => {
    const n = parseInt(raw, 10);
    const clamped = isNaN(n) ? null : Math.min(hMax, Math.max(hMin, n));
    setHeightMod(clamped);
    commitValues(clamped, weightMod);
  };

  const handleWeightModChange = (raw: string) => {
    const n = parseInt(raw, 10);
    const clamped = isNaN(n) ? null : Math.min(wMax, Math.max(wMin, n));
    setWeightMod(clamped);
    commitValues(heightMod, clamped);
  };

  const isHeightRolling = rollingField === 'height' || rollingField === 'all';
  const isWeightRolling = rollingField === 'weight' || rollingField === 'all';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t('characterBuilder.backstory.physicals.sectionTitle')}</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyAverage('all')}
            disabled={rollingField !== null}
          >
            {t('characterBuilder.backstory.physicals.averageAll')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => startRoll('all')}
            disabled={rollingField !== null}
          >
            {t('characterBuilder.backstory.physicals.rollAll')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Height modifier */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="height-mod">
              {t('characterBuilder.backstory.physicals.heightModifier')}{' '}
              <span className="text-muted-foreground text-xs">
                {t('characterBuilder.backstory.physicals.modifierRange', { min: hMin, max: hMax })}
              </span>
            </Label>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyAverage('height')}
                disabled={rollingField !== null}
              >
                {t('characterBuilder.backstory.physicals.average')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => startRoll('height')}
                disabled={rollingField !== null}
              >
                {t('characterBuilder.backstory.physicals.roll')}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isHeightRolling ? (
              <div className="border-input bg-background flex h-9 w-full items-center rounded-md border px-3 text-sm">
                <RollingNumber value={heightMod} isRolling={true} range={[hMin, hMax]} />
              </div>
            ) : (
              <Input
                id="height-mod"
                type="number"
                min={hMin}
                max={hMax}
                value={heightMod ?? ''}
                onChange={(e) => handleHeightModChange(e.target.value)}
                className="w-full"
              />
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            {t('characterBuilder.backstory.physicals.formula', {
              base: `${physicals.heightBase}"`,
              dice: `${physicals.heightDice.count}d${physicals.heightDice.sides}`,
            })}
          </p>
        </div>

        {/* Weight modifier */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="weight-mod">
              {t('characterBuilder.backstory.physicals.weightModifier')}{' '}
              {physicals.weightDice ? (
                <span className="text-muted-foreground text-xs">
                  {t('characterBuilder.backstory.physicals.modifierRange', { min: wMin, max: wMax })}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">
                  {t('characterBuilder.backstory.physicals.fixedWeightMod')}
                </span>
              )}
            </Label>
            {physicals.weightDice && (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => applyAverage('weight')}
                  disabled={rollingField !== null}
                >
                  {t('characterBuilder.backstory.physicals.average')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => startRoll('weight')}
                  disabled={rollingField !== null}
                >
                  {t('characterBuilder.backstory.physicals.roll')}
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isWeightRolling ? (
              <div className="border-input bg-background flex h-9 w-full items-center rounded-md border px-3 text-sm">
                <RollingNumber value={weightMod} isRolling={true} range={[wMin, wMax]} />
              </div>
            ) : (
              <Input
                id="weight-mod"
                type="number"
                min={wMin}
                max={wMax}
                value={weightMod ?? ''}
                onChange={(e) => handleWeightModChange(e.target.value)}
                disabled={!physicals.weightDice}
                className="w-full"
              />
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            {physicals.weightDice
              ? t('characterBuilder.backstory.physicals.weightFormula', {
                  base: physicals.weightBase,
                  dice: `${physicals.weightDice.count}d${physicals.weightDice.sides}`,
                })
              : t('characterBuilder.backstory.physicals.weightFormula', {
                  base: physicals.weightBase,
                  dice: '1',
                })}
          </p>
        </div>
      </div>

      {/* Final computed values */}
      <div className="grid grid-cols-2 gap-4 rounded-md border p-3">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">
            {t('characterBuilder.backstory.physicals.finalHeight')}
          </Label>
          <p className="font-medium">{heightMod !== null ? formatHeight(finalHeightInches) : '—'}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">
            {t('characterBuilder.backstory.physicals.finalWeight')}
          </Label>
          <p className="font-medium">{heightMod !== null ? formatWeight(finalWeightLbs) : '—'}</p>
        </div>
      </div>
    </div>
  );
}
