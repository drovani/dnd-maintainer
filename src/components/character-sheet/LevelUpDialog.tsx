import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTranslation } from 'react-i18next'

interface LevelUpDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onConfirm: (hpRoll: number) => void
  /** The hit die sides (e.g. 10 for d10). Used to roll and compute average. */
  readonly hitDie: number
  /** The translated class name (e.g. "Fighter"). */
  readonly className: string
  /** The class level the character will advance to. */
  readonly targetLevel: number
}

export function LevelUpDialog({ open, onOpenChange, onConfirm, hitDie, className, targetLevel }: LevelUpDialogProps) {
  const { t } = useTranslation('common')
  const [rolledValue, setRolledValue] = useState<number | null>(null)

  const average = Math.floor(hitDie / 2) + 1

  const handleRoll = () => {
    const result = Math.floor(Math.random() * hitDie) + 1
    setRolledValue(result)
  }

  const handleConfirm = (value: number) => {
    onConfirm(value)
    setRolledValue(null)
    onOpenChange(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setRolledValue(null)
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('characterSheet.levelManagement.levelUpTitle', { className, level: targetLevel })}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {t('characterSheet.levelManagement.hpRollPrompt')}
        </p>

        <div className="space-y-3">
          {/* Roll HP option */}
          <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3">
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
                <Button size="sm" onClick={() => handleConfirm(rolledValue)}>
                  {t('buttons.confirm')}
                </Button>
              )}
            </div>
          </div>

          {/* Take average option */}
          <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('characterSheet.levelManagement.takeAverage')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('characterSheet.levelManagement.takeAverageHint', { value: average })}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleConfirm(average)}>
              {t('characterSheet.levelManagement.takeAverage')}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            {t('buttons.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
