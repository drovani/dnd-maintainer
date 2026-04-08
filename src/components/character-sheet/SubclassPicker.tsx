import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SUBCLASS_SOURCES } from '@/lib/sources/subclasses'
import type { PendingChoice } from '@/types/resolved'
import type { ChoiceKey } from '@/types/choices'
import type { SubclassId } from '@/types/sources'
import { useTranslation } from 'react-i18next'

interface SubclassPickerProps {
  readonly choice: Extract<PendingChoice, { type: 'subclass' }>
  readonly onDecide: (choiceKey: ChoiceKey, subclassId: SubclassId) => void
}

export function SubclassPicker({ choice, onDecide }: SubclassPickerProps) {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')
  const [selected, setSelected] = useState<SubclassId | null>(null)

  const subclasses = SUBCLASS_SOURCES.filter((sc) => sc.classId === choice.classId)
  const className = t(`classes.${choice.classId}`, { defaultValue: choice.classId })

  const handleConfirm = () => {
    if (!selected) return
    onDecide(choice.choiceKey, selected)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tc('characterSheet.subclassPicker.chooseSubclass')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {tc('characterSheet.subclassPicker.subclassDescription', { className })}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {subclasses.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {tc('characterSheet.subclassPicker.noSubclassesAvailable')}
          </p>
        )}
        {subclasses.map((sc) => {
          const isSelected = selected === sc.id

          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => setSelected(sc.id)}
              className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
              }`}
            >
              <div className={`text-sm text-foreground ${isSelected ? 'font-semibold' : ''}`}>
                {t(`subclasses.${sc.id}.name`)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t(`subclasses.${sc.id}.description`)}
              </p>
              {isSelected && (
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {sc.features.flatMap((f) =>
                    f.grants
                      .filter((g): g is Extract<typeof g, { type: 'feature' }> => g.type === 'feature')
                      .map((g) => (
                        <li key={g.feature.id}>
                          <span className="font-semibold">
                            {t(`features.${g.feature.id}.name`, { defaultValue: g.feature.id })}
                          </span>
                          {` (Lv. ${f.classLevel}) `}
                          &mdash;{' '}
                          {t(`features.${g.feature.id}.description`, { defaultValue: '' })}
                        </li>
                      ))
                  )}
                </ul>
              )}
            </button>
          )
        })}

        <Button
          className="mt-4 w-full"
          disabled={!selected}
          onClick={handleConfirm}
        >
          {tc('buttons.confirm')}
        </Button>
      </CardContent>
    </Card>
  )
}
