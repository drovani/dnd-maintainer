import { DND_SKILLS } from '@/lib/dnd-helpers'
import type { SkillId } from '@/lib/dnd-helpers'
import type { ResolvedSkill } from '@/types/resolved'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface SkillsPanelProps {
  readonly skills: Readonly<Record<SkillId, ResolvedSkill>>
}

function formatBonus(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`
}

function BreakdownLabel({ type, label }: { type: string; label: string }) {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')

  if (type === 'ability') return <>{t(`abilities.${label as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'}`)}</>
  if (type === 'proficiency') return <>{tc('characterSheet.skillBreakdown.proficiency')}</>
  if (type === 'expertise') return <>{tc('characterSheet.skillBreakdown.expertise')}</>
  return <>{t(`features.${label}.name`, { defaultValue: label })}</>
}

export function SkillsPanel({ skills }: SkillsPanelProps) {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')
  const [expanded, setExpanded] = useState<Set<SkillId>>(new Set())

  const sortedSkills = [...DND_SKILLS].sort((a, b) =>
    t(`skills.${a.id}`).localeCompare(t(`skills.${b.id}`)),
  )

  const allExpanded = expanded.size === sortedSkills.length
  const toggleAll = () => {
    if (allExpanded) {
      setExpanded(new Set())
    } else {
      setExpanded(new Set(sortedSkills.map((s) => s.id)))
    }
  }

  const toggleSkill = (id: SkillId) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">{tc('characterSheet.sections.skills')}</h2>
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {allExpanded
            ? tc('characterSheet.skillBreakdown.collapseAll')
            : tc('characterSheet.skillBreakdown.expandAll')}
        </button>
      </div>
      <div className="space-y-0.5 text-xs">
        {sortedSkills.map((skill) => {
          const resolved = skills[skill.id as keyof typeof skills]
          if (!resolved) return null
          const isExpanded = expanded.has(skill.id)
          const abbrev = t(`abilityAbbreviations.${skill.ability}`)

          return (
            <div key={skill.id}>
              <button
                type="button"
                onClick={() => toggleSkill(skill.id)}
                className="flex items-center justify-between w-full text-foreground py-1 hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
              >
                <span className="flex items-center gap-1">
                  {isExpanded
                    ? <ChevronDown className="size-3 text-muted-foreground" />
                    : <ChevronRight className="size-3 text-muted-foreground" />}
                  <span className={resolved.proficient ? 'font-bold' : ''}>
                    {t(`skills.${skill.id}`)}
                    <span className="text-xs text-muted-foreground ml-1">({abbrev})</span>
                  </span>
                </span>
                <span
                  className={`font-mono ${resolved.expertise ? 'text-green-600 font-bold' : 'text-muted-foreground'}`}
                >
                  {formatBonus(resolved.bonus)}
                </span>
              </button>
              {isExpanded && (
                <div className="ml-5 mb-1 space-y-0.5">
                  {resolved.breakdown.map((component, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-muted-foreground py-0.5"
                    >
                      <span className="text-[11px]">
                        <BreakdownLabel type={component.type} label={component.label} />
                      </span>
                      <span className="font-mono text-[11px]">
                        {formatBonus(component.value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
