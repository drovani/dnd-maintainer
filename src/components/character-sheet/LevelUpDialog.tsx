import { AsiAllocator } from '@/components/character-sheet/AsiAllocator'
import { SubclassPicker } from '@/components/character-sheet/SubclassPicker'
import { Button } from '@/components/ui/button'
import { RollingNumber } from '@/components/ui/rolling-number'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ClassId } from '@/lib/dnd-helpers'
import { getGrantsForLevel } from '@/lib/sources/level-grants'
import type { ChoiceDecision, ChoiceKey } from '@/types/choices'
import type { AsiGrant, FeatureGrant, SubclassGrant } from '@/types/grants'
import type { PendingChoice, ResolvedCharacter } from '@/types/resolved'
import type { SubclassId } from '@/types/sources'
import { Dices } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface LevelUpDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onConfirm: (hpRoll: number, decisions: ReadonlyMap<ChoiceKey, ChoiceDecision>) => void
  /** The hit die sides (e.g. 10 for d10). Used to roll and compute average. */
  readonly hitDie: number
  /** The translated class name (e.g. "Fighter"). */
  readonly className: string
  /** The class level the character will advance to. */
  readonly targetLevel: number
  /** The class being leveled up. */
  readonly classId: ClassId
  /** The already-chosen subclass (for subclass feature grants at higher levels). */
  readonly currentSubclassId: SubclassId | null
  /** Current resolved abilities (needed for ASI allocator). */
  readonly currentAbilities: ResolvedCharacter['abilities'] | null
}

