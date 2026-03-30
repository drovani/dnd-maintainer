import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AsiAllocator } from '@/components/character-sheet/AsiAllocator'
import { SubclassPicker } from '@/components/character-sheet/SubclassPicker'
import { ChoicePicker } from '@/components/character-builder/ChoicePicker'
import { useCharacterContext } from '@/hooks/useCharacterContext'
import type { PendingChoice } from '@/types/resolved'
import type { ChoiceDecision } from '@/types/choices'
import { useTranslation } from 'react-i18next'

function PendingChoiceRow({
  choice,
  currentDecision,
  onDecide,
  onClear,
}: {
  choice: PendingChoice
  currentDecision: ChoiceDecision | undefined
  onDecide: (key: string, decision: ChoiceDecision) => void
  onClear: (key: string) => void
}) {
  const { resolved, makeChoice } = useCharacterContext()

  if (choice.type === 'subclass') {
    return (
      <SubclassPicker
        choice={choice}
        onDecide={(choiceKey, subclassId) =>
          makeChoice(choiceKey, { type: 'subclass', subclassId })
        }
      />
    )
  }

  if (choice.type === 'asi') {
    if (!resolved) return null
    return (
      <AsiAllocator
        choice={choice}
        abilities={resolved.abilities}
        onDecide={(choiceKey, allocation) =>
          makeChoice(choiceKey, { type: 'asi', allocation })
        }
      />
    )
  }

  // Delegate to existing ChoicePicker for skill/language/tool/ability choices
  return (
    <ChoicePicker
      choice={choice}
      currentDecision={currentDecision}
      onDecide={onDecide}
      onClear={onClear}
    />
  )
}

export function PendingChoicesPanel() {
  const { t } = useTranslation('common')
  const { resolved, build, makeChoice, clearChoice } = useCharacterContext()

  const pendingChoices = resolved?.pendingChoices ?? []

  if (pendingChoices.length === 0) return null

  const choices = build?.choices ?? {}

  const handleDecide = (key: string, decision: ChoiceDecision) => {
    makeChoice(key, decision)
  }

  const handleClear = (key: string) => {
    clearChoice(key)
  }

  return (
    <Card className="border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader>
        <CardTitle className="text-amber-700 dark:text-amber-400">
          {t('characterBuilder.pendingChoices.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('characterSheet.pendingChoices.description', { count: pendingChoices.length })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingChoices.map((choice) => {
          const currentDecision = choices[choice.choiceKey]
          return (
            <PendingChoiceRow
              key={choice.choiceKey}
              choice={choice}
              currentDecision={currentDecision}
              onDecide={handleDecide}
              onClear={handleClear}
            />
          )
        })}
      </CardContent>
    </Card>
  )
}
