import { AsiOrFeatPicker } from '@/components/character-sheet/AsiOrFeatPicker';
import { DamageTypePicker } from '@/components/character-sheet/DamageTypePicker';
import { ExpertiseChoicePicker } from '@/components/character-sheet/ExpertiseChoicePicker';
import { FightingStylePicker } from '@/components/character-sheet/FightingStylePicker';
import { SubclassPicker } from '@/components/character-sheet/SubclassPicker';
import { ChoicePicker } from '@/components/character-builder/ChoicePicker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RollingNumber } from '@/components/ui/rolling-number';
import type { ClassId, FightingStyleId } from '@/lib/dnd-helpers';
import { getGrantsForLevel } from '@/lib/sources/level-grants';
import { collectChoiceGrantsFromGrants } from '@/lib/use-all-choice-grants';
import { parseChoiceKey } from '@/types/choices';
import type { ChoiceDecision, ChoiceKey } from '@/types/choices';
import type { FeatureGrant } from '@/types/grants';
import type { PendingChoice, ResolvedCharacter } from '@/types/resolved';
import type { SourceTag, SubclassId } from '@/types/sources';
import { Dices } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LevelUpDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: (hpRoll: number, decisions: ReadonlyMap<ChoiceKey, ChoiceDecision>) => void;
  /** The hit die sides (e.g. 10 for d10). Used to roll and compute average. */
  readonly hitDie: number;
  /** The translated class name (e.g. "Fighter"). */
  readonly className: string;
  /** The character level the character will advance to. Currently assumes single-class; multiclass will need per-class level calculation. */
  readonly targetLevel: number;
  /** The class being leveled up. */
  readonly classId: ClassId;
  /** The already-chosen subclass (for subclass feature grants at higher levels). */
  readonly currentSubclassId: SubclassId | null;
  /** Current resolved abilities (needed for ASI allocator). */
  readonly currentAbilities: ResolvedCharacter['abilities'] | null;
  /** Fighting styles already chosen by the character (to exclude from picker). */
  readonly alreadyChosenStyles: readonly FightingStyleId[];
  /** Weapon proficiencies from the resolved character — needed for mastery picker dedup. */
  readonly resolvedWeaponProficiencies: readonly { readonly value: string }[];
  /** Resolved skills from the resolved character — needed for expertise picker. */
  readonly resolvedSkills: ResolvedCharacter['skills'] | null;
  /** All decisions already made across all level rows — for expertise cross-dedup. */
  readonly allDecisions: Readonly<Record<ChoiceKey, ChoiceDecision>>;
}

/** Returns true when a single PendingChoice is satisfied by the given decision map. */
function isChoiceSatisfied(choice: PendingChoice, decisions: ReadonlyMap<ChoiceKey, ChoiceDecision>): boolean {
  const decision = decisions.get(choice.choiceKey);
  switch (choice.type) {
    case 'asi':
      if (decision?.type !== 'asi') return false;
      return Object.values(decision.allocation).reduce((s, v) => s + (v ?? 0), 0) === choice.points;
    case 'feat-choice':
      return decision?.type === 'feat-choice' && decision.featId.length > 0;
    case 'subclass':
      return decision?.type === 'subclass';
    case 'fighting-style-choice':
      return decision?.type === 'fighting-style-choice' && decision.styles.length >= choice.count;
    case 'damage-choice':
      return decision?.type === 'damage-choice' && decision.damageTypes.length >= choice.count;
    case 'weapon-mastery-choice':
      return decision?.type === 'weapon-mastery-choice' && decision.weaponIds.length >= choice.count;
    case 'expertise-choice':
      if (decision?.type !== 'expertise-choice') return false;
      return decision.skills.length + decision.tools.length === choice.count;
    case 'skill-choice':
      return decision?.type === 'skill-choice' && decision.skills.length >= choice.count;
    case 'tool-choice':
      return decision?.type === 'tool-choice' && decision.tools.length >= choice.count;
    case 'language-choice':
      return decision?.type === 'language-choice' && decision.languages.length >= choice.count;
    case 'saving-throw-choice':
      return decision?.type === 'saving-throw-choice' && decision.savingThrows.length >= choice.count;
    case 'ability-choice':
      return decision?.type === 'ability-choice' && decision.abilities.length >= choice.count;
    case 'spell-choice':
      return decision?.type === 'spell-choice' && decision.spellIds.length >= choice.count;
    case 'bundle-choice':
      return decision?.type === 'bundle-choice' && decision.bundleId.length > 0;
    case 'lineage-choice':
      return decision?.type === 'lineage-choice' && decision.lineageId.length > 0;
    case 'feature-choice':
      return decision?.type === 'feature-choice' && decision.optionId.length > 0;
  }
}

