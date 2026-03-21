import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  ABILITY_ABBREVIATIONS,
  DND_CLASSES,
  DND_SKILLS,
  getAbilityModifier,
  getProficiencyBonus,
} from '@/lib/dnd-helpers'
import type { AbilityScores } from '@/types/database'
import { useTranslation } from 'react-i18next'
import type { CharacterData } from './types'

interface SkillsStepProps {
  characterClass: string
  level: number
  skills: CharacterData['skills']
  abilities: AbilityScores
  racialBonuses: Partial<AbilityScores>
  onSkillToggle: (skillId: string) => void
}

export function SkillsStep({
  characterClass,
  level,
  skills,
  abilities,
  racialBonuses,
  onSkillToggle,
}: SkillsStepProps) {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')
  const cls = DND_CLASSES.find((c) => c.id === characterClass)
  if (!cls) {
    return (
      <p className="text-muted-foreground text-sm">
        {tc('characterBuilder.skills.selectClassFirst')}
      </p>
    )
  }

  const profBonus = getProficiencyBonus(level)
  const selectedCount = Object.values(skills).filter((s) => s.proficient).length
  const atMax = selectedCount >= cls.skillChoices

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        {tc('characterBuilder.skills.chooseSkills', { count: cls.skillChoices })}{' '}
        <span className="font-medium text-foreground">{tc('characterBuilder.skills.selected', { count: selectedCount, max: cls.skillChoices })}</span>
      </p>
      <div className="space-y-1">
        {DND_SKILLS.map((skill) => {
          const skillData = skills[skill.id] ?? { proficient: false, expertise: false }
          const abilityKey = skill.ability
          const abilityMod = getAbilityModifier(abilities[abilityKey] + (racialBonuses[abilityKey] ?? 0))
          const totalMod = skillData.proficient ? abilityMod + profBonus : abilityMod
          const abbrev = t(`abilityAbbreviations.${abilityKey}`, { defaultValue: ABILITY_ABBREVIATIONS[abilityKey] })
          const inPool = cls.skillPool === null || (cls.skillPool as readonly string[]).includes(skill.id)
          const isDisabled = !inPool || (atMax && !skillData.proficient)

          return (
            <div
              key={skill.id}
              className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50"
            >
              {inPool ? (
                <Checkbox
                  id={`prof-${skill.id}`}
                  checked={skillData.proficient}
                  onCheckedChange={() => onSkillToggle(skill.id)}
                  disabled={isDisabled}
                />
              ) : (
                <div className="size-4" />
              )}
              <span className={`w-8 text-right text-sm font-bold tabular-nums ${totalMod >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {totalMod >= 0 ? '+' : ''}{totalMod}
              </span>
              <Label
                htmlFor={`prof-${skill.id}`}
                className="flex-1 cursor-pointer"
              >
                {t(`skills.${skill.id}`)}
                <span className="text-xs text-muted-foreground">
                  ({abbrev} {abilityMod >= 0 ? '+' : ''}{abilityMod})
                </span>
              </Label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
