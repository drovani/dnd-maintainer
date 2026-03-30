import { useCharacterContext } from '@/hooks/useCharacterContext'
import { useTranslation } from 'react-i18next'

export function SpellsStep() {
  const { t: tc } = useTranslation('common')
  const context = useCharacterContext()
  const { resolved } = context

  if (resolved?.spellcasting) {
    const sc = resolved.spellcasting
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">{tc('characterBuilder.spells.basicVersion')}</p>
        <div className="space-y-2">
          {sc.cantrips.length > 0 && (
            <div>
              <span className="text-sm font-semibold">{tc('characterBuilder.spells.cantrips')}: </span>
              <span className="text-sm">{sc.cantrips.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{tc('characterBuilder.spells.noSpellcasting')}</p>
    </div>
  )
}
