import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LevelUpDialog } from '@/components/character-sheet/LevelUpDialog'
import { useCharacterContext } from '@/hooks/useCharacterContext'
import { DND_CLASSES } from '@/lib/dnd-helpers'
import type { ClassId } from '@/lib/dnd-helpers'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

interface LevelControlsProps {
  /** The class to level up into. For Phase 2, this is always the character's current class. */
  readonly classId: ClassId
}

export function LevelControls({ classId }: LevelControlsProps) {
  const { t } = useTranslation('common')
  const { resolved, hasDeletedRows, levelUp, levelDown, undoLevelDown } = useCharacterContext()
  const [dialogOpen, setDialogOpen] = useState(false)

  const currentLevel = resolved?.hitDie.reduce((sum, hd) => sum + hd.count, 0) ?? 0
  const canLevelDown = currentLevel > 1

  const { t: tg } = useTranslation('gamedata')

  const classData = DND_CLASSES.find((c) => c.id === classId)
  if (!classData) {
    throw new Error(`LevelControls: classId "${classId}" not found in DND_CLASSES — this is a data integrity error`)
  }
  const hitDie = classData.hitDie
  const className = tg(`classes.${classId}`)

  // Compute the next class level (how many levels of this class + 1)
  const currentClassLevel = resolved?.hitDie.find((hd) => hd.die === hitDie)?.count ?? 0
  const targetLevel = currentClassLevel + 1

  const handleConfirmLevelUp = (hpRoll: number) => {
    levelUp(classId, hpRoll)
    toast.success(t('characterSheet.levelManagement.levelUpSuccess', { level: targetLevel }))
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          {t('characterSheet.levelManagement.levelUp')}
        </Button>

        {canLevelDown && (
          <Button variant="outline" size="sm" onClick={levelDown}>
            {t('characterSheet.levelManagement.levelDown')}
          </Button>
        )}

        {hasDeletedRows && (
          <Button variant="ghost" size="sm" onClick={undoLevelDown}>
            {t('characterSheet.levelManagement.undoLevelDown')}
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
      />
    </>
  )
}
