import { getLogger } from '@/lib/logger';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GenderToggle } from '@/components/ui/gender-toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { usePlayerNames } from '@/hooks/useCharacters';
import {
  DND_BACKGROUNDS,
  DND_CLASSES,
  DND_SPECIES,
  generateCharacterName,
  type AlignmentId,
  type ClassId,
  type DndGender,
  type SpeciesId,
} from '@/lib/dnd-helpers';
import { SPECIES_SOURCES } from '@/lib/sources/species';
import {
  generateRandomNpcBasicsDetailed,
  getQuickNpcClassIds,
  type RandomNpcFailure,
} from '@/lib/character-builder/random-npc';
import type { StepType } from '@/types/character-builder';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MoreHorizontal, Wand2 } from 'lucide-react';
import { CLASS_ICONS } from '@/lib/class-icons';
import type { BackgroundId } from '@/lib/dnd-helpers';
import {
  backgroundHasLaterChoices,
  classHasLaterChoices,
  speciesHasLaterChoices,
} from '@/lib/character-builder/has-later-choices';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useGameData } from '@/hooks/useGameData';

const logger = getLogger('basics-step');

const PENDING_ADVANCE_TIMEOUT_MS = 3000;

function HasLaterChoicesIcon({ tooltip }: { tooltip: string }) {
  return <MoreHorizontal className="ml-2 inline size-3.5 text-muted-foreground" aria-label={tooltip} />;
}

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
  const { campaignSlug } = useParams<{ campaignSlug: string }>();
  const gameData = useGameData(campaignSlug);
  const { data: playerNames = [], isError: playerNamesError } = usePlayerNames();
  const context = useCharacterContext();

  const { character, rows } = context;

  const characterType = character.character_type ?? 'pc';
  const name = character.name ?? '';
  const playerName = character.player_name ?? '';
  const race = (character.species ?? '') as SpeciesId | '';
  const alignment = character.alignment ?? '';
  const gender = character.gender ?? '';
  const background = character.background ?? '';

  // Derive class from level rows (first non-creation row)
  const levelRows = rows.filter((r) => r.sequence !== 0);
  const characterClass = (levelRows[0]?.class_id ?? '') as ClassId | '';
  const level = levelRows.length;

  // Compute allowed ID sets from gameData, then union with current values for
  // no-data-loss: a selection made when a book was enabled stays visible in the
  // picker even after the book is disabled, but shows a "disabled source book"
  // warning badge so the DM knows to update it.
  const allowedSpeciesIds = new Set(gameData.species.map((s) => s.id));
  const allowedClassIds = new Set(gameData.classes.map((c) => c.id));
  const allowedBackgroundIds = new Set(gameData.backgrounds.map((b) => b.id));

  const filteredSpecies = DND_SPECIES.filter((s) => allowedSpeciesIds.has(s.id) || s.id === race);
  const filteredClasses = DND_CLASSES.filter((c) => allowedClassIds.has(c.id) || c.id === characterClass);
  const filteredBackgrounds = DND_BACKGROUNDS.filter((b) => allowedBackgroundIds.has(b.id) || b.id === background);

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
    const basicsReady = !!character.name && !!character.species && !!character.class && !!character.alignment;
    if (!basicsReady) return;
    // If targeting 'class' (Quick NPC with quickBuild data), also wait until base_abilities have committed.
    if (target === 'class') {
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

  const handleSpeciesChange = (value: SpeciesId) => {
    cancelPendingAdvance();
    context.updateCharacter({ species: value });
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
    !!character.species ||
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
        species: basics.species,
        alignment: basics.alignment,
        name: basics.name,
        class: classId,
        level: 1,
        ...(basics.targetStep === 'class' ? { background: basics.suggestedBackground } : {}),
      });
      const asiDecision = basics.targetStep === 'class' ? basics.backgroundAsiDecision : undefined;
      const choices = {
        ...(asiDecision
          ? {
              [asiDecision.key]: {
                type: 'asi' as const,
                allocation: asiDecision.allocation,
              },
            }
          : {}),
        ...(basics.lineageDecision
          ? {
              [basics.lineageDecision.key]: {
                type: 'lineage-choice' as const,
                lineageId: basics.lineageDecision.lineageId,
              },
            }
          : {}),
      };
      const hasChoices = Object.keys(choices).length > 0;
      if (basics.targetStep === 'class') {
        context.updateCreation({
          base_abilities: basics.baseAbilities,
          ...(hasChoices ? { choices } : {}),
        });
      } else if (hasChoices) {
        context.updateCreation({ choices });
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
          {getQuickNpcClassIds().map((classId) => {
            const Icon = CLASS_ICONS[classId];
            const label = tc('characterBuilder.hints.quickNpcButton', { class: t(`classes.${classId}`) });
            return (
              <Button
                key={classId}
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuickNpc(classId)}
                title={label}
                aria-label={label}
              >
                <Icon className="size-4" />
              </Button>
            );
          })}
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
                  ? tc('characterBuilder.hints.selectSpeciesAndGender')
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
              {tc('characterBuilder.fields.species')}
              <span className="text-destructive">*</span>
            </Label>
            {race && !SPECIES_SOURCES.some((s) => s.id === race) ? (
              <div className="space-y-1">
                <Badge variant="destructive" className="text-xs">
                  {tc('characterBuilder.hints.legacySpecies')}
                </Badge>
                <p className="text-xs text-muted-foreground">{race}</p>
              </div>
            ) : race && !allowedSpeciesIds.has(race) ? (
              <div className="space-y-1">
                <Badge variant="destructive" className="text-xs">
                  {tc('characterBuilder.hints.disabledSourceBook')}
                </Badge>
              </div>
            ) : null}
            <Select
              value={race || null}
              onValueChange={(value) => value && handleSpeciesChange(value as SpeciesId)}
              items={filteredSpecies.map((s) => ({ value: s.id, label: t(`species.${s.id}`) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tc('characterBuilder.placeholders.chooseSpecies')} />
              </SelectTrigger>
              <SelectContent>
                {filteredSpecies.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {t(`species.${s.id}`)}
                    {speciesHasLaterChoices(s.id) && (
                      <HasLaterChoicesIcon tooltip={tc('characterBuilder.hints.hasLaterChoices')} />
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {tc('characterBuilder.fields.class')}
              <span className="text-destructive">*</span>
            </Label>
            {characterClass && !allowedClassIds.has(characterClass) && (
              <div className="space-y-1">
                <Badge variant="destructive" className="text-xs">
                  {tc('characterBuilder.hints.disabledSourceBook')}
                </Badge>
              </div>
            )}
            <Select
              value={characterClass || null}
              onValueChange={(value) => value && handleClassChange(value as ClassId)}
              items={filteredClasses.map((c) => ({ value: c.id, label: t(`classes.${c.id}`) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tc('characterBuilder.placeholders.chooseClass')} />
              </SelectTrigger>
              <SelectContent>
                {filteredClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {t(`classes.${cls.id}`)}
                    {classHasLaterChoices(cls.id) && (
                      <HasLaterChoicesIcon tooltip={tc('characterBuilder.hints.hasLaterChoices')} />
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{tc('characterBuilder.fields.background')}</Label>
            {background && !allowedBackgroundIds.has(background as BackgroundId) && (
              <div className="space-y-1">
                <Badge variant="destructive" className="text-xs">
                  {tc('characterBuilder.hints.disabledSourceBook')}
                </Badge>
              </div>
            )}
            <Select
              value={background || null}
              onValueChange={(value) => value && context.updateCharacter({ background: value })}
              items={filteredBackgrounds.map((b) => ({ value: b.id, label: t(`backgrounds.${b.id}`) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tc('characterBuilder.placeholders.chooseBackground')} />
              </SelectTrigger>
              <SelectContent>
                {filteredBackgrounds.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {t(`backgrounds.${b.id}`)}
                    {backgroundHasLaterChoices(b.id as BackgroundId) && (
                      <HasLaterChoicesIcon tooltip={tc('characterBuilder.hints.hasLaterChoices')} />
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            {tc('characterBuilder.fields.alignment')} <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-3 gap-0 rounded-md overflow-hidden border border-border">
            {/* eslint-disable-next-line react-hooks/refs -- false positive: this render-phase map only reaches refs via the onClick handler (cancelPendingAdvance) below; the ref write lives in the useLayoutEffect above. */}
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
                {pendingOverwriteClassId &&
                  (() => {
                    const Icon = CLASS_ICONS[pendingOverwriteClassId];
                    return <Icon className="size-4" />;
                  })()}
                {tc('characterBuilder.hints.quickNpcButton', { class: t(`classes.${pendingOverwriteClassId}`) })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
