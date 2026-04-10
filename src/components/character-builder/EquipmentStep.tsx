import { useCharacterContext } from '@/hooks/useCharacterContext'
import { getItemDef, getItemNameKey } from '@/lib/sources/items'
import { BUNDLE_CATEGORIES } from '@/types/items'
import { useTranslation } from 'react-i18next'
import { ChoicePicker } from './ChoicePicker'
import type { ChoiceDecision } from '@/types/choices'
import type { PendingChoice } from '@/types/resolved'

export function EquipmentStep() {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')
  const context = useCharacterContext()
  const { resolved } = context

  const allEquipment = resolved?.equipment ?? []
  const allPendingChoices = resolved?.pendingChoices ?? []

  // Separate bundle-choice from other pending choices
  const bundleChoices = allPendingChoices.filter(
    (c): c is PendingChoice & { type: 'bundle-choice' } => c.type === 'bundle-choice',
  )
  const otherChoices = allPendingChoices.filter((c) => c.type !== 'bundle-choice')

  // Group bundle-choice pending choices by category, preserving fixed section order
  const bundleChoicesByCategory = Object.fromEntries(
    BUNDLE_CATEGORIES.map((cat) => [
      cat,
      bundleChoices.filter((c) => c.category === cat),
    ]),
  ) as Record<(typeof BUNDLE_CATEGORIES)[number], (PendingChoice & { type: 'bundle-choice' })[]>

  // Group resolved equipment by type for the summary
  const weapons = allEquipment.filter((e) => e.itemDef.type === 'weapon')
  const armor = allEquipment.filter((e) => e.itemDef.type === 'armor')
  const gear = allEquipment.filter((e) => e.itemDef.type === 'gear')
  const packs = allEquipment.filter((e) => e.itemDef.type === 'pack')

  const hasAnyEquipment = allEquipment.length > 0
  const hasBundleChoices = bundleChoices.length > 0
  const hasOtherChoices = otherChoices.length > 0

  function renderItemName(itemId: string): string {
    const itemDef = getItemDef(itemId)
    const type = itemDef?.type ?? 'gear'
    return t(getItemNameKey(type, itemId), { defaultValue: '' })
  }

  return (
    <div className="space-y-6">
      {/* Bundle-choice sections grouped by category */}
      {hasBundleChoices && (
        <div className="space-y-6">
          {BUNDLE_CATEGORIES.map((category) => {
            const choices = bundleChoicesByCategory[category]
            if (choices.length === 0) return null
            return (
              <div key={category} className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {tc(`characterBuilder.equipment.sections.${category}`)}
                </h3>
                {choices.map((choice) => {
                  const decision = context.build?.choices[choice.choiceKey]
                  return (
                    <ChoicePicker
                      key={choice.choiceKey}
                      choice={choice}
                      currentDecision={decision as ChoiceDecision | undefined}
                      onDecide={(key, d) => context.makeChoice(key, d)}
                      onClear={(key) => context.clearChoice(key)}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* Fallback flat list for non-bundle-choice pending choices (forward compat) */}
      {hasOtherChoices && (
        <div className="space-y-4">
          {otherChoices.map((choice) => {
            const decision = context.build?.choices[choice.choiceKey]
            return (
              <ChoicePicker
                key={choice.choiceKey}
                choice={choice}
                currentDecision={decision as ChoiceDecision | undefined}
                onDecide={(key, d) => context.makeChoice(key, d)}
                onClear={(key) => context.clearChoice(key)}
              />
            )
          })}
        </div>
      )}

      {!hasBundleChoices && !hasOtherChoices && (
        <p className="text-muted-foreground text-sm">
          {tc('characterBuilder.equipment.comingSoon')}
        </p>
      )}

      {/* Equipment Summary */}
      {hasAnyEquipment && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {tc('characterBuilder.equipment.summary')}
          </h3>
          <div className="space-y-3 text-sm">
            {weapons.length > 0 && (
              <div>
                <div className="text-xs font-bold text-muted-foreground mb-1 uppercase">
                  {t('weaponCategories.simple')}/{t('weaponCategories.martial')}
                </div>
                <ul className="space-y-0.5">
                  {weapons.map((e, i) => (
                    <li key={i} className="flex gap-2 text-foreground">
                      <span className="text-muted-foreground">{e.quantity}×</span>
                      <span>{renderItemName(e.itemId)}</span>
                      {e.itemDef.type === 'weapon' && (
                        <span className="text-muted-foreground">
                          ({e.itemDef.damageDice} {t(`damageTypes.${e.itemDef.damageType}`)})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {armor.length > 0 && (
              <div>
                <div className="text-xs font-bold text-muted-foreground mb-1 uppercase">
                  {tc('characterSheet.proficiencies.armor')}
                </div>
                <ul className="space-y-0.5">
                  {armor.map((e, i) => (
                    <li key={i} className="flex gap-2 text-foreground">
                      <span className="text-muted-foreground">{e.quantity}×</span>
                      <span>{renderItemName(e.itemId)}</span>
                      {e.itemDef.type === 'armor' && (
                        <span className="text-muted-foreground">
                          {tc('characterSheet.attacks.acFormat', { ac: e.itemDef.baseAc })}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {gear.length > 0 && (
              <div>
                <div className="text-xs font-bold text-muted-foreground mb-1 uppercase">
                  {tc('characterSheet.sections.equipment')}
                </div>
                <ul className="space-y-0.5">
                  {gear.map((e, i) => (
                    <li key={i} className="flex gap-2 text-foreground">
                      <span className="text-muted-foreground">{e.quantity}×</span>
                      <span>{renderItemName(e.itemId)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {packs.length > 0 && (
              <div>
                <ul className="space-y-0.5">
                  {packs.map((e, i) => (
                    <li key={i} className="flex gap-2 text-foreground">
                      <span className="text-muted-foreground">{e.quantity}×</span>
                      <span>{renderItemName(e.itemId)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
