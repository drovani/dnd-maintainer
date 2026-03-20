import { AutocompleteInput } from '@/components/ui/autocomplete-input'
import { Button } from '@/components/ui/button'
import { GenderToggle } from '@/components/ui/gender-toggle'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { usePlayerNames } from '@/hooks/useCharacters'
import {
  DND_BACKGROUNDS,
  DND_CLASSES,
  DND_RACE_GROUPS,
  DND_RACES,
  generateCharacterName,
  type AlignmentId,
  type BackgroundId,
  type ClassId,
  type DndGender,
  type RaceId,
} from '@/lib/dnd-helpers'
import { Wand2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CharacterData } from './types'

// Map [ethic moral] to alignment ID — avoids looking up by .name on D&D data objects
const ALIGNMENT_GRID: Readonly<Record<string, AlignmentId>> = {
  'Lawful Good': 'lg', 'Neutral Good': 'ng', 'Chaotic Good': 'cg',
  'Lawful Neutral': 'ln', 'Neutral Neutral': 'n', 'Chaotic Neutral': 'cn',
  'Lawful Evil': 'le', 'Neutral Evil': 'ne', 'Chaotic Evil': 'ce',
}

interface BasicsStepProps {
  characterType: CharacterData['character_type']
  name: string
  playerName: string
  race: CharacterData['race']
  characterClass: CharacterData['class']
  background: CharacterData['background']
  customBackground: string
  alignment: CharacterData['alignment']
  level: number
  gender: CharacterData['gender']
  fieldErrors: Partial<Record<'name' | 'race' | 'class' | 'gender', boolean>>
  onChange: (updates: Partial<Pick<CharacterData, 'character_type' | 'player_name' | 'name' | 'race' | 'class' | 'background' | 'custom_background' | 'alignment' | 'level' | 'gender'>>) => void
}

export function BasicsStep({
  characterType,
  name,
  playerName,
  race,
  characterClass,
  background,
  customBackground,
  alignment,
  level,
  gender,
  fieldErrors,
  onChange,
}: BasicsStepProps) {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')
  const { data: playerNames = [], isError: playerNamesError } = usePlayerNames()

  return (
    <div className="space-y-6">
      {/* Character Type Switch + Level display */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <span className={`text-sm font-semibold ${characterType === 'pc' ? 'text-foreground' : 'text-muted-foreground'}`}>{tc('characterType.pc')}</span>
          <Switch
            checked={characterType === 'npc'}
            onCheckedChange={(checked: boolean) =>
              onChange({
                character_type: checked ? 'npc' : 'pc',
                player_name: checked ? '' : playerName,
              })
            }
          />
          <span className={`text-sm font-semibold ${characterType === 'npc' ? 'text-foreground' : 'text-muted-foreground'}`}>{tc('characterType.npc')}</span>
        </label>
        <span className="text-sm text-muted-foreground">
          {tc('characterBuilder.fields.level')} <span className="font-bold text-foreground text-lg">{level}</span>
        </span>
      </div>

      {/* Gender selector */}
      <div className="space-y-2">
        <Label>
          {tc('characterBuilder.fields.gender')}
          <span className="text-destructive">*</span>
        </Label>
        <GenderToggle
          value={gender}
          onChange={(g) => onChange({ gender: g })}
          error={fieldErrors.gender}
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
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder={tc('characterBuilder.placeholders.enterCharacterName')}
              className={fieldErrors.name ? 'border-destructive' : ''}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!race || !gender}
              title={!race || !gender ? tc('characterBuilder.hints.selectRaceAndGender') : tc('characterBuilder.hints.generateRandomName')}
              onClick={() => {
                if (!race || !gender) return;
                const generatedName = generateCharacterName(race, gender as DndGender);
                if (generatedName) onChange({ name: generatedName });
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
              onChange={(value) => onChange({ player_name: value })}
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
              onValueChange={(value) => value && onChange({ race: value as RaceId })}
              items={DND_RACES.map((r) => ({ value: r.id, label: t(`races.${r.id}`) }))}
            >
              <SelectTrigger className={`w-full ${fieldErrors.race ? 'border-destructive' : ''}`}>
                <SelectValue placeholder={tc('characterBuilder.placeholders.chooseRace')} />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {DND_RACE_GROUPS.map((group) => (
                  <SelectGroup key={group.id}>
                    {group.options.length > 1 && <SelectLabel>{t(`raceGroups.${group.id}` as never)}</SelectLabel>}
                    {group.options.map((option) => {
                      const raceItem = DND_RACES.find((r) => r.id === option.value)
                      if (!raceItem) {
                        console.warn(`Race not found for "${option.label}" — check DND_RACES/DND_RACE_GROUPS data sync`)
                        return null
                      }
                      return (
                        <SelectItem key={raceItem.id} value={raceItem.id} className={group.options.length > 1 ? 'pl-4' : ''}>
                          {t(`races.${raceItem.id}`)}
                        </SelectItem>
                      )
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
              onValueChange={(value) => value && onChange({ class: value as ClassId })}
              items={DND_CLASSES.map((c) => ({ value: c.id, label: t(`classes.${c.id}`) }))}
            >
              <SelectTrigger className={`w-full ${fieldErrors.class ? 'border-destructive' : ''}`}>
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
            <Select
              value={background || null}
              onValueChange={(value) => value && onChange({ background: value as BackgroundId })}
              items={DND_BACKGROUNDS.map((b) => ({ value: b.id, label: t(`backgrounds.${b.id}`, { defaultValue: b.id }) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tc('characterBuilder.placeholders.chooseBackground')} />
              </SelectTrigger>
              <SelectContent>
                {DND_BACKGROUNDS.map((bg) => (
                  <SelectItem key={bg.id} value={bg.id}>
                    {t(`backgrounds.${bg.id}`, { defaultValue: bg.id })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{tc('characterBuilder.fields.alignment')}</Label>
          <div className="grid grid-cols-3 gap-0 rounded-md overflow-hidden border border-border">
            {(['Good', 'Neutral', 'Evil'] as const).map((moral) =>
              (['Lawful', 'Neutral', 'Chaotic'] as const).map((ethic) => {
                const alignmentId = ALIGNMENT_GRID[`${ethic} ${moral}`]
                if (!alignmentId) {
                  console.warn(`Alignment not found for "${ethic} ${moral}" — check ALIGNMENT_GRID mapping`)
                  return null
                }
                const isSelected = alignment === alignmentId
                const topLabel = ethic === 'Neutral' && moral === 'Neutral' ? 'True' : ethic
                const bottomLabel = moral
                return (
                  <button
                    key={alignmentId}
                    type="button"
                    title={t(`alignments.${alignmentId}`)}
                    onClick={() => onChange({ alignment: alignmentId })}
                    className={`flex flex-col items-center justify-center border-r border-b border-border px-1 py-1 text-sm transition-colors cursor-pointer last-of-type:border-r-0 nth-[3n]:border-r-0 ${isSelected
                      ? 'bg-primary/10 font-medium'
                      : 'hover:bg-muted/50'
                      }`}
                  >
                    <span className="leading-tight">{topLabel}</span>
                    <span className="leading-tight">{bottomLabel}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {background === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="custom-background">{tc('characterBuilder.fields.customBackground')}</Label>
          <Input
            id="custom-background"
            value={customBackground}
            onChange={(e) => onChange({ custom_background: e.target.value })}
            placeholder={tc('characterBuilder.placeholders.describeBackground')}
          />
        </div>
      )}
    </div>
  )
}
