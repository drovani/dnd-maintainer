import { useCharacterContext } from '@/hooks/useCharacterContext'
import {
  ABILITY_ABBREVIATIONS,
  DND_SKILLS,
} from '@/lib/dnd-helpers'
import { useTranslation } from 'react-i18next'
import { ChoicePicker } from './ChoicePicker'
import type { ChoiceDecision } from '@/types/choices'

export function SkillsStep() {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')
  const context = useCharacterContext()
  const { resolved } = context

  if (!resolved) {
    return (
      <p className="text-muted-foreground text-sm">
        {tc('characterBuilder.skills.selectClassFirst')}
      </p>
    )
  }

  const skillChoices = resolved.pendingChoices.filter((c) => c.type === 'skill-choice')

  return (
    <div className="space-y-4">
      {/* Pending skill choices */}
      {skillChoices.length > 0 && (
        <div className="space-y-4">
          {skillChoices.map((choice) => {
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

      {/* All skills list with computed bonuses */}
      <div className="space-y-1">
        {DND_SKILLS.map((skill) => {
          const resolvedSkill = resolved.skills[skill.id]
          if (!resolvedSkill) return null
          const abilityKey = resolvedSkill.ability
          const bonus = resolvedSkill.bonus
          const abbrev = t(`abilityAbbreviations.${abilityKey}`, { defaultValue: ABILITY_ABBREVIATIONS[abilityKey] })
          const proficient = resolvedSkill.proficient

          return (
            <div
              key={skill.id}
              className="flex items-center gap-3 px-2 py-1.5 rounded-md"
            >
              <div className="size-4 flex items-center justify-center">
                {proficient && (
                  <div className="size-3 rounded-full bg-primary" />
                )}
              </div>
              <span className={`w-8 text-right text-sm font-bold tabular-nums ${bonus >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {bonus >= 0 ? '+' : ''}{bonus}
              </span>
              <span className="flex-1 text-sm">
                {t(`skills.${skill.id}`)}
                <span className="text-xs text-muted-foreground ml-1">
                  ({abbrev})
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
