import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from 'react-i18next'
import type { CharacterData } from './types'

interface FeaturesStepProps {
  features: CharacterData['features']
  onAdd: () => void
  onUpdate: (id: string, updates: Partial<CharacterData['features'][0]>) => void
  onRemove: (id: string) => void
}

export function FeaturesStep({ features, onAdd, onUpdate, onRemove }: FeaturesStepProps) {
  const { t } = useTranslation('common')

  return (
    <div className="space-y-4">
      <Button onClick={onAdd}>{t('buttons.addFeature')}</Button>
      <div className="space-y-4">
        {features.map((feature) => (
          <Card key={feature.id}>
            <CardContent className="p-4 space-y-3">
              <Input
                value={feature.name}
                onChange={(e) => onUpdate(feature.id, { name: e.target.value })}
                placeholder={t('characterBuilder.placeholders.featureName')}
              />
              <Textarea
                value={feature.description}
                onChange={(e) => onUpdate(feature.id, { description: e.target.value })}
                placeholder={t('characterBuilder.placeholders.featureDescription')}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={feature.source}
                  onChange={(e) => onUpdate(feature.id, { source: e.target.value })}
                  placeholder={t('characterBuilder.placeholders.featureSource')}
                />
                <Input
                  type="number"
                  min="0"
                  value={feature.uses}
                  onChange={(e) => onUpdate(feature.id, { uses: parseInt(e.target.value) || 0 })}
                  placeholder={t('characterBuilder.placeholders.featureUses')}
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemove(feature.id)}
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
