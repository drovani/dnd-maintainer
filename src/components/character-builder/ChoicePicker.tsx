import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  DND_LANGUAGES,
  DND_SKILLS,
  type LanguageId,
  type SkillId,
  type ToolProficiencyId,
} from '@/lib/dnd-helpers'
import { getItemDef } from '@/lib/sources/items'
import type { ChoiceDecision, ChoiceKey } from '@/types/choices'
import type { PendingChoice } from '@/types/resolved'
import { useTranslation } from 'react-i18next'

interface ChoicePickerProps {
  readonly choice: PendingChoice
  readonly currentDecision: ChoiceDecision | undefined
  readonly onDecide: (key: ChoiceKey, decision: ChoiceDecision) => void
  readonly onClear: (key: ChoiceKey) => void
}

const ALL_SKILL_IDS: readonly SkillId[] = DND_SKILLS.map((s) => s.id)
const ALL_LANGUAGE_IDS: readonly LanguageId[] = DND_LANGUAGES

function isSkillId(id: string): id is SkillId {
  return (ALL_SKILL_IDS as readonly string[]).includes(id)
}

function isLanguageId(id: string): id is LanguageId {
  return (ALL_LANGUAGE_IDS as readonly string[]).includes(id)
}

export function ChoicePicker({ choice, currentDecision, onDecide, onClear }: ChoicePickerProps) {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')

  if (choice.type === 'skill-choice') {
    const rawPool = choice.from ?? ALL_SKILL_IDS
    const pool: readonly SkillId[] = rawPool.filter(isSkillId)
    const current = currentDecision?.type === 'skill-choice' ? currentDecision.skills : []
    const atMax = current.length >= choice.count

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {tc('characterBuilder.pendingChoices.skillChoice', { count: choice.count })}
          </p>
          <Badge variant="outline" className="text-xs">
            {current.length} / {choice.count}
          </Badge>
        </div>
        <div className="space-y-1">
          {pool.map((skillId) => {
            const isSelected = current.includes(skillId)
            const isDisabled = atMax && !isSelected
            return (
              <div
                key={skillId}
                className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50"
              >
                <Checkbox
                  id={`choice-skill-${choice.choiceKey}-${skillId}`}
                  checked={isSelected}
                  disabled={isDisabled}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...current, skillId]
                      : current.filter((s) => s !== skillId)
                    if (next.length === 0) {
                      onClear(choice.choiceKey)
                    } else {
                      onDecide(choice.choiceKey, { type: 'skill-choice', skills: next })
                    }
                  }}
                />
                <Label
                  htmlFor={`choice-skill-${choice.choiceKey}-${skillId}`}
                  className="flex-1 cursor-pointer"
                >
                  {t(`skills.${skillId}`)}
                </Label>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (choice.type === 'language-choice') {
    const rawPool = choice.from ?? ALL_LANGUAGE_IDS
    const pool: readonly LanguageId[] = rawPool.filter(isLanguageId)
    const current = currentDecision?.type === 'language-choice' ? currentDecision.languages : []
    const atMax = current.length >= choice.count

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {tc('characterBuilder.pendingChoices.languageChoice', { count: choice.count })}
          </p>
          <Badge variant="outline" className="text-xs">
            {current.length} / {choice.count}
          </Badge>
        </div>
        <div className="space-y-1">
          {pool.map((langId) => {
            const isSelected = current.includes(langId)
            const isDisabled = atMax && !isSelected
            return (
              <div
                key={langId}
                className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50"
              >
                <Checkbox
                  id={`choice-lang-${choice.choiceKey}-${langId}`}
                  checked={isSelected}
                  disabled={isDisabled}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...current, langId]
                      : current.filter((l) => l !== langId)
                    if (next.length === 0) {
                      onClear(choice.choiceKey)
                    } else {
                      onDecide(choice.choiceKey, { type: 'language-choice', languages: next })
                    }
                  }}
                />
                <Label
                  htmlFor={`choice-lang-${choice.choiceKey}-${langId}`}
                  className="flex-1 cursor-pointer"
                >
                  {t(`languages.${langId}`)}
                </Label>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (choice.type === 'tool-choice') {
    const rawPool: readonly string[] = choice.from ?? []
    // Tool IDs come from the source data — use them directly since ToolProficiencyId is not exportable as a set
    const pool = rawPool as readonly ToolProficiencyId[]
    const current = currentDecision?.type === 'tool-choice' ? currentDecision.tools : []
    const atMax = current.length >= choice.count

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {tc('characterBuilder.pendingChoices.toolChoice', { count: choice.count })}
          </p>
          <Badge variant="outline" className="text-xs">
            {current.length} / {choice.count}
          </Badge>
        </div>
        <div className="space-y-1">
          {pool.map((toolId) => {
            const isSelected = current.includes(toolId)
            const isDisabled = atMax && !isSelected
            return (
              <div
                key={toolId}
                className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50"
              >
                <Checkbox
                  id={`choice-tool-${choice.choiceKey}-${toolId}`}
                  checked={isSelected}
                  disabled={isDisabled}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...current, toolId]
                      : current.filter((tool) => tool !== toolId)
                    if (next.length === 0) {
                      onClear(choice.choiceKey)
                    } else {
                      onDecide(choice.choiceKey, { type: 'tool-choice', tools: next })
                    }
                  }}
                />
                <Label
                  htmlFor={`choice-tool-${choice.choiceKey}-${toolId}`}
                  className="flex-1 cursor-pointer"
                >
                  {t(`tools.${toolId}`)}
                </Label>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (choice.type === 'equipment-choice') {
    const currentOptionIndex =
      currentDecision?.type === 'equipment-choice' ? currentDecision.optionIndex : undefined

    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {tc('characterBuilder.equipment.choiceLabel')}
        </p>
        <div className="space-y-2">
          {choice.options.map((option, optionIndex) => {
            const isSelected = currentOptionIndex === optionIndex
            const optionLabel = option
              .map(({ itemId, quantity }) => {
                const itemDef = getItemDef(itemId)
                const type = itemDef?.type ?? 'gear'
                const name = t(`items.${type}s.${itemId}.name` as Parameters<typeof t>[0], {
                  defaultValue: itemId,
                })
                const detail = (() => {
                  if (itemDef?.type === 'weapon') {
                    const props = itemDef.properties
                      .map((p) => t(`weaponProperties.${p}`))
                      .join(', ')
                    const dmgType = t(`damageTypes.${itemDef.damageType}`)
                    return ` (${itemDef.damageDice} ${dmgType}${props ? `, ${props}` : ''})`
                  }
                  if (itemDef?.type === 'armor') {
                    return ` (AC ${itemDef.baseAc})`
                  }
                  return ''
                })()
                const quantityPrefix = quantity > 1 ? `${quantity}× ` : ''
                return `${quantityPrefix}${name}${detail}`
              })
              .join(` ${tc('characterBuilder.equipment.optionSeparator')} `)

            return (
              <div
                key={optionIndex}
                className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50"
              >
                <input
                  type="radio"
                  id={`choice-equip-${choice.choiceKey}-${optionIndex}`}
                  name={`choice-equip-${choice.choiceKey}`}
                  checked={isSelected}
                  onChange={() =>
                    onDecide(choice.choiceKey, {
                      type: 'equipment-choice',
                      optionIndex,
                    })
                  }
                  className="size-4 text-primary"
                />
                <Label
                  htmlFor={`choice-equip-${choice.choiceKey}-${optionIndex}`}
                  className="flex-1 cursor-pointer"
                >
                  {optionLabel}
                </Label>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Unsupported choice types
  return (
    <p className="text-sm text-muted-foreground italic">
      {tc('characterBuilder.pendingChoices.unsupported', { type: choice.type })}
    </p>
  )
}