export function LevelUpDialog({
  open,
  onOpenChange,
  onConfirm,
  hitDie,
  className,
  targetLevel,
  classId,
  currentSubclassId,
  currentAbilities,
  alreadyChosenStyles,
  resolvedWeaponProficiencies,
  resolvedSkills,
  allDecisions,
}: LevelUpDialogProps) {
  const { t } = useTranslation('common');
  const { t: tg } = useTranslation('gamedata');
  const hpAverageGrant = Math.floor(hitDie / 2) + 1;

  const [rolledValue, setRolledValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [hpSelection, setHpSelection] = useState<number | null>(hpAverageGrant);
  const [decisions, setDecisions] = useState<Map<ChoiceKey, ChoiceDecision>>(new Map());
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    };
  }, []);

  const hpRange = useMemo(() => [1, hitDie] as const, [hitDie]);

  const preview = useMemo(
    () => getGrantsForLevel(classId, targetLevel, currentSubclassId),
    [classId, targetLevel, currentSubclassId]
  );

  // Features to display (not choices)
  const featureGrants = useMemo(() => {
    const allGrants = [...preview.classGrants, ...preview.subclassGrants];
    return allGrants.filter((g): g is FeatureGrant => g.type === 'feature');
  }, [preview]);

  // Source tag for this level's grants
  const source: SourceTag = useMemo(
    () => ({ origin: 'class', id: classId, level: targetLevel }),
    [classId, targetLevel]
  );

  // Collect ALL choice-producing grants for this level.
  // Do NOT pass choices/decisions — we want both ASI and companion feat-choice to always appear
  // so AsiOrFeatPicker can offer both options; either-or is enforced by the picker + gate.
  const levelChoices = useMemo(
    () =>
      collectChoiceGrantsFromGrants([...preview.classGrants, ...preview.subclassGrants], source, {
        resolvedWeaponProficiencies: resolvedWeaponProficiencies,
        alreadyClaimedMasteries: new Set(),
        allChosenStyles: [...alreadyChosenStyles],
      }),
    [preview, source, resolvedWeaponProficiencies, alreadyChosenStyles]
  );

  // Pair each ASI choice with its companion feat-choice (same origin/id/index, different category)
  const { asiOrFeatPairs, standaloneChoices } = useMemo(() => {
    const pairs: Array<{
      asiChoice: Extract<PendingChoice, { type: 'asi' }>;
      featChoice: Extract<PendingChoice, { type: 'feat-choice' }>;
    }> = [];
    const pairedFeatKeys = new Set<ChoiceKey>();

    const asiChoices = levelChoices.filter((c): c is Extract<PendingChoice, { type: 'asi' }> => c.type === 'asi');
    const featChoices = levelChoices.filter(
      (c): c is Extract<PendingChoice, { type: 'feat-choice' }> => c.type === 'feat-choice'
    );

    for (const asi of asiChoices) {
      const parsedAsi = parseChoiceKey(asi.choiceKey);
      const companion = featChoices.find((fc) => {
        const p = parseChoiceKey(fc.choiceKey);
        return p.origin === parsedAsi.origin && p.id === parsedAsi.id && p.index === parsedAsi.index;
      });
      if (companion) {
        pairs.push({ asiChoice: asi, featChoice: companion });
        pairedFeatKeys.add(companion.choiceKey);
      }
    }

    // Standalone choices = everything that is NOT an asi with a companion,
    // and NOT a paired companion feat-choice
    const standalone = levelChoices.filter((c) => {
      if (c.type === 'asi') return false; // all ASIs handled by pairs
      if (c.type === 'feat-choice' && pairedFeatKeys.has(c.choiceKey)) return false;
      return true;
    });

    return { asiOrFeatPairs: pairs, standaloneChoices: standalone };
  }, [levelChoices]);

  // Gate: all choices made?
  const allChoicesMade = useMemo(() => {
    // Check ASI/feat pairs: exactly one of the pair must be satisfied
    for (const { asiChoice, featChoice } of asiOrFeatPairs) {
      const asiSatisfied = isChoiceSatisfied(asiChoice, decisions);
      const featSatisfied = isChoiceSatisfied(featChoice, decisions);
      if (!asiSatisfied && !featSatisfied) return false;
    }
    // Check all standalone choices
    for (const choice of standaloneChoices) {
      if (!isChoiceSatisfied(choice, decisions)) return false;
    }
    return true;
  }, [asiOrFeatPairs, standaloneChoices, decisions]);

  const canConfirm = hpSelection !== null && allChoicesMade;

  const handleRoll = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);
    setHpSelection(null);

    const finalValue = Math.floor(Math.random() * hitDie) + 1;
    let ticks = 0;
    const totalTicks = 12;

    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    rollIntervalRef.current = setInterval(() => {
      ticks++;
      if (ticks >= totalTicks) {
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
        setRolledValue(finalValue);
        setIsRolling(false);
      }
    }, 60);
  }, [isRolling, hitDie]);

  const handleSelectHp = (value: number) => {
    setHpSelection(value);
  };

  const handleDecide = (key: ChoiceKey, decision: ChoiceDecision) => {
    setDecisions((prev) => {
      const next = new Map(prev);
      next.set(key, decision);
      return next;
    });
  };

  const handleClear = (key: ChoiceKey) => {
    setDecisions((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  };

  const handleConfirm = () => {
    if (hpSelection === null) return;
    onConfirm(hpSelection, decisions);
    resetState();
    onOpenChange(false);
  };

  const resetState = () => {
    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    setRolledValue(null);
    setIsRolling(false);
    setHpSelection(null);
    setDecisions(new Map());
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  };

  // Merged decisions: allDecisions (from prior levels) + local dialog decisions
  const mergedDecisions = useMemo(
    () => ({ ...allDecisions, ...Object.fromEntries(decisions) }),
    [allDecisions, decisions]
  );

  // Expertise keys for ExpertiseChoicePicker
  const expertiseKeys = useMemo(
    () => standaloneChoices.filter((c) => c.type === 'expertise-choice').map((c) => c.choiceKey),
    [standaloneChoices]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t('characterSheet.levelManagement.levelUpTitle', { className, level: targetLevel })}
          </DialogTitle>
        </DialogHeader>

        {/* Features gained */}
        {featureGrants.length > 0 && (
          <div className="space-y-1">
            {featureGrants.map((grant) => (
              <div key={grant.feature.id} className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">
                  {tg(`features.${grant.feature.id}.name`, { defaultValue: grant.feature.id })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tg(`features.${grant.feature.id}.description`, { defaultValue: '' })}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* HP selection */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t('characterSheet.levelManagement.hpRollPrompt')}</p>

          <div className="grid grid-cols-2 gap-2">
            {/* Take average option */}
            <div
              className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center ${
                hpSelection === hpAverageGrant ? 'border-primary bg-primary/5' : 'bg-muted/30'
              }`}
            >
              <p className="text-sm font-medium text-foreground">{t('characterSheet.levelManagement.takeAverage')}</p>
              <p className="text-xs text-muted-foreground">
                {t('characterSheet.levelManagement.takeAverageHint', { value: hpAverageGrant })}
              </p>
              <Button
                className="mt-auto"
                variant={hpSelection === hpAverageGrant ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSelectHp(hpAverageGrant)}
              >
                {hpSelection === hpAverageGrant ? t('buttons.selected') : t('buttons.select')}
              </Button>
            </div>
            {/* Roll HP option */}
            <div
              className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center ${
                hpSelection !== null && hpSelection === rolledValue ? 'border-primary bg-primary/5' : 'bg-muted/30'
              }`}
            >
              <p className="text-sm font-medium text-foreground">{t('characterSheet.levelManagement.rollHp')}</p>
              <p className="text-xs text-muted-foreground">
                {t('characterSheet.levelManagement.rollHpHint', { die: hitDie })}
              </p>
              {(isRolling || rolledValue !== null) && (
                <RollingNumber
                  value={rolledValue}
                  isRolling={isRolling}
                  range={hpRange}
                  className="text-lg font-bold text-foreground tabular-nums"
                />
              )}
              <div className="flex flex-row gap-1 mt-auto">
                <Button variant="outline" size="sm" onClick={handleRoll} disabled={isRolling}>
                  <Dices className={`size-4 mr-1 ${isRolling ? 'animate-spin' : ''}`} />
                  {rolledValue !== null && !isRolling
                    ? t('buttons.reRoll')
                    : t('characterSheet.levelManagement.rollHp')}
                </Button>
                {rolledValue !== null && !isRolling && (
                  <Button
                    size="sm"
                    variant={hpSelection === rolledValue ? 'default' : 'outline'}
                    onClick={() => handleSelectHp(rolledValue)}
                  >
                    {hpSelection === rolledValue ? t('buttons.selected') : t('buttons.select')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ASI / feat pairs */}
        {asiOrFeatPairs.map(({ asiChoice, featChoice }) =>
          currentAbilities ? (
            <AsiOrFeatPicker
              key={asiChoice.choiceKey}
              asiChoice={asiChoice}
              featChoice={featChoice}
              abilities={currentAbilities}
              asiDecision={decisions.get(asiChoice.choiceKey)}
              featDecision={decisions.get(featChoice.choiceKey)}
              onDecide={handleDecide}
              onClear={handleClear}
            />
          ) : (
            <p key={asiChoice.choiceKey} className="text-sm text-destructive">
              {t('characterSheet.levelUp.abilitiesUnavailable')}
            </p>
          )
        )}

        {/* All other choice types */}
        {standaloneChoices.map((choice) => {
          const currentDecision = decisions.get(choice.choiceKey);

          if (choice.type === 'subclass') {
            return (
              <SubclassPicker
                key={choice.choiceKey}
                choice={choice}
                currentDecision={currentDecision}
                onDecide={(key, subclassId) => handleDecide(key, { type: 'subclass', subclassId })}
                onClear={handleClear}
                autoCommit
              />
            );
          }

          if (choice.type === 'fighting-style-choice') {
            return (
              <FightingStylePicker
                key={choice.choiceKey}
                choice={choice}
                currentDecision={currentDecision}
                onDecide={handleDecide}
                onClear={handleClear}
              />
            );
          }

          if (choice.type === 'damage-choice') {
            return (
              <DamageTypePicker
                key={choice.choiceKey}
                choice={choice}
                currentDecision={currentDecision}
                onDecide={handleDecide}
                onClear={handleClear}
              />
            );
          }

          if (choice.type === 'expertise-choice') {
            return (
              <ExpertiseChoicePicker
                key={choice.choiceKey}
                choice={choice}
                currentDecision={currentDecision}
                allDecisions={mergedDecisions}
                allExpertiseChoiceKeys={expertiseKeys}
                resolvedSkills={resolvedSkills ?? ({} as ResolvedCharacter['skills'])}
                onDecide={handleDecide}
                onClear={handleClear}
              />
            );
          }

          // Everything else (skill/tool/language/saving-throw/ability/bundle/lineage/feat/feature/weapon-mastery/spell)
          return (
            <ChoicePicker
              key={choice.choiceKey}
              choice={choice}
              currentDecision={currentDecision}
              onDecide={handleDecide}
              onClear={handleClear}
            />
          );
        })}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            {t('buttons.cancel')}
          </Button>
          <Button disabled={!canConfirm} onClick={handleConfirm}>
            {t('characterSheet.levelManagement.confirmLevelUp')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
