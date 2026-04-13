import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AsiAllocator } from '@/components/character-sheet/AsiAllocator'
import { FightingStylePicker } from '@/components/character-sheet/FightingStylePicker'
import { SubclassPicker } from '@/components/character-sheet/SubclassPicker'
import { ChoicePicker } from '@/components/character-builder/ChoicePicker'
import { useCharacterContext } from '@/hooks/useCharacterContext'
import { collectGrantsByType } from '@/lib/resolver/helpers'
import type { PendingChoice } from '@/types/resolved'
import type { ChoiceDecision, ChoiceKey } from '@/types/choices'
import type { FightingStyleId } from '@/lib/dnd-helpers'
import { useTranslation } from 'react-i18next'

/**
 * Synthesize PendingChoice shapes from all choice-producing grants,
 * so pickers stay visible even after a decision is made (as long as the
 * overall panel is rendered because other grants remain unresolved).
 */
function useAllChoiceGrants() {
  const { bundles, build } = useCharacterContext()
  const buildChoices = build?.choices

  return useMemo(() => {
    const choices = buildChoices ?? {}
    const allGrants: PendingChoice[] = []

    // bundle-choice grants
    for (const { grant, source } of collectGrantsByType(bundles, 'bundle-choice')) {
      allGrants.push({
        type: 'bundle-choice',
        choiceKey: grant.key,
        source,
        category: grant.category,
        bundleIds: grant.bundleIds,
      })
    }

    // fighting-style-choice grants — compute alreadyChosen from all valid decisions
    const fightingStyleGrants = collectGrantsByType(bundles, 'fighting-style-choice')
    const allChosenStyles: FightingStyleId[] = []
    for (const { grant } of fightingStyleGrants) {
      const decision = choices[grant.key]
      if (decision?.type === 'fighting-style-choice') {
        const validStyles = decision.styles.filter(
          (s): s is FightingStyleId => grant.from.includes(s as FightingStyleId),
        )
        allChosenStyles.push(...validStyles)
      }
    }
    for (const { grant, source } of fightingStyleGrants) {
      allGrants.push({
        type: 'fighting-style-choice',
        choiceKey: grant.key,
        source,
        count: grant.count,
        from: grant.from,
        alreadyChosen: allChosenStyles,
      })
    }

    // subclass grants
    for (const { grant, source } of collectGrantsByType(bundles, 'subclass')) {
      allGrants.push({
        type: 'subclass',
        choiceKey: grant.key,
        source,
        classId: grant.classId,
      })
    }

    // ASI grants
    for (const { grant, source } of collectGrantsByType(bundles, 'asi')) {
      allGrants.push({
        type: 'asi',
        choiceKey: grant.key,
        source,
        points: grant.points,
      })
    }

    // ability-choice grants
    for (const { grant, source } of collectGrantsByType(bundles, 'ability-choice')) {
      allGrants.push({
        type: 'ability-choice',
        choiceKey: grant.key,
        source,
        count: grant.count,
        bonus: grant.bonus,
        from: grant.from,
      })
    }

    // proficiency-choice grants → skill-choice, tool-choice, language-choice
    for (const { grant, source } of collectGrantsByType(bundles, 'proficiency-choice')) {
      if (grant.category === 'skill') {
        allGrants.push({
          type: 'skill-choice',
          choiceKey: grant.key,
          source,
          category: 'skill',
          count: grant.count,
          from: grant.from,
        })
      } else if (grant.category === 'tool') {
        allGrants.push({
          type: 'tool-choice',
          choiceKey: grant.key,
          source,
          category: 'tool',
          count: grant.count,
          from: grant.from,
        })
      } else if (grant.category === 'language') {
        allGrants.push({
          type: 'language-choice',
          choiceKey: grant.key,
          source,
          count: grant.count,
          from: grant.from,
        })
      }
    }

    return allGrants
  }, [bundles, buildChoices])
}

function PendingChoiceRow({
  choice,
  currentDecision,
  onDecide,
  onClear,
}: {
  choice: PendingChoice
  currentDecision: ChoiceDecision | undefined
  onDecide: (key: ChoiceKey, decision: ChoiceDecision) => void
  onClear: (key: ChoiceKey) => void
}) {
  const { resolved } = useCharacterContext()
  const { t: tc } = useTranslation('common')

  if (choice.type === 'subclass') {
    return (
      <SubclassPicker
        choice={choice}
        currentDecision={currentDecision}
        onDecide={(choiceKey, subclassId) =>
          onDecide(choiceKey, { type: 'subclass', subclassId })
        }
        onClear={onClear}
      />
    )
  }

  if (choice.type === 'fighting-style-choice') {
    return (
      <FightingStylePicker
        choice={choice}
        currentDecision={currentDecision}
        onDecide={onDecide}
        onClear={onClear}
      />
    )
  }

  if (choice.type === 'asi') {
    if (!resolved) {
      return (
        <Card className="opacity-60">
          <CardContent className="p-4 space-y-1">
            <p className="text-sm text-muted-foreground">{tc('characterSheet.asi.asiTitle')}</p>
            <p className="text-xs text-destructive">{tc('characterSheet.levelUp.abilitiesUnavailable')}</p>
          </CardContent>
        </Card>
      )
    }
    return (
      <AsiAllocator
        choice={choice}
        abilities={resolved.abilities}
        currentDecision={currentDecision}
        onDecide={(choiceKey, allocation) =>
          onDecide(choiceKey, { type: 'asi', allocation })
        }
        onClear={onClear}
      />
    )
  }

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

  // Drive the picker list from grants so resolved pickers stay mounted
  const allChoiceGrants = useAllChoiceGrants()

  const pendingChoices = resolved?.pendingChoices ?? []
  const choices = build?.choices ?? {}

  // Panel is only visible when there are unresolved choices
  if (pendingChoices.length === 0) return null

  const handleDecide = (key: ChoiceKey, decision: ChoiceDecision) => {
    makeChoice(key, decision)
  }

  const handleClear = (key: ChoiceKey) => {
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
        {allChoiceGrants.map((choice) => {
          const currentDecision = choices[choice.choiceKey]
          // Include a hash of the decision in the key so pickers with local state
          // (AsiAllocator, FightingStylePicker, SubclassPicker) remount when the
          // decision is cleared or changed externally.
          const decisionHash = currentDecision ? JSON.stringify(currentDecision) : 'none'
          return (
            <PendingChoiceRow
              key={`${choice.choiceKey}::${decisionHash}`}
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
