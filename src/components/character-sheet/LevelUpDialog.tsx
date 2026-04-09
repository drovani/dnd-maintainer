import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AsiAllocator } from '@/components/character-sheet/AsiAllocator'
import { SubclassPicker } from '@/components/character-sheet/SubclassPicker'
import { getGrantsForLevel } from '@/lib/sources/level-grants'
import type { ClassId } from '@/lib/dnd-helpers'
import type { SubclassId } from '@/types/sources'
import type { ChoiceKey } from '@/types/choices'
import type { ChoiceDecision } from '@/types/choices'
import type { PendingChoice } from '@/types/resolved'
import type { ResolvedCharacter } from '@/types/resolved'
import type { AsiGrant, SubclassGrant, FeatureGrant } from '@/types/grants'
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
  const [hpSelection, setHpSelection] = useState<number | null>(null)
  const [decisions, setDecisions] = useState<Map<ChoiceKey, ChoiceDecision>>(new Map())

  const average = Math.floor(hitDie / 2) + 1

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

  const handleRoll = () => {
    const result = Math.floor(Math.random() * hitDie) + 1
    setRolledValue(result)
  }

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
    setRolledValue(null)
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

          {/* Roll HP option */}
          <div className={`flex items-center justify-between gap-4 rounded-lg border p-3 ${
            hpSelection !== null && hpSelection === rolledValue ? 'border-primary bg-primary/5' : 'bg-muted/30'
          }`}>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('characterSheet.levelManagement.rollHp')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('characterSheet.levelManagement.rollHpHint', { die: hitDie })}
              </p>
              {rolledValue !== null && (
                <p className="mt-1 text-lg font-bold text-foreground">{rolledValue}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={handleRoll}>
                {t('characterSheet.levelManagement.rollHp')}
              </Button>
              {rolledValue !== null && (
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
          <div className={`flex items-center justify-between gap-4 rounded-lg border p-3 ${
            hpSelection === average ? 'border-primary bg-primary/5' : 'bg-muted/30'
          }`}>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('characterSheet.levelManagement.takeAverage')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('characterSheet.levelManagement.takeAverageHint', { value: average })}
              </p>
            </div>
            <Button
              variant={hpSelection === average ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSelectHp(average)}
            >
              {hpSelection === average ? t('buttons.selected') : t('buttons.select')}
            </Button>
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
            confirmLabel={t('characterSheet.asi.lockIn')}
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
              confirmLabel={t('characterSheet.asi.lockIn')}
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
