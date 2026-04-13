import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { BadgeCheckIcon } from 'lucide-react'
import { useCharacterContext } from '@/hooks/useCharacterContext'
import { parseChoiceKey, type ChoiceKey } from '@/types/choices'
import {
  DND_LANGUAGE_DATA,
  DND_LANGUAGES,
  DND_TOOL_PROFICIENCIES,
  type BackgroundId,
  type ClassId,
  type FightingStyleId,
  type LanguageId,
  type RaceId,
  type ToolProficiencyId,
} from '@/lib/dnd-helpers'
import { FIGHTING_STYLE_SOURCES } from '@/lib/sources/fighting-styles'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface ChoiceInfo<T> {
  readonly choiceKey: ChoiceKey
  readonly count: number
  readonly from: readonly T[]
}

interface FightingStyleChoiceInfo {
  readonly choiceKey: ChoiceKey
  readonly count: number
  readonly from: readonly FightingStyleId[]
}

export function ProficienciesStep() {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')
  const context = useCharacterContext()
  const { resolved, build, bundles } = context

  function getChoiceSourceName(choiceKey: ChoiceKey): string {
    const { origin, id } = parseChoiceKey(choiceKey)
    switch (origin) {
      case 'race':
        return t(`races.${id as RaceId}`)
      case 'background':
        return t(`backgrounds.${id as BackgroundId}`)
      case 'class':
        return t(`classes.${id as ClassId}`)
    }
  }

  // Scan grant bundles for all language-choice/tool-choice/fighting-style-choice grants
  // and direct language grants
  const { languageChoices, toolChoices, grantedLanguages, fightingStyleChoices } = useMemo(() => {
    const lc: ChoiceInfo<LanguageId>[] = []
    const tc: ChoiceInfo<ToolProficiencyId>[] = []
    const fsc: FightingStyleChoiceInfo[] = []
    const granted = new Set<LanguageId>()
    for (const bundle of bundles) {
      for (const grant of bundle.grants) {
        if (grant.type === 'proficiency' && grant.category === 'language') {
          granted.add(grant.id as LanguageId)
        } else if (grant.type === 'proficiency-choice') {
          if (grant.category === 'language') {
            lc.push({
              choiceKey: grant.key,
              count: grant.count,
              from: (grant.from ?? DND_LANGUAGES) as readonly LanguageId[],
            })
          } else if (grant.category === 'tool') {
            tc.push({
              choiceKey: grant.key,
              count: grant.count,
              from: (grant.from ?? DND_TOOL_PROFICIENCIES.map((t) => t)) as readonly ToolProficiencyId[],
            })
          }
        } else if (grant.type === 'fighting-style-choice') {
          fsc.push({
            choiceKey: grant.key,
            count: grant.count,
            from: grant.from,
          })
        }
      }
    }
    return {
      languageChoices: lc,
      toolChoices: tc,
      grantedLanguages: granted,
      fightingStyleChoices: fsc,
    }
  }, [bundles])

  if (!resolved) {
    return (
      <p className="text-muted-foreground text-sm">
        {tc('characterBuilder.proficiencies.selectClassFirst')}
      </p>
    )
  }

  // Set of language IDs that are eligible for any choice
  const choicePoolLanguages = new Set<LanguageId>()
  for (const lc of languageChoices) {
    for (const id of lc.from) choicePoolLanguages.add(id)
  }

  // Helper to get current selections for a choice
  function getSelectedLanguages(choiceKey: ChoiceKey): readonly LanguageId[] {
    const decision = build?.choices[choiceKey]
    if (decision?.type === 'language-choice') return decision.languages
    return []
  }

  function getSelectedTools(choiceKey: ChoiceKey): readonly ToolProficiencyId[] {
    const decision = build?.choices[choiceKey]
    if (decision?.type === 'tool-choice') return decision.tools
    return []
  }

  function getSelectedFightingStyles(choiceKey: ChoiceKey): readonly FightingStyleId[] {
    const decision = build?.choices[choiceKey]
    if (decision?.type === 'fighting-style-choice') return decision.styles
    return []
  }

  // All languages to display: granted + choice pool (deduplicated)
  const allLanguageIds = new Set<LanguageId>([...grantedLanguages, ...choicePoolLanguages])

  // Build set of tool IDs eligible via any choice
  const choiceToolIds = new Set<ToolProficiencyId>()
  for (const tc of toolChoices) {
    for (const id of tc.from) choiceToolIds.add(id)
  }

  function renderLanguageRow(lang: (typeof DND_LANGUAGE_DATA)[number]) {
    const langId = lang.id as LanguageId
    const isGranted = grantedLanguages.has(langId)
    // All choices this language is eligible for (could be multiple: e.g. Human race + Soldier background)
    const eligibleChoices = languageChoices.filter((lc) => lc.from.includes(langId))

    // Which choice, if any, currently holds this language
    const choiceHoldingLang = eligibleChoices.find((lc) =>
      getSelectedLanguages(lc.choiceKey).includes(langId),
    )
    // First eligible choice that still has room — target for a new check
    const choiceWithRoom = eligibleChoices.find(
      (lc) => getSelectedLanguages(lc.choiceKey).length < lc.count,
    )

    let checkbox: React.ReactNode = null
    if (isGranted) {
      checkbox = (
        <BadgeCheckIcon
          aria-label={tc('characterBuilder.proficiencies.grantedByRace')}
          className="flex size-4 shrink-0 text-primary"
        />
      )
    } else if (eligibleChoices.length > 0) {
      const isSelected = choiceHoldingLang !== undefined
      // Disable when nothing is checked AND no choice has room (every eligible choice is already at max)
      const isDisabled = !isSelected && choiceWithRoom === undefined

      checkbox = (
        <Checkbox
          id={`lang-${langId}`}
          checked={isSelected}
          disabled={isDisabled}
          onCheckedChange={(checked) => {
            if (checked) {
              // Route to the first eligible choice with room
              const target = choiceWithRoom
              if (!target) return
              const current = getSelectedLanguages(target.choiceKey)
              context.makeChoice(target.choiceKey, {
                type: 'language-choice',
                languages: [...current, langId],
              })
            } else {
              // Remove from whichever choice currently holds it
              const target = choiceHoldingLang
              if (!target) return
              const current = getSelectedLanguages(target.choiceKey)
              const next = current.filter((id) => id !== langId)
              if (next.length === 0) {
                context.clearChoice(target.choiceKey)
              } else {
                context.makeChoice(target.choiceKey, { type: 'language-choice', languages: next })
              }
            }
          }}
        />
      )
    }

    const speakersText = lang.typicalSpeakers.length > 0
      ? lang.typicalSpeakers.map((s) => t(`creatureTypes.${s}`)).join(', ')
      : '—'
    const scriptText = lang.script ? t(`languageScripts.${lang.script}`) : '—'

    const hasChoiceAffordance = eligibleChoices.length > 0 && !isGranted

    return (
      <tr key={langId} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
        <td className="py-1.5 text-center">{checkbox}</td>
        <td className="py-1.5">
          <label
            htmlFor={hasChoiceAffordance ? `lang-${langId}` : undefined}
            className={hasChoiceAffordance ? 'cursor-pointer' : isGranted ? 'text-muted-foreground' : ''}
          >
            {t(`languages.${langId}`)}
          </label>
        </td>
        <td className="py-1.5 text-muted-foreground">{speakersText}</td>
        <td className="py-1.5 text-muted-foreground">{scriptText}</td>
      </tr>
    )
  }

  const standardLangs = DND_LANGUAGE_DATA.filter((l) => l.category === 'standard' && allLanguageIds.has(l.id as LanguageId))
  const exoticLangs = DND_LANGUAGE_DATA.filter((l) => l.category === 'exotic' && allLanguageIds.has(l.id as LanguageId))

  return (
    <div className="space-y-6">
      {/* Armor / Weapon / Tool Proficiencies (granted) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{tc('characterBuilder.proficiencies.armorProficiencies')}</CardTitle>
          </CardHeader>
          <CardContent>
            {resolved.armorProficiencies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resolved.armorProficiencies.map((sourced) => (
                  <Badge key={sourced.value} variant="secondary" title={sourced.sources[0]?.origin}>
                    {t(`armor.${sourced.value}`)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{tc('characterBuilder.proficiencies.noProficiencies')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{tc('characterBuilder.proficiencies.weaponProficiencies')}</CardTitle>
          </CardHeader>
          <CardContent>
            {resolved.weaponProficiencies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resolved.weaponProficiencies.map((sourced) => (
                  <Badge key={sourced.value} variant="secondary" title={sourced.sources[0]?.origin}>
                    {t(`weapons.${sourced.value}`)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{tc('characterBuilder.proficiencies.noProficiencies')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{tc('characterBuilder.proficiencies.toolProficiencies')}</CardTitle>
          </CardHeader>
          <CardContent>
            {resolved.toolProficiencies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resolved.toolProficiencies.map((sourced) => (
                  <Badge key={sourced.value} variant="secondary">
                    {t(`tools.${sourced.value}`)}
                  </Badge>
                ))}
              </div>
            ) : toolChoices.length === 0 ? (
              <p className="text-muted-foreground text-sm">{tc('characterBuilder.proficiencies.noProficiencies')}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Tool choices */}
      {toolChoices.length > 0 && (
        <div>
          {toolChoices.map((tc_choice) => {
          const selected = getSelectedTools(tc_choice.choiceKey)
          const remaining = tc_choice.count - selected.length
          return (
            <div key={tc_choice.choiceKey} className="space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {tc('characterBuilder.pendingChoices.toolChoice', { count: tc_choice.count })}{' '}
                  <span className="text-xs">
                    {tc('characterBuilder.pendingChoices.fromSource', { source: getChoiceSourceName(tc_choice.choiceKey) })}
                  </span>
                </p>
                <Badge variant={remaining === 0 ? 'default' : 'outline'} className="text-xs">
                  {selected.length} / {tc_choice.count}
                </Badge>
              </div>
              <div className="space-y-0.5">
                {tc_choice.from.map((toolId) => {
                  const isSelected = selected.includes(toolId)
                  const atMax = selected.length >= tc_choice.count
                  const isDisabled = atMax && !isSelected
                  return (
                    <div key={toolId} className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={`tool-${toolId}`}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...selected, toolId]
                            : selected.filter((id) => id !== toolId)
                          if (next.length === 0) {
                            context.clearChoice(tc_choice.choiceKey)
                          } else {
                            context.makeChoice(tc_choice.choiceKey, { type: 'tool-choice', tools: next })
                          }
                        }}
                      />
                      <label htmlFor={`tool-${toolId}`} className="flex-1 text-sm cursor-pointer">
                        {t(`tools.${toolId}`)}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        </div>
      )}

      {/* Languages */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{tc('characterBuilder.proficiencies.languages')}</h3>
        {/* Choice headers */}
        {languageChoices.map((lc) => {
          const selected = getSelectedLanguages(lc.choiceKey)
          const remaining = lc.count - selected.length
          return (
            <div key={lc.choiceKey} className="flex items-center gap-2 mb-2">
              <p className="text-sm text-muted-foreground">
                {tc('characterBuilder.pendingChoices.languageChoice', { count: lc.count })}{' '}
                <span className="text-xs">
                  {tc('characterBuilder.pendingChoices.fromSource', { source: getChoiceSourceName(lc.choiceKey) })}
                </span>
              </p>
              <Badge variant={remaining === 0 ? 'default' : 'outline'} className="text-xs">
                {selected.length} / {lc.count}
              </Badge>
              {remaining > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({remaining} {tc('characterBuilder.pendingChoices.remaining')})
                </span>
              )}
            </div>
          )
        })}
        {allLanguageIds.size > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-1.5 w-8" />
                <th className="py-1.5">{tc('characterBuilder.proficiencies.languageName')}</th>
                <th className="py-1.5">{tc('characterBuilder.proficiencies.typicalSpeakers')}</th>
                <th className="py-1.5">{tc('characterBuilder.proficiencies.script')}</th>
              </tr>
            </thead>
            <tbody>
              {standardLangs.length > 0 && (
                <>
                  <tr>
                    <th colSpan={4} className="pt-3 pb-1 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('languageCategories.standard')}
                    </th>
                  </tr>
                  {standardLangs.map(renderLanguageRow)}
                </>
              )}
              {exoticLangs.length > 0 && (
                <>
                  <tr>
                    <th colSpan={4} className="pt-3 pb-1 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('languageCategories.exotic')}
                    </th>
                  </tr>
                  {exoticLangs.map(renderLanguageRow)}
                </>
              )}
            </tbody>
          </table>
        ) : (
          <p className="text-muted-foreground text-sm">{tc('characterBuilder.proficiencies.selectRaceFirst')}</p>
        )}
      </div>

      {/* Fighting Styles */}
      {fightingStyleChoices.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">{tc('characterBuilder.proficiencies.fightingStyles')}</h3>
          {fightingStyleChoices.map((fsc) => {
            const selected = getSelectedFightingStyles(fsc.choiceKey)
            const remaining = fsc.count - selected.length
            return (
              <div key={fsc.choiceKey} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm text-muted-foreground">
                    {tc('characterBuilder.pendingChoices.fightingStyleChoice', { count: fsc.count })}{' '}
                    <span className="text-xs">
                      {tc('characterBuilder.pendingChoices.fromSource', { source: getChoiceSourceName(fsc.choiceKey) })}
                    </span>
                  </p>
                  <Badge variant={remaining === 0 ? 'default' : 'outline'} className="text-xs">
                    {selected.length} / {fsc.count}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {fsc.from.map((styleId) => {
                    const styleSource = FIGHTING_STYLE_SOURCES.find((s) => s.id === styleId)
                    if (!styleSource) return null
                    const isSelected = selected.includes(styleId)
                    const radioId = `fighting-style-${fsc.choiceKey}-${styleId}`
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
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
