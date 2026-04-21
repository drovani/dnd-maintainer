import { getLogger } from '@/lib/logger';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { Button } from '@/components/ui/button';
import { GenderToggle } from '@/components/ui/gender-toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { usePlayerNames } from '@/hooks/useCharacters';
import {
  DND_BACKGROUNDS,
  DND_CLASSES,
  DND_RACE_GROUPS,
  DND_RACES,
  generateCharacterName,
  isBackgroundId,
  type AlignmentId,
  type ClassId,
  type DndGender,
  type RaceId,
} from '@/lib/dnd-helpers';
import {
  generateRandomNpcBasicsDetailed,
  getQuickNpcClassIds,
  type RandomNpcFailure,
} from '@/lib/character-builder/random-npc';
import type { StepType } from '@/types/character-builder';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Dices, Wand2 } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const logger = getLogger('basics-step');

const PENDING_ADVANCE_TIMEOUT_MS = 3000;

// Map [ethic moral] to alignment ID — avoids looking up by .name on D&D data objects
const ALIGNMENT_GRID: Readonly<Record<string, AlignmentId>> = {
  'Lawful Good': 'lg',
  'Neutral Good': 'ng',
  'Chaotic Good': 'cg',
  'Lawful Neutral': 'ln',
  'Neutral Neutral': 'n',
  'Chaotic Neutral': 'cn',
  'Lawful Evil': 'le',
  'Neutral Evil': 'ne',
  'Chaotic Evil': 'ce',
};

interface BasicsStepProps {
  readonly onRequestAdvance?: (targetStep: StepType) => void;
}

