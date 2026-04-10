import { Badge } from '@/components/ui/badge'
import { BonusBreakdown } from '@/components/character-sheet/BonusBreakdown'
import type { ResolvedAttack } from '@/types/resolved'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { getItemNameKey } from '@/lib/sources/items'
import { useTranslation } from 'react-i18next'

interface AttacksPanelProps {
  readonly attacks: readonly ResolvedAttack[]
}

function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`
}

export function AttacksPanel({ attacks }: AttacksPanelProps) {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">
        {tc('characterSheet.sections.attacks')}
      </h2>

      {attacks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tc('characterSheet.attacks.noAttacks')}</p>
      ) : (
        <div className="space-y-0.5 text-xs">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-1 py-1 text-[10px] font-bold text-muted-foreground uppercase">
            <span>{tc('characterSheet.attacks.name')}</span>
            <span className="text-center">{tc('characterSheet.attacks.attackBonus')}</span>
            <span>{tc('characterSheet.attacks.damage')}</span>
          </div>

          {attacks.map((attack, index) => {
            const isExpanded = expandedRows.has(index)
            const weaponName = t(getItemNameKey('weapon', attack.weaponId), { defaultValue: attack.weaponId })
            const damageType = t(`damageTypes.${attack.damageType}`)
            const damageStr = `${attack.damageDice}${attack.damageBonus !== 0 ? formatSigned(attack.damageBonus) : ''} ${damageType}`

            return (
              <div key={index}>
                <button
                  type="button"
                  onClick={() => toggleRow(index)}
                  className="grid grid-cols-[1fr_auto_1fr] gap-2 w-full px-1 py-1.5 rounded hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="flex items-center gap-1 text-foreground font-medium">
                    {isExpanded
                      ? <ChevronDown className="size-3 text-muted-foreground shrink-0" />
                      : <ChevronRight className="size-3 text-muted-foreground shrink-0" />}
                    {weaponName}
                  </span>
                  <span className="font-mono font-bold text-foreground text-center">
                    {formatSigned(attack.attackBonus)}
                  </span>
                  <span className="text-foreground">{damageStr}</span>
                </button>

                {isExpanded && (
                  <div className="ml-4 mb-2 space-y-2 px-1">
                    {/* Weapon properties */}
                    {attack.properties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {attack.properties.map((prop) => (
                          <Badge key={prop} variant="outline" className="text-[10px] py-0">
                            {t(`weaponProperties.${prop}`)}
                          </Badge>
                        ))}
                        {attack.range === 'ranged' && attack.normalRange !== undefined && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            {tc('characterSheet.attacks.range')}:{' '}
                            {tc('characterSheet.attacks.rangeFormat', {
                              normal: attack.normalRange,
                              long: attack.longRange ?? attack.normalRange,
                            })}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Attack breakdown */}
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">
                        {tc('characterSheet.attacks.attackBonus')}
                      </div>
                      <BonusBreakdown
                        components={attack.attackBreakdown}
                        total={attack.attackBonus}
                      />
                    </div>

                    {/* Damage breakdown */}
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">
                        {tc('characterSheet.attacks.damage')}
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        {attack.damageDice}
                        {attack.damageBreakdown.length > 0 && (
                          <BonusBreakdown
                            components={attack.damageBreakdown}
                            total={attack.damageBonus}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
