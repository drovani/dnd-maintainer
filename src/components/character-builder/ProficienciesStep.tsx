import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { BadgeCheckIcon } from 'lucide-react'
import { useCharacterContext } from '@/hooks/useCharacterContext'
import type { ChoiceKey } from '@/types/choices'
import {
  DND_LANGUAGE_DATA,
  DND_LANGUAGES,
  DND_TOOL_PROFICIENCIES,
  type LanguageId,
  type ToolProficiencyId,
} from '@/lib/dnd-helpers'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface ChoiceInfo<T> {
  readonly choiceKey: ChoiceKey
  readonly count: number
  readonly from: readonly T[]
}

export function ProficienciesStep() {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')
  const context = useCharacterContext()
  const { resolved, build, bundles } = context

  // Scan grant bundles for all language-choice/tool-choice grants and direct language grants
  const { languageChoices, toolChoices, grantedLanguages } = useMemo(() => {
    const lc: ChoiceInfo<LanguageId>[] = []
    const tc: ChoiceInfo<ToolProficiencyId>[] = []
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
        }
      }
    }
    return { languageChoices: lc, toolChoices: tc, grantedLanguages: granted }
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
    const choiceForLang = languageChoices.find((lc) => lc.from.includes(langId))

    let checkbox: React.ReactNode = null
    if (isGranted) {
      checkbox = (
        <BadgeCheckIcon
          aria-label={tc('characterBuilder.proficiencies.grantedByRace')}
          className="flex size-4 shrink-0 text-primary"
        />
      )
    } else if (choiceForLang) {
      const selected = getSelectedLanguages(choiceForLang.choiceKey)
      const isSelected = selected.includes(langId)
      const atMax = selected.length >= choiceForLang.count
      const isDisabled = atMax && !isSelected

      checkbox = (
        <Checkbox
          id={`lang-${langId}`}
          checked={isSelected}
          disabled={isDisabled}
          onCheckedChange={(checked) => {
            const next = checked
              ? [...selected, langId]
              : selected.filter((id) => id !== langId)
            if (next.length === 0) {
              context.clearChoice(choiceForLang.choiceKey)
            } else {
              context.makeChoice(choiceForLang.choiceKey, { type: 'language-choice', languages: next })
            }
          }}
        />
      )
    }

    const speakersText = lang.typicalSpeakers.length > 0
      ? lang.typicalSpeakers.map((s) => t(`creatureTypes.${s}`)).join(', ')
      : '—'
    const scriptText = lang.script ? t(`languageScripts.${lang.script}`) : '—'

    return (
      <tr key={langId} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
        <td className="py-1.5 text-center">{checkbox}</td>
        <td className="py-1.5">
          <label
            htmlFor={choiceForLang && !isGranted ? `lang-${langId}` : undefined}
            className={choiceForLang && !isGranted ? 'cursor-pointer' : isGranted ? 'text-muted-foreground' : ''}
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
      {/* Armor Proficiencies */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{tc('characterBuilder.proficiencies.armorProficiencies')}</h3>
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
      </div>

      {/* Weapon Proficiencies */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{tc('characterBuilder.proficiencies.weaponProficiencies')}</h3>
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
      </div>

      {/* Tool Proficiencies */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{tc('characterBuilder.proficiencies.toolProficiencies')}</h3>
        {resolved.toolProficiencies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {resolved.toolProficiencies.map((sourced) => (
              <Badge key={sourced.value} variant="secondary">
                {t(`tools.${sourced.value}`)}
              </Badge>
            ))}
          </div>
        )}
        {/* Tool choices */}
        {toolChoices.map((tc_choice) => {
          const selected = getSelectedTools(tc_choice.choiceKey)
          const remaining = tc_choice.count - selected.length
          return (
            <div key={tc_choice.choiceKey} className="space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {tc('characterBuilder.pendingChoices.toolChoice', { count: tc_choice.count })}
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
        {resolved.toolProficiencies.length === 0 && toolChoices.length === 0 && (
          <p className="text-muted-foreground text-sm">{tc('characterBuilder.proficiencies.noProficiencies')}</p>
        )}
      </div>

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
                {tc('characterBuilder.pendingChoices.languageChoice', { count: lc.count })}
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
    </div>
  )
}