export function BasicsStep({ onRequestAdvance }: BasicsStepProps) {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');
  const { data: playerNames = [], isError: playerNamesError } = usePlayerNames();
  const context = useCharacterContext();

  const { character, rows } = context;

  const characterType = character.character_type ?? 'pc';
  const name = character.name ?? '';
  const playerName = character.player_name ?? '';
  const race = (character.race ?? '') as RaceId | '';
  const background = character.background ?? '';
  const alignment = character.alignment ?? '';
  const gender = character.gender ?? '';

  // Derive class from level rows (first non-creation row)
  const levelRows = rows.filter((r) => r.sequence !== 0);
  const characterClass = (levelRows[0]?.class_id ?? '') as ClassId | '';
  const level = levelRows.length;

  // Ref-flag + useEffect for post-commit step advance. Refs dodge stale closures
  // and keep onRequestAdvance out of the effect deps (it is a new fn per render).
  const pendingAdvanceRef = useRef<StepType | null>(null);
  const advanceCallbackRef = useRef(onRequestAdvance);
  const watchdogRef = useRef<number | null>(null);

  // useLayoutEffect runs before useEffect in the same commit, so the ref is
  // updated before the step-advance effect reads it.
  useLayoutEffect(() => {
    advanceCallbackRef.current = onRequestAdvance;
  });

  const clearWatchdog = () => {
    if (watchdogRef.current !== null) {
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  };

  useEffect(() => () => clearWatchdog(), []);

  useEffect(() => {
    const target = pendingAdvanceRef.current;
    if (!target) return;
    const basicsReady = !!character.name && !!character.race && !!character.class && !!character.alignment;
    if (!basicsReady) return;
    // If targeting 'skills', also wait until base_abilities have committed.
    if (target === 'skills') {
      const creation = rows.find((r) => r.sequence === 0);
      const hasAbilities =
        !!creation?.base_abilities &&
        Object.values(creation.base_abilities).every((v) => typeof v === 'number' && v > 0);
      if (!hasAbilities) return;
    }
    pendingAdvanceRef.current = null;
    clearWatchdog();
    advanceCallbackRef.current?.(target);
  }, [character, rows]);

  const cancelPendingAdvance = () => {
    pendingAdvanceRef.current = null;
    clearWatchdog();
  };

  const handleRaceChange = (value: RaceId) => {
    cancelPendingAdvance();
    context.updateCharacter({ race: value });
  };

  const handleClassChange = (value: ClassId) => {
    cancelPendingAdvance();
    if (levelRows.length === 0) {
      // First time selecting a class — add level 1 row
      context.levelUp(value, null);
    } else if (levelRows[0]?.class_id !== value) {
      // Class changed — atomically swap the class in the existing row
      context.replaceLevel(levelRows[0].sequence, value, null);
    }
    // Keep character.class in sync for pre-calculated column and hasRequiredFields check
    // levelUp adds a row, replaceLevel swaps in-place — either way, level is at least 1
    const newLevel = levelRows.length === 0 ? 1 : levelRows.length;
    context.updateCharacter({ class: value, level: newLevel });
  };

  const handleBackgroundChange = (value: string) => {
    cancelPendingAdvance();
    context.updateCharacter({ background: value });
  };

  const toastForFailure = (failure: RandomNpcFailure | null) => {
    if (failure === 'unknown-class') {
      toast.error(tc('characterBuilder.hints.quickNpcUnknownClass'));
      return;
    }
    if (failure === 'empty-data-source') {
      toast.error(tc('characterBuilder.hints.quickNpcEmptyDataSource'));
      return;
    }
    toast.error(tc('characterBuilder.hints.quickNpcFailed'));
  };

  const [pendingOverwriteClassId, setPendingOverwriteClassId] = useState<ClassId | null>(null);

  const hasUserEnteredData = (): boolean =>
    !!character.name ||
    !!character.race ||
    !!character.alignment ||
    !!character.background ||
    !!character.gender ||
    !!character.player_name ||
    levelRows.length > 0;

  const commitQuickNpc = (classId: ClassId) => {
    const result = generateRandomNpcBasicsDetailed(classId);
    if (!result.ok) {
      toastForFailure(result.failure);
      return;
    }
    const basics = result.basics;
    // Full commit is wrapped: if any step throws, we rollback ref state and
    // surface the error. Callers of levelUp/replaceLevel already mutate before
    // throwing, but a throw in updateCharacter/updateCreation would otherwise
    // leave the form half-applied with no user feedback.
    try {
      if (levelRows.length === 0) {
        context.levelUp(classId, null);
      } else {
        context.replaceLevel(levelRows[0].sequence, classId, null);
      }
      context.updateCharacter({
        character_type: 'npc',
        player_name: '',
        gender: basics.gender,
        race: basics.race,
        alignment: basics.alignment,
        name: basics.name,
        class: classId,
        level: 1,
        ...(basics.targetStep === 'skills' ? { background: basics.suggestedBackground } : {}),
      });
      if (basics.targetStep === 'skills') {
        context.updateCreation({ base_abilities: basics.baseAbilities });
      }
    } catch (err) {
      pendingAdvanceRef.current = null;
      clearWatchdog();
      logger.error('Quick NPC commit failed', err);
      toast.error(tc('characterBuilder.hints.quickNpcCommitFailed'));
      return;
    }
    // Arm the advance flag and a watchdog. If the basics-ready gate never
    // settles (e.g. a reducer drops a field), the watchdog clears the ref and
    // warns the user rather than leaving the flow silently stuck.
    pendingAdvanceRef.current = basics.targetStep;
    clearWatchdog();
    watchdogRef.current = window.setTimeout(() => {
      if (pendingAdvanceRef.current === null) return;
      pendingAdvanceRef.current = null;
      watchdogRef.current = null;
      logger.error('Quick NPC advance watchdog fired', { classId, basics });
      toast.error(tc('characterBuilder.hints.quickNpcAdvanceTimeout'));
    }, PENDING_ADVANCE_TIMEOUT_MS);
  };

  const handleQuickNpc = (classId: ClassId) => {
    if (hasUserEnteredData()) {
      setPendingOverwriteClassId(classId);
      return;
    }
    commitQuickNpc(classId);
  };

  const handleOverwriteConfirm = () => {
    const classId = pendingOverwriteClassId;
    setPendingOverwriteClassId(null);
    if (classId) commitQuickNpc(classId);
  };

  return (
    <div className="space-y-6">
      {/* Quick Random NPC buttons */}
      <div className="space-y-2">
        <Label>{tc('characterBuilder.fields.quickNpcLabel')}</Label>
        <p className="text-xs text-muted-foreground">{tc('characterBuilder.hints.quickNpcDescription')}</p>
        <div className="flex flex-wrap gap-2">
          {getQuickNpcClassIds().map((classId) => (
            <Button key={classId} type="button" variant="outline" size="sm" onClick={() => handleQuickNpc(classId)}>
              <Dices className="size-4" />
              {tc('characterBuilder.hints.quickNpcButton', { class: t(`classes.${classId}`) })}
            </Button>
          ))}
        </div>
      </div>

      {/* Character Type Switch + Level display */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <span
            className={`text-sm font-semibold ${characterType === 'pc' ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            {tc('characterType.pc')}
          </span>
          <Switch
            checked={characterType === 'npc'}
            onCheckedChange={(checked: boolean) => {
              cancelPendingAdvance();
              context.updateCharacter({
                character_type: checked ? 'npc' : 'pc',
                player_name: checked ? '' : playerName,
              });
            }}
          />
          <span
            className={`text-sm font-semibold ${characterType === 'npc' ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            {tc('characterType.npc')}
          </span>
        </label>
        <span className="text-sm text-muted-foreground">
          {tc('characterBuilder.fields.level')} <span className="font-bold text-foreground text-lg">{level}</span>
        </span>
      </div>

      {/* Gender selector */}
      <div className="space-y-2">
        <Label>{tc('characterBuilder.fields.gender')}</Label>
        <GenderToggle
          value={gender as DndGender | ''}
          onChange={(g) => {
            cancelPendingAdvance();
            context.updateCharacter({ gender: g });
          }}
        />
      </div>

      {/* Name row */}
      <div className={`grid grid-cols-1 ${characterType === 'pc' ? 'md:grid-cols-2' : ''} gap-4`}>
        <div className="space-y-2">
          <Label htmlFor="character-name">
            {tc('characterBuilder.fields.characterName')}
            <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="character-name"
              value={name}
              onChange={(e) => {
                cancelPendingAdvance();
                context.updateCharacter({ name: e.target.value });
              }}
              placeholder={tc('characterBuilder.placeholders.enterCharacterName')}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!race || !gender}
              title={
                !race || !gender
                  ? tc('characterBuilder.hints.selectRaceAndGender')
                  : tc('characterBuilder.hints.generateRandomName')
              }
              onClick={() => {
                if (!race || !gender) return;
                const generatedName = generateCharacterName(race, gender as DndGender);
                if (generatedName) context.updateCharacter({ name: generatedName });
              }}
            >
              <Wand2 className="size-4" />
            </Button>
          </div>
        </div>

        {characterType === 'pc' && (
          <div className="space-y-2">
            <Label htmlFor="player-name">{tc('characterBuilder.fields.playerName')}</Label>
            <AutocompleteInput
              id="player-name"
              suggestions={playerNames}
              value={playerName}
              onChange={(value) => context.updateCharacter({ player_name: value })}
              placeholder={tc('characterBuilder.placeholders.enterPlayerName')}
            />
            {playerNamesError && (
              <p className="text-xs text-destructive">{tc('characterBuilder.hints.couldNotLoadPlayerNames')}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              {tc('characterBuilder.fields.race')}
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={race || null}
              onValueChange={(value) => value && handleRaceChange(value as RaceId)}
              items={DND_RACES.map((r) => ({ value: r.id, label: t(`races.${r.id}`) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tc('characterBuilder.placeholders.chooseRace')} />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {DND_RACE_GROUPS.map((group) => (
                  <SelectGroup key={group.id}>
                    {group.options.length > 1 && <SelectLabel>{t(`races.${group.id}`)}</SelectLabel>}
                    {group.options.map((option) => {
                      const raceItem = DND_RACES.find((r) => r.id === option.value);
                      if (!raceItem) {
                        logger.warn(`Race not found for "${option.value}" — check DND_RACES/DND_RACE_GROUPS data sync`);
                        return null;
                      }
                      return (
                        <SelectItem
                          key={raceItem.id}
                          value={raceItem.id}
                          className={group.options.length > 1 ? 'pl-4' : ''}
                        >
                          {t(`races.${raceItem.id}`)}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {tc('characterBuilder.fields.class')}
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={characterClass || null}
              onValueChange={(value) => value && handleClassChange(value as ClassId)}
              items={DND_CLASSES.map((c) => ({ value: c.id, label: t(`classes.${c.id}`) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tc('characterBuilder.placeholders.chooseClass')} />
              </SelectTrigger>
              <SelectContent>
                {DND_CLASSES.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {t(`classes.${cls.id}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{tc('characterBuilder.fields.background')}</Label>
            {(() => {
              const isCustom = background !== '' && (!isBackgroundId(background) || background === 'custom');
              const dropdownValue = isCustom ? 'custom' : background || null;
              return (
                <>
                  <Select
                    value={dropdownValue}
                    onValueChange={(value) => {
                      if (!value) return;
                      handleBackgroundChange(value);
                    }}
                    items={DND_BACKGROUNDS.map((b) => ({ value: b.id, label: t(`backgrounds.${b.id}`) }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={tc('characterBuilder.placeholders.chooseBackground')} />
                    </SelectTrigger>
                    <SelectContent>
                      {DND_BACKGROUNDS.map((bg) => (
                        <SelectItem key={bg.id} value={bg.id}>
                          {t(`backgrounds.${bg.id}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isCustom && (
                    <Input
                      placeholder={tc('characterBuilder.placeholders.enterCustomBackground')}
                      value={background === 'custom' ? '' : background}
                      onChange={(e) => handleBackgroundChange(e.target.value || 'custom')}
                    />
                  )}
                </>
              );
            })()}
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            {tc('characterBuilder.fields.alignment')} <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-3 gap-0 rounded-md overflow-hidden border border-border">
            {(['good', 'neutral', 'evil'] as const).map((moral) =>
              (['lawful', 'neutral', 'chaotic'] as const).map((ethic) => {
                const gridKey =
                  `${ethic.charAt(0).toUpperCase() + ethic.slice(1)} ${moral.charAt(0).toUpperCase() + moral.slice(1)}` as keyof typeof ALIGNMENT_GRID;
                const alignmentId = ALIGNMENT_GRID[gridKey];
                if (!alignmentId) {
                  logger.warn(`Alignment not found for "${gridKey}" — check ALIGNMENT_GRID mapping`);
                  return null;
                }
                const isSelected = alignment === alignmentId;
                const topLabel =
                  ethic === 'neutral' && moral === 'neutral' ? t('alignmentAxes.true') : t(`alignmentAxes.${ethic}`);
                const bottomLabel = t(`alignmentAxes.${moral}`);
                return (
                  <button
                    key={alignmentId}
                    type="button"
                    title={t(`alignments.${alignmentId}`)}
                    onClick={() => {
                      cancelPendingAdvance();
                      context.updateCharacter({ alignment: alignmentId });
                    }}
                    className={`flex flex-col items-center justify-center border-r border-b border-border px-1 py-1 text-sm transition-colors cursor-pointer last-of-type:border-r-0 nth-[3n]:border-r-0 ${
                      isSelected ? 'bg-primary/10 font-medium' : 'hover:bg-muted/50'
                    }`}
                  >
                    <span className="leading-tight">{topLabel}</span>
                    <span className="leading-tight">{bottomLabel}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {pendingOverwriteClassId && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setPendingOverwriteClassId(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{tc('characterBuilder.hints.quickNpcOverwriteTitle')}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{tc('characterBuilder.hints.quickNpcOverwriteConfirm')}</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingOverwriteClassId(null)}>
                {tc('buttons.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleOverwriteConfirm}>
                <Dices className="size-4" />
                {tc('characterBuilder.hints.quickNpcButton', { class: t(`classes.${pendingOverwriteClassId}`) })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
