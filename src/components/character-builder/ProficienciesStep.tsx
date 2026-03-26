import { Badge } from '@/components/ui/badge'
import { useCharacterContext } from '@/hooks/useCharacterContext'
import { useTranslation } from 'react-i18next'
import { ChoicePicker } from './ChoicePicker'
import type { ChoiceDecision } from '@/types/choices'

export function ProficienciesStep() {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')
  const context = useCharacterContext()
  const { resolved } = context

  if (!resolved) {
    return (
      <p className="text-muted-foreground text-sm">
        {tc('characterBuilder.proficiencies.selectClassFirst')}
      </p>
    )
  }

  const languageChoices = resolved.pendingChoices.filter((c) => c.type === 'language-choice')
  const toolChoices = resolved.pendingChoices.filter((c) => c.type === 'tool-choice')

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
        {toolChoices.length > 0 ? (
          <div className="space-y-4">
            {toolChoices.map((choice) => {
              const decision = context.build?.choices[choice.choiceKey]
              return (
                <ChoicePicker
                  key={choice.choiceKey}
                  choice={choice}
                  currentDecision={decision as ChoiceDecision | undefined}
                  onDecide={(key, d) => context.makeChoice(key, d)}
                  onClear={(key) => context.clearChoice(key)}
                />
              )
            })}
          </div>
        ) : resolved.toolProficiencies.length === 0 ? (
          <p className="text-muted-foreground text-sm">{tc('characterBuilder.proficiencies.noProficiencies')}</p>
        ) : null}
      </div>

      {/* Languages */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{tc('characterBuilder.proficiencies.languages')}</h3>
        {resolved.languages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {resolved.languages.map((sourced) => (
              <Badge key={sourced.value} variant="secondary" title={sourced.sources[0]?.origin}>
                {t(`languages.${sourced.value}`)}
              </Badge>
            ))}
          </div>
        )}
        {languageChoices.length > 0 && (
          <div className="space-y-4">
            {languageChoices.map((choice) => {
              const decision = context.build?.choices[choice.choiceKey]
              return (
                <ChoicePicker
                  key={choice.choiceKey}
                  choice={choice}
                  currentDecision={decision as ChoiceDecision | undefined}
                  onDecide={(key, d) => context.makeChoice(key, d)}
                  onClear={(key) => context.clearChoice(key)}
                />
              )
            })}
          </div>
        )}
        {resolved.languages.length === 0 && languageChoices.length === 0 && (
          <p className="text-muted-foreground text-sm">{tc('characterBuilder.proficiencies.selectRaceFirst')}</p>
        )}
      </div>
    </div>
  )
}
