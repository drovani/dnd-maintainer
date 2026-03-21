import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseIntOrDefault } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import type { CharacterData } from './types'

interface EquipmentStepProps {
  equipment: CharacterData['equipment']
  onAdd: () => void
  onUpdate: (id: string, updates: Partial<CharacterData['equipment'][0]>) => void
  onRemove: (id: string) => void
}

export function EquipmentStep({ equipment, onAdd, onUpdate, onRemove }: EquipmentStepProps) {
  const { t } = useTranslation('common')

  return (
    <div className="space-y-4">
      <Button onClick={onAdd}>{t('buttons.addEquipment')}</Button>
      <div className="space-y-4">
        {equipment.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 space-y-3">
              <Input
                value={item.name}
                onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                placeholder={t('characterBuilder.placeholders.itemName')}
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => onUpdate(item.id, { quantity: parseIntOrDefault(e.target.value, 1) })}
                  placeholder={t('characterBuilder.placeholders.quantity')}
                />
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={item.weight}
                  onChange={(e) => onUpdate(item.id, { weight: parseFloat(e.target.value) || 0 })}
                  placeholder={t('characterBuilder.placeholders.weight')}
                />
                <Label htmlFor={`equip-${item.id}`} className="flex items-center gap-2">
                  <Checkbox
                    id={`equip-${item.id}`}
                    checked={item.equipped}
                    onCheckedChange={(checked) => onUpdate(item.id, { equipped: checked === true })}
                  />
                  {t('characterBuilder.equipment.equipped')}
                </Label>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemove(item.id)}
              >
                {t('buttons.remove')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
