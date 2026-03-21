import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from 'react-i18next'
import type { CharacterData } from './types'

interface SpellsStepProps {
  spells: CharacterData['spells']
  onSpellsChange: (spells: CharacterData['spells']) => void
}

export function SpellsStep({ spells, onSpellsChange }: SpellsStepProps) {
  const { t } = useTranslation('common')

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">{t('characterBuilder.spells.basicVersion')}</p>
      <Card>
        <CardContent className="p-4 space-y-2">
          <Label htmlFor="cantrips">{t('characterBuilder.spells.cantrips')}</Label>
          <Input
            id="cantrips"
            value={spells.cantrips.join(', ')}
            onChange={(e) =>
              onSpellsChange({
                ...spells,
                cantrips: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
            placeholder={t('characterBuilder.placeholders.cantrips')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
