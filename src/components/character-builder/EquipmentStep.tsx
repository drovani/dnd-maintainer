import { useCharacterContext } from '@/hooks/useCharacterContext'
import { useTranslation } from 'react-i18next'
import { ChoicePicker } from './ChoicePicker'
import type { ChoiceDecision } from '@/types/choices'

export function EquipmentStep() {
  const { t: tc } = useTranslation('common')
  const context = useCharacterContext()
  const { resolved } = context

  const equipmentChoices = resolved?.pendingChoices.filter((c) => c.type === 'equipment-choice') ?? []

  return (
    <div className="space-y-4">
      {equipmentChoices.length > 0 ? (
        <div className="space-y-4">
          {equipmentChoices.map((choice) => {
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
      ) : (
        <p className="text-muted-foreground text-sm">
          {tc('characterBuilder.equipment.comingSoon')}
        </p>
      )}
    </div>
  )
}
