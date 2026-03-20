import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from 'react-i18next'
import type { CharacterData } from './types'

interface BackstoryStepProps {
  personalityTraits: string
  ideals: string
  bonds: string
  flaws: string
  appearance: string
  backstory: string
  onChange: (updates: Partial<Pick<CharacterData, 'personalityTraits' | 'ideals' | 'bonds' | 'flaws' | 'appearance' | 'backstory'>>) => void
}

export function BackstoryStep({
  personalityTraits,
  ideals,
  bonds,
  flaws,
  appearance,
  backstory,
  onChange,
}: BackstoryStepProps) {
  const { t } = useTranslation('common')

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="personality">{t('characterSheet.fields.personalityTraits')}</Label>
        <Textarea
          id="personality"
          value={personalityTraits}
          onChange={(e) => onChange({ personalityTraits: e.target.value })}
          placeholder={t('characterBuilder.placeholders.personalityTraits')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ideals">{t('characterSheet.personality.ideals')}</Label>
        <Textarea
          id="ideals"
          value={ideals}
          onChange={(e) => onChange({ ideals: e.target.value })}
          placeholder={t('characterBuilder.placeholders.ideals')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bonds">{t('characterSheet.personality.bonds')}</Label>
        <Textarea
          id="bonds"
          value={bonds}
          onChange={(e) => onChange({ bonds: e.target.value })}
          placeholder={t('characterBuilder.placeholders.bonds')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="flaws">{t('characterSheet.personality.flaws')}</Label>
        <Textarea
          id="flaws"
          value={flaws}
          onChange={(e) => onChange({ flaws: e.target.value })}
          placeholder={t('characterBuilder.placeholders.flaws')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="appearance">{t('characterSheet.sections.appearance')}</Label>
        <Textarea
          id="appearance"
          value={appearance}
          onChange={(e) => onChange({ appearance: e.target.value })}
          placeholder={t('characterBuilder.placeholders.appearance')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="backstory">{t('characterSheet.sections.backstory')}</Label>
        <Textarea
          id="backstory"
          value={backstory}
          onChange={(e) => onChange({ backstory: e.target.value })}
          placeholder={t('characterBuilder.placeholders.backstory')}
        />
      </div>
    </div>
  )
}
