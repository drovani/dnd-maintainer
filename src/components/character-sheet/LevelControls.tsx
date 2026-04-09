import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LevelUpDialog } from '@/components/character-sheet/LevelUpDialog'
import { useCharacterContext } from '@/hooks/useCharacterContext'
import { DND_CLASSES } from '@/lib/dnd-helpers'
import type { ClassId } from '@/lib/dnd-helpers'
import type { ChoiceKey } from '@/types/choices'
import type { ChoiceDecision } from '@/types/choices'
import type { SubclassId } from '@/types/sources'
import { useTranslation } from 'react-i18next'

interface LevelControlsProps {
  /** The class to level up into. Determines hit die and class-level progression. */
  readonly classId: ClassId
}

export function LevelControls({ classId }: LevelControlsProps) {
  const { t } = useTranslation('common')
  const { t: tg } = useTranslation('gamedata')
  const {
    level,
    rows,
    resolved,
    hasDeletedRows,
    nextRestoreLevel,
    levelUp,
    levelDown,
    undoLevelDown,
    makeChoice,
  } = useCharacterContext()
  const [dialogOpen, setDialogOpen] = useState(false)

  const canLevelUp = level < 20
  const canLevelDown = level > 1

  const classData = DND_CLASSES.find((c) => c.id === classId)
  if (!classData) {
    throw new Error(`LevelControls: classId "${classId}" not found in DND_CLASSES — this is a data integrity error`)
  }
  const hitDie = classData.hitDie
  const className = tg(`classes.${classId}`)
  const targetLevel = level + 1

  // Find the current subclass for this class (if any)
  const currentSubclassId = (rows.find(
    (r) => r.class_id === classId && r.subclass_id != null && r.deleted_at == null,
  )?.subclass_id ?? null) as SubclassId | null

  const handleConfirmLevelUp = (hpRoll: number, decisions: ReadonlyMap<ChoiceKey, ChoiceDecision>) => {
    levelUp(classId, hpRoll)
    for (const [key, decision] of decisions) {
      makeChoice(key, decision)
    }
  }

  // Button label changes based on whether we're replacing a soft-deleted level
  const levelUpLabel = hasDeletedRows && nextRestoreLevel != null
    ? t('characterSheet.levelManagement.replaceLevelUp', { className, level: targetLevel })
    : t('characterSheet.levelManagement.levelUpTo', { className, level: targetLevel })

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setDialogOpen(true)} disabled={!canLevelUp}>
          {levelUpLabel}
        </Button>

        {canLevelDown && (
          <Button variant="outline" size="sm" onClick={levelDown}>
            {t('characterSheet.levelManagement.levelDown')}
          </Button>
        )}

        {hasDeletedRows && nextRestoreLevel != null && (
          <Button variant="ghost" size="sm" onClick={undoLevelDown}>
            {t('characterSheet.levelManagement.restoreLevel', { level: nextRestoreLevel })}
          </Button>
        )}
      </div>

      <LevelUpDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmLevelUp}
        hitDie={hitDie}
        className={className}
        targetLevel={targetLevel}
        classId={classId}
        currentSubclassId={currentSubclassId}
        currentAbilities={resolved?.abilities ?? null}
      />
    </>
  )
}
