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
  DND_ALIGNMENTS,
  DND_BACKGROUNDS,
  DND_CLASSES,
  DND_RACE_GROUPS,
  DND_RACES,
  generateCharacterName,
  type DndGender,
} from '@/lib/dnd-helpers'
import { Wand2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CharacterData } from './types'

interface BasicsStepProps {
  characterType: CharacterData['character_type']
  name: string
  playerName: string
  race: string
  characterClass: string
  background: string
  customBackground: string
  alignment: string
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
  const { data: playerNames = [], isError: playerNamesError } = usePlayerNames()

  return (
    <div className="space-y-6">
      {/* Character Type Switch + Level display */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <span className={`text-sm font-semibold ${characterType === 'pc' ? 'text-foreground' : 'text-muted-foreground'}`}>PC</span>
          <Switch
            checked={characterType === 'npc'}
            onCheckedChange={(checked: boolean) =>
              onChange({
                character_type: checked ? 'npc' : 'pc',
                player_name: checked ? '' : playerName,
              })
            }
          />
          <span className={`text-sm font-semibold ${characterType === 'npc' ? 'text-foreground' : 'text-muted-foreground'}`}>NPC</span>
        </label>
        <span className="text-sm text-muted-foreground">
          Level <span className="font-bold text-foreground text-lg">{level}</span>
        </span>
      </div>

      {/* Gender selector */}
      <div className="space-y-2">
        <Label>
          Gender
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
            Character Name
            <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="character-name"
              value={name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Enter character name"
              className={fieldErrors.name ? 'border-destructive' : ''}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!race || !gender}
              title={!race || !gender ? 'Select race and gender first' : 'Generate random name'}
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
            <Label htmlFor="player-name">Player Name</Label>
            <AutocompleteInput
              id="player-name"
              suggestions={playerNames}
              value={playerName}
              onChange={(value) => onChange({ player_name: value })}
              placeholder="Enter player name"
            />
            {playerNamesError && (
              <p className="text-xs text-destructive">Could not load player name suggestions</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              Race
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={race || null}
              onValueChange={(value) => value && onChange({ race: value })}
              items={DND_RACES.map((r) => ({ value: r.id, label: t(`races.${r.id}` as never) }))}
            >
              <SelectTrigger className={`w-full ${fieldErrors.race ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Choose a race" />
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
                          {t(`races.${raceItem.id}` as never)}
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
              Class
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={characterClass || null}
              onValueChange={(value) => value && onChange({ class: value })}
              items={DND_CLASSES.map((c) => ({ value: c.id, label: t(`classes.${c.id}` as never) }))}
            >
              <SelectTrigger className={`w-full ${fieldErrors.class ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Choose a class" />
              </SelectTrigger>
              <SelectContent>
                {DND_CLASSES.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {t(`classes.${cls.id}` as never)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Background</Label>
            <Select
              value={background || null}
              onValueChange={(value) => value && onChange({ background: value })}
              items={DND_BACKGROUNDS.map((b) => ({ value: b.id, label: t(`backgrounds.${b.id}` as never, { defaultValue: b.id }) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a background" />
              </SelectTrigger>
              <SelectContent>
                {DND_BACKGROUNDS.map((bg) => (
                  <SelectItem key={bg.id} value={bg.id}>
                    {t(`backgrounds.${bg.id}` as never, { defaultValue: bg.id })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Alignment</Label>
          <div className="grid grid-cols-3 gap-0 rounded-md overflow-hidden border border-border">
            {(['Good', 'Neutral', 'Evil'] as const).map((moral) =>
              (['Lawful', 'Neutral', 'Chaotic'] as const).map((ethic) => {
                const alignmentItem = DND_ALIGNMENTS.find(
                  (a) => a.name === (ethic === 'Neutral' && moral === 'Neutral' ? 'True Neutral' : `${ethic} ${moral}`)
                )
                if (!alignmentItem) {
                  console.warn(`Alignment not found for "${ethic} ${moral}" — check DND_ALIGNMENTS data`)
                  return null
                }
                const isSelected = alignment === alignmentItem.id
                const topLabel = ethic === 'Neutral' && moral === 'Neutral' ? 'True' : ethic
                const bottomLabel = moral
                return (
                  <button
                    key={alignmentItem.id}
                    type="button"
                    title={t(`alignments.${alignmentItem.id}` as never)}
                    onClick={() => onChange({ alignment: alignmentItem.id })}
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
          <Label htmlFor="custom-background">Custom Background</Label>
          <Input
            id="custom-background"
            value={customBackground}
            onChange={(e) => onChange({ custom_background: e.target.value })}
            placeholder="Describe your background briefly"
          />
        </div>
      )}
    </div>
  )
}
