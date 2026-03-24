import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { DND_CLASSES, DND_LANGUAGES, DND_RACES } from '@/lib/dnd-helpers'
import type { ClassId, DndClass, DndRace, LanguageId, RaceId, ToolProficiencyId } from '@/lib/dnd-helpers'
import { useTranslation } from 'react-i18next'
import type { CharacterData } from './types'

interface ProficienciesStepProps {
  characterClass: ClassId | ''
  race: RaceId | ''
  proficiencies: CharacterData['proficiencies']
  onToolChoiceToggle: (tool: ToolProficiencyId) => void
  onLanguageChoiceToggle: (language: LanguageId) => void
}

export function ProficienciesStep({
  characterClass,
  race,
  proficiencies,
  onToolChoiceToggle,
  onLanguageChoiceToggle,
}: ProficienciesStepProps) {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')

  const cls: DndClass | undefined = DND_CLASSES.find((c) => c.id === characterClass)
  if (!cls) {
    return (
      <p className="text-muted-foreground text-sm">
        {tc('characterBuilder.proficiencies.selectClassFirst')}
      </p>
    )
  }

  const raceData: DndRace | undefined = DND_RACES.find((r) => r.id === race)

  const allArmor = proficiencies.armor
  const allWeapons = proficiencies.weapons
  const autoTools = proficiencies.tools
  const autoLanguages = proficiencies.languages

  const toolChoicesMax = cls.toolChoices?.count ?? 0
  const toolChoicesFrom: readonly ToolProficiencyId[] = cls.toolChoices?.from ?? []
  const selectedToolCount = proficiencies.toolChoices.length
  const atToolMax = selectedToolCount >= toolChoicesMax

  const languageChoicesMax = raceData?.languageChoices ?? 0
  const availableLanguages = DND_LANGUAGES.filter(
    (lang) => !autoLanguages.includes(lang)
  )
  const selectedLangCount = proficiencies.languageChoices.length
  const atLangMax = selectedLangCount >= languageChoicesMax

  return (
    <div className="space-y-6">
      {/* Armor Proficiencies */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{tc('characterBuilder.proficiencies.armorProficiencies')}</h3>
        {allArmor.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allArmor.map((armor) => (
              <Badge key={armor} variant="secondary">{t(`armor.${armor}`)}</Badge>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{tc('characterBuilder.proficiencies.noProficiencies')}</p>
        )}
      </div>

      {/* Weapon Proficiencies */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{tc('characterBuilder.proficiencies.weaponProficiencies')}</h3>
        {allWeapons.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allWeapons.map((weapon) => (
              <Badge key={weapon} variant="secondary">{t(`weapons.${weapon}`)}</Badge>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{tc('characterBuilder.proficiencies.noProficiencies')}</p>
        )}
      </div>

      {/* Tool Proficiencies */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{tc('characterBuilder.proficiencies.toolProficiencies')}</h3>
        {autoTools.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {autoTools.map((tool) => (
              <Badge key={tool} variant="secondary">{t(`tools.${tool}`)}</Badge>
            ))}
          </div>
        )}
        {toolChoicesMax > 0 ? (
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm mb-2">
              {tc('characterBuilder.proficiencies.chooseTools', { count: toolChoicesMax })}{' '}
              <span className="font-medium text-foreground">
                {tc('characterBuilder.proficiencies.selected', { count: selectedToolCount, max: toolChoicesMax })}
              </span>
            </p>
            {toolChoicesFrom.map((tool) => {
              const isSelected = proficiencies.toolChoices.includes(tool)
              const isDisabled = atToolMax && !isSelected
              return (
                <div key={tool} className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50">
                  <Checkbox
                    id={`tool-${tool}`}
                    checked={isSelected}
                    onCheckedChange={() => onToolChoiceToggle(tool)}
                    disabled={isDisabled}
                  />
                  <Label htmlFor={`tool-${tool}`} className="flex-1 cursor-pointer">
                    {t(`tools.${tool}`)}
                  </Label>
                </div>
              )
            })}
          </div>
        ) : autoTools.length === 0 ? (
          <p className="text-muted-foreground text-sm">{tc('characterBuilder.proficiencies.noProficiencies')}</p>
        ) : null}
      </div>

      {/* Languages */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{tc('characterBuilder.proficiencies.languages')}</h3>
        {!raceData ? (
          <p className="text-muted-foreground text-sm">{tc('characterBuilder.proficiencies.selectRaceFirst')}</p>
        ) : (
          <>
            {autoLanguages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {autoLanguages.map((lang) => (
                  <Badge key={lang} variant="secondary">{t(`languages.${lang}`)}</Badge>
                ))}
              </div>
            )}
            {languageChoicesMax > 0 && (
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm mb-2">
                  {tc('characterBuilder.proficiencies.chooseLanguages', { count: languageChoicesMax })}{' '}
                  <span className="font-medium text-foreground">
                    {tc('characterBuilder.proficiencies.selected', { count: selectedLangCount, max: languageChoicesMax })}
                  </span>
                </p>
                {availableLanguages.map((lang) => {
                  const isSelected = proficiencies.languageChoices.includes(lang)
                  const isDisabled = atLangMax && !isSelected
                  return (
                    <div key={lang} className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50">
                      <Checkbox
                        id={`lang-${lang}`}
                        checked={isSelected}
                        onCheckedChange={() => onLanguageChoiceToggle(lang)}
                        disabled={isDisabled}
                      />
                      <Label htmlFor={`lang-${lang}`} className="flex-1 cursor-pointer">
                        {t(`languages.${lang}`)}
                      </Label>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
