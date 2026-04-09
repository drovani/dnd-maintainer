import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AbilityKey } from '@/lib/dnd-helpers'
import type { PendingChoice, ResolvedCharacter } from '@/types/resolved'
import type { ChoiceKey } from '@/types/choices'
import { useTranslation } from 'react-i18next'

const ABILITY_KEYS: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

interface AsiAllocatorProps {
  readonly choice: Extract<PendingChoice, { type: 'asi' }>
  readonly abilities: ResolvedCharacter['abilities']
  readonly onDecide: (choiceKey: ChoiceKey, allocation: Partial<Record<AbilityKey, number>>) => void
  /** When true, calls onDecide on every +/- click and hides the confirm button. */
  readonly autoCommit?: boolean
}

export function AsiAllocator({ choice, abilities, onDecide, autoCommit }: AsiAllocatorProps) {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')

  const [allocation, setAllocation] = useState<Partial<Record<AbilityKey, number>>>({})

  const pointsUsed = Object.values(allocation).reduce((sum, v) => sum + (v ?? 0), 0)
  const pointsRemaining = choice.points - pointsUsed

  const applyChange = (next: Partial<Record<AbilityKey, number>>) => {
    setAllocation(next)
    if (autoCommit) {
      onDecide(choice.choiceKey, next)
    }
  }

  const increment = (ability: AbilityKey) => {
    const current = allocation[ability] ?? 0
    const currentTotal = abilities[ability].total
    if (pointsRemaining <= 0) return
    if (currentTotal + current + 1 > 20) return
    applyChange({ ...allocation, [ability]: current + 1 })
  }

  const decrement = (ability: AbilityKey) => {
    const current = allocation[ability] ?? 0
    if (current <= 0) return
    const next = { ...allocation, [ability]: current - 1 }
    if (next[ability] === 0) delete next[ability]
    applyChange(next)
  }

  const handleConfirm = () => {
    onDecide(choice.choiceKey, allocation)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tc('characterSheet.asi.asiTitle')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {tc('characterSheet.asi.asiDescription', { points: choice.points })}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="mb-3 text-sm font-medium text-foreground">
          {tc('characterSheet.asi.asiPointsRemaining', { points: pointsRemaining })}
        </div>

        {ABILITY_KEYS.map((ability) => {
          const currentAlloc = allocation[ability] ?? 0
          const currentTotal = abilities[ability].total
          const newTotal = currentTotal + currentAlloc
          const canIncrement = pointsRemaining > 0 && newTotal < 20
          const canDecrement = currentAlloc > 0

          return (
            <div
              key={ability}
              className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2"
            >
              <span className="w-28 text-sm font-medium text-foreground">
                {t(`abilities.${ability}`)}
              </span>
              <span className="w-8 text-center text-base font-bold text-foreground">
                {currentTotal}
              </span>
              {currentAlloc > 0 && (
                <span className="text-xs font-semibold text-green-600">
                  +{currentAlloc} = {newTotal}
                </span>
              )}
              <div className="ml-auto flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={!canDecrement}
                  onClick={() => decrement(ability)}
                  aria-label={tc('characterSheet.asi.decreaseAbility', { ability: t(`abilities.${ability}`) })}
                >
                  −
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={!canIncrement}
                  onClick={() => increment(ability)}
                  aria-label={tc('characterSheet.asi.increaseAbility', { ability: t(`abilities.${ability}`) })}
                >
                  +
                </Button>
              </div>
            </div>
          )
        })}

        {!autoCommit && (
          <Button
            className="mt-4 w-full"
            disabled={pointsRemaining !== 0}
            onClick={handleConfirm}
          >
            {tc('buttons.confirm')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
