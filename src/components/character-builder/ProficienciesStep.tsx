import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { ClassId, DndClass, DndLanguage, DndRace, LanguageCategory, LanguageId, RaceId, ToolProficiencyId } from '@/lib/dnd-helpers'
import { DND_CLASSES, DND_LANGUAGE_DATA, DND_RACES, rollRandomLanguage } from '@/lib/dnd-helpers'
import { Dices } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CharacterData } from './types'

interface ProficienciesStepProps {
  characterClass: ClassId | ''
  race: RaceId | ''
  proficiencies: CharacterData['proficiencies']
  onToolChoiceToggle: (tool: ToolProficiencyId) => void
  onLanguageChoiceToggle: (language: LanguageId) => void
  onLanguageRandomize: (languages: LanguageId[]) => void
}

export function ProficienciesStep({
  characterClass,
  race,
  proficiencies,
  onToolChoiceToggle,
  onLanguageChoiceToggle,
  onLanguageRandomize,
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
  const availableLanguages: readonly DndLanguage[] = DND_LANGUAGE_DATA.filter(
    (lang) => !autoLanguages.includes(lang.id)
  )
  const selectedLangCount = proficiencies.languageChoices.length
  const atLangMax = selectedLangCount >= languageChoicesMax

  const sortedByName = (langs: readonly DndLanguage[]): DndLanguage[] =>
    [...langs].sort((a, b) => t(`languages.${a.id}`).localeCompare(t(`languages.${b.id}`)))

  const languagesByCategory = (category: LanguageCategory): DndLanguage[] =>
    sortedByName(availableLanguages.filter((l) => l.category === category))

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
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <p className="text-muted-foreground text-sm">
                    {tc('characterBuilder.proficiencies.chooseLanguages', { count: languageChoicesMax })}{' '}
                    <span className="font-medium text-foreground">
                      {tc('characterBuilder.proficiencies.selected', { count: selectedLangCount, max: languageChoicesMax })}
                    </span>
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title={tc('characterBuilder.proficiencies.randomizeLanguage')}
                    onClick={() => {
                      const exclude = [...autoLanguages]
                      const rolled: LanguageId[] = []
                      for (let i = 0; i < languageChoicesMax; i++) {
                        const lang = rollRandomLanguage([...exclude, ...rolled])
                        if (lang) rolled.push(lang)
                      }
                      if (rolled.length > 0) onLanguageRandomize(rolled)
                    }}
                  >
                    <Dices className="size-4 mr-1.5" />
                    {tc('characterBuilder.proficiencies.randomizeLanguage')}
                  </Button>
                </div>
                <table className="text-sm [&>tbody:not(:first-child)>tr:first-child>th]:pt-5">
                  {(['standard', 'exotic'] as const).map((category) => {
                    const langs = languagesByCategory(category)
                    if (langs.length === 0) return null
                    return (
                      <tbody key={category}>
                        <tr>
                          <th colSpan={2} className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground pb-2 pt-1 pr-6">
                            {t(`languageCategories.${category}`)}
                          </th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground pb-2 pt-1 pr-6">
                            {tc('characterBuilder.proficiencies.typicalSpeakers')}
                          </th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground pb-2 pt-1">
                            {tc('characterBuilder.proficiencies.script')}
                          </th>
                        </tr>
                        {langs.map((lang) => {
                          const isSelected = proficiencies.languageChoices.includes(lang.id)
                          const isDisabled = atLangMax && !isSelected
                          return (
                            <tr key={lang.id} className="transition-colors hover:bg-muted/50">
                              <td className="py-1.5 pl-2 pr-2">
                                <Checkbox
                                  id={`lang-${lang.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() => onLanguageChoiceToggle(lang.id)}
                                  disabled={isDisabled}
                                />
                              </td>
                              <td className="py-1.5 pr-6 whitespace-nowrap">
                                <Label htmlFor={`lang-${lang.id}`} className="cursor-pointer">
                                  {t(`languages.${lang.id}`)}
                                </Label>
                              </td>
                              <td className="py-1.5 pr-6 text-muted-foreground whitespace-nowrap">
                                {t(`languageSpeakers.${lang.id}`)}
                              </td>
                              <td className="py-1.5 text-muted-foreground whitespace-nowrap">
                                {lang.script
                                  ? t(`languageScripts.${lang.script}`)
                                  : tc('characterBuilder.proficiencies.noScript')}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    )
                  })}
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