export function LevelUpDialog({
  open,
  onOpenChange,
  onConfirm,
  hitDie,
  className,
  targetLevel,
  classId,
  currentSubclassId,
  currentAbilities,
}: LevelUpDialogProps) {
  const { t } = useTranslation('common')
  const { t: tg } = useTranslation('gamedata')

  const [rolledValue, setRolledValue] = useState<number | null>(null)
  const [isRolling, setIsRolling] = useState<boolean>(false)
  const [hpSelection, setHpSelection] = useState<number | null>(null)
  const [decisions, setDecisions] = useState<Map<ChoiceKey, ChoiceDecision>>(new Map())
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const average = Math.floor(hitDie / 2) + 1
  const hpRange = useMemo(() => [1, hitDie] as const, [hitDie])

  const preview = useMemo(
    () => getGrantsForLevel(classId, targetLevel, currentSubclassId),
    [classId, targetLevel, currentSubclassId],
  )

  // Categorize grants
  const featureGrants = useMemo(() => {
    const allGrants = [...preview.classGrants, ...preview.subclassGrants]
    return allGrants.filter((g): g is FeatureGrant => g.type === 'feature')
  }, [preview])

  const asiGrants = useMemo(() => {
    return preview.classGrants.filter((g): g is AsiGrant => g.type === 'asi')
  }, [preview])

  const subclassGrants = useMemo(() => {
    return preview.classGrants.filter((g): g is SubclassGrant => g.type === 'subclass')
  }, [preview])

  // Check if all required choices are made
  const allChoicesMade = useMemo(() => {
    for (const grant of asiGrants) {
      const decision = decisions.get(grant.key)
      if (!decision || decision.type !== 'asi') return false
      const total = Object.values(decision.allocation).reduce((sum, v) => sum + (v ?? 0), 0)
      if (total !== grant.points) return false
    }
    for (const grant of subclassGrants) {
      const decision = decisions.get(grant.key)
      if (!decision || decision.type !== 'subclass') return false
    }
    return true
  }, [asiGrants, subclassGrants, decisions])

  const canConfirm = hpSelection !== null && allChoicesMade

  const handleRoll = useCallback(() => {
    if (isRolling) return
    setIsRolling(true)
    setHpSelection(null)

    const finalValue = Math.floor(Math.random() * hitDie) + 1
    let ticks = 0
    const totalTicks = 12

    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current)
    rollIntervalRef.current = setInterval(() => {
      ticks++
      if (ticks >= totalTicks) {
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current)
        setRolledValue(finalValue)
        setIsRolling(false)
      }
    }, 60)
  }, [isRolling, hitDie])

  const handleSelectHp = (value: number) => {
    setHpSelection(value)
  }

  const handleConfirm = () => {
    if (hpSelection === null) return
    onConfirm(hpSelection, decisions)
    resetState()
    onOpenChange(false)
  }

  const resetState = () => {
    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current)
    setRolledValue(null)
    setIsRolling(false)
    setHpSelection(null)
    setDecisions(new Map())
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetState()
    onOpenChange(nextOpen)
  }

  const handleAsiDecide = (choiceKey: ChoiceKey, allocation: Partial<Record<string, number>>) => {
    setDecisions((prev) => {
      const next = new Map(prev)
      next.set(choiceKey, { type: 'asi', allocation: allocation as Record<string, number> })
      return next
    })
  }

  const handleSubclassDecide = (choiceKey: ChoiceKey, subclassId: SubclassId) => {
    setDecisions((prev) => {
      const next = new Map(prev)
      next.set(choiceKey, { type: 'subclass', subclassId })
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('characterSheet.levelManagement.levelUpTitle', { className, level: targetLevel })}</DialogTitle>
        </DialogHeader>

        {/* Features gained */}
        {featureGrants.length > 0 && (
          <div className="space-y-1">
            {featureGrants.map((grant) => (
              <div key={grant.feature.id} className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">
                  {tg(`features.${grant.feature.id}.name`, { defaultValue: grant.feature.id })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tg(`features.${grant.feature.id}.description`, { defaultValue: '' })}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* HP selection */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {t('characterSheet.levelManagement.hpRollPrompt')}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {/* Roll HP option */}
            <div className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center ${hpSelection !== null && hpSelection === rolledValue ? 'border-primary bg-primary/5' : 'bg-muted/30'
              }`}>
              <p className="text-sm font-medium text-foreground">
                {t('characterSheet.levelManagement.rollHp')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('characterSheet.levelManagement.rollHpHint', { die: hitDie })}
              </p>
              {(isRolling || rolledValue !== null) && (
                <RollingNumber
                  value={rolledValue}
                  isRolling={isRolling}
                  range={hpRange}
                  className="text-lg font-bold text-foreground tabular-nums"
                />
              )}
              <div className="flex flex-row gap-1 mt-auto">
                <Button variant="outline" size="sm" onClick={handleRoll} disabled={isRolling}>
                  <Dices className={`size-4 mr-1 ${isRolling ? 'animate-spin' : ''}`} />
                  {rolledValue !== null && !isRolling
                    ? t('buttons.reRoll')
                    : t('characterSheet.levelManagement.rollHp')}
                </Button>
                {rolledValue !== null && !isRolling && (
                  <Button
                    size="sm"
                    variant={hpSelection === rolledValue ? 'default' : 'outline'}
                    onClick={() => handleSelectHp(rolledValue)}
                  >
                    {hpSelection === rolledValue ? t('buttons.selected') : t('buttons.select')}
                  </Button>
                )}
              </div>
            </div>

            {/* Take average option */}
            <div className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center ${hpSelection === average ? 'border-primary bg-primary/5' : 'bg-muted/30'
              }`}>
              <p className="text-sm font-medium text-foreground">
                {t('characterSheet.levelManagement.takeAverage')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('characterSheet.levelManagement.takeAverageHint', { value: average })}
              </p>
              <Button
                className="mt-auto"
                variant={hpSelection === average ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSelectHp(average)}
              >
                {hpSelection === average ? t('buttons.selected') : t('buttons.select')}
              </Button>
            </div>
          </div>
        </div>

        {/* Subclass choice */}
        {subclassGrants.map((grant) => (
          <SubclassPicker
            key={grant.key}
            choice={{
              type: 'subclass',
              choiceKey: grant.key,
              source: { origin: 'class', id: classId, level: targetLevel },
              classId: grant.classId,
            } satisfies Extract<PendingChoice, { type: 'subclass' }>}
            onDecide={handleSubclassDecide}
            autoCommit
          />
        ))}

        {/* ASI choice */}
        {asiGrants.map((grant) =>
          currentAbilities ? (
            <AsiAllocator
              key={grant.key}
              choice={{
                type: 'asi',
                choiceKey: grant.key,
                source: { origin: 'class', id: classId, level: targetLevel },
                points: grant.points,
              } satisfies Extract<PendingChoice, { type: 'asi' }>}
              abilities={currentAbilities}
              onDecide={handleAsiDecide}
              autoCommit
            />
          ) : null,
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            {t('buttons.cancel')}
          </Button>
          <Button disabled={!canConfirm} onClick={handleConfirm}>
            {t('characterSheet.levelManagement.confirmLevelUp')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
