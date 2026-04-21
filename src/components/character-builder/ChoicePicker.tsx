import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DND_LANGUAGES,
  DND_SKILLS,
  type LanguageId,
  type SkillId,
  type ToolProficiencyId,
} from '@/lib/dnd-helpers'
import { getItemDef, getItemNameKey } from '@/lib/sources/items'
import {
  getBundleDef,
  getBundleNameKey,
  getItemsForSlot,
  resolveBundleRef,
} from '@/lib/sources/bundles'
import type { ChoiceDecision, ChoiceKey } from '@/types/choices'
import type { BundleSlot, ItemDef, SlotFilter } from '@/types/items'
import type { PendingChoice } from '@/types/resolved'
import { getGrantIcon } from '@/lib/class-icons'
import type { TFunction } from 'i18next'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type GamedataT = TFunction<'gamedata'>

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

  if (choice.type === 'bundle-choice') {
    const currentBundleId =
      currentDecision?.type === 'bundle-choice' ? currentDecision.bundleId : undefined
    const currentSlotPicks =
      currentDecision?.type === 'bundle-choice' ? currentDecision.slotPicks : {}

    function selectBundle(bundleId: string) {
      onDecide(choice.choiceKey, {
        type: 'bundle-choice',
        bundleId,
        slotPicks: {},
      })
    }

    function updateSlotPick(bundleId: string, slotKey: string, itemId: string) {
      onDecide(choice.choiceKey, {
        type: 'bundle-choice',
        bundleId,
        slotPicks: { ...currentSlotPicks, [slotKey]: itemId },
      })
    }

    const isPackCategory = choice.category === 'pack'
    const grantIcon = getGrantIcon(choice.source, choice.category)

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {tc('characterBuilder.equipment.choiceLabel')}
          </p>
          {currentBundleId !== undefined && (
            <Button variant="ghost" size="sm" onClick={() => onClear(choice.choiceKey)}>
              {tc('characterBuilder.equipment.clearSelection')}
            </Button>
          )}
        </div>
        <div className={isPackCategory ? 'grid gap-3 sm:grid-cols-2' : 'space-y-2'}>
          {choice.bundleIds.map((bundleId) => {
            let ref: ReturnType<typeof resolveBundleRef> | null = null
            try {
              ref = resolveBundleRef(bundleId)
            } catch (err) {
              console.warn(`ChoicePicker: skipping unknown bundleId "${bundleId}"`, err)
              return null
            }
            const isSelected = currentBundleId === bundleId

            if (isPackCategory && ref.kind === 'pack') {
              return (
                <BundlePackCard
                  key={bundleId}
                  choiceKey={choice.choiceKey}
                  bundleId={bundleId}
                  contents={ref.contents}
                  isSelected={isSelected}
                  icon={grantIcon}
                  onSelect={() => selectBundle(bundleId)}
                />
              )
            }

            return (
              <BundleRadioOption
                key={bundleId}
                choiceKey={choice.choiceKey}
                bundleId={bundleId}
                contents={ref.contents}
                kind={ref.kind}
                isSelected={isSelected}
                icon={grantIcon}
                slotPicks={isSelected ? currentSlotPicks : {}}
                onSelect={() => selectBundle(bundleId)}
                onSlotPick={(slotKey, itemId) => updateSlotPick(bundleId, slotKey, itemId)}
              />
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

// ---------------------------------------------------------------------------
// Helper components used by the bundle-choice branch
// ---------------------------------------------------------------------------

interface BundleContentItem {
  readonly itemId: string
  readonly quantity: number
}

interface BundlePackCardProps {
  readonly choiceKey: ChoiceKey
  readonly bundleId: string
  readonly contents: readonly BundleContentItem[]
  readonly isSelected: boolean
  readonly icon: LucideIcon | null
  readonly onSelect: () => void
}

function BundlePackCard({
  choiceKey,
  bundleId,
  contents,
  isSelected,
  icon: Icon,
  onSelect,
}: BundlePackCardProps) {
  const { t } = useTranslation('gamedata')
  const packName = t(getItemNameKey('pack', bundleId), { defaultValue: bundleId })
  const radioId = `choice-bundle-${choiceKey}-${bundleId}`

  return (
    <Card
      size="sm"
      onClick={onSelect}
      className={`cursor-pointer transition-colors hover:bg-muted/30 ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      data-testid={`bundle-pack-card-${bundleId}`}
    >
      <CardContent className="space-y-2">
        <div className="flex items-start gap-3">
          <input
            type="radio"
            id={radioId}
            name={`choice-bundle-${choiceKey}`}
            checked={isSelected}
            onChange={onSelect}
            className="mt-1 size-4 text-primary"
          />
          <CardTitle className="flex-1">
            <Label htmlFor={radioId} className="cursor-pointer">
              {packName}
            </Label>
          </CardTitle>
          {Icon && <Icon aria-hidden className="size-5 text-muted-foreground shrink-0" />}
        </div>
        <ul className="ml-7 space-y-0.5 text-xs text-muted-foreground">
          {contents.map(({ itemId, quantity }) => {
            const itemDef = getItemDef(itemId)
            const type = itemDef?.type ?? 'gear'
            const name = t(getItemNameKey(type, itemId), { defaultValue: itemId })
            return (
              <li key={itemId}>
                {quantity > 1 ? `${quantity}× ` : ''}
                {name}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

interface BundleRadioOptionProps {
  readonly choiceKey: ChoiceKey
  readonly bundleId: string
  readonly contents: readonly BundleContentItem[]
  readonly kind: 'bundle' | 'pack'
  readonly isSelected: boolean
  readonly icon: LucideIcon | null
  readonly slotPicks: Readonly<Record<string, string>>
  readonly onSelect: () => void
  readonly onSlotPick: (slotKey: string, itemId: string) => void
}

function BundleRadioOption({
  choiceKey,
  bundleId,
  contents,
  kind,
  isSelected,
  icon: Icon,
  slotPicks,
  onSelect,
  onSlotPick,
}: BundleRadioOptionProps) {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')

  const fixedItemLabel = contents
    .map(({ itemId, quantity }) => formatItemLabel(itemId, quantity, t))
    .join(` ${tc('characterBuilder.equipment.itemBundleSeparator')} `)

  const bundleName =
    kind === 'pack'
      ? t(getItemNameKey('pack', bundleId), { defaultValue: bundleId })
      : t(getBundleNameKey(bundleId), { defaultValue: bundleId })

  const bundleDef = kind === 'bundle' ? getBundleDef(bundleId) : undefined
  const slots = bundleDef?.slots ?? []
  const hasSlots = slots.length > 0

  // Label for the radio row:
  // - slotted bundles → use the bundle's canonical name ("A martial weapon and a shield")
  // - fixed bundles → fall back to the joined item list if the canonical name is missing
  const radioLabel = hasSlots ? bundleName : fixedItemLabel || bundleName
  const radioId = `choice-bundle-${choiceKey}-${bundleId}`

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50">
        <input
          type="radio"
          id={radioId}
          name={`choice-bundle-${choiceKey}`}
          checked={isSelected}
          onChange={onSelect}
          className="size-4 text-primary"
        />
        <Label htmlFor={radioId} className="flex-1 cursor-pointer">
          {radioLabel}
        </Label>
        {Icon && <Icon aria-hidden className="size-5 text-muted-foreground shrink-0" />}
      </div>
      {isSelected && hasSlots && (
        <div className="ml-7 space-y-2">
          {slots.map((slot) => (
            <SlotPicker
              key={slot.slotKey}
              slot={slot}
              value={slotPicks[slot.slotKey]}
              onPick={(itemId) => onSlotPick(slot.slotKey, itemId)}
            />
          ))}
          {contents.length > 0 && (
            <div
              className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2"
              data-testid={`bundle-fixed-contents-${bundleId}`}
            >
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                {tc('characterBuilder.equipment.alsoIncludes')}
              </p>
              <ul className="space-y-0.5 text-xs text-foreground">
                {contents.map(({ itemId, quantity }) => (
                  <li key={itemId}>{formatItemLabel(itemId, quantity, t)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface SlotPickerProps {
  readonly slot: BundleSlot
  readonly value: string | undefined
  readonly onPick: (itemId: string) => void
}

function SlotPicker({ slot, value, onPick }: SlotPickerProps) {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')

  const items = getItemsForSlot(slot.filter)
  const slotLabel = tc(getSlotLabelKey(slot.filter))
  const selectItems = items.map((item) => ({
    value: item.id,
    label: t(getItemNameKey(item.type, item.id), { defaultValue: item.id }),
  }))

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">
        {tc('characterBuilder.equipment.slotChoosePrompt', { label: slotLabel })}
      </Label>
      <Select
        value={value ?? null}
        onValueChange={(next) => {
          if (next) onPick(next)
        }}
        items={selectItems}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={tc('characterBuilder.equipment.slotPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {formatItemLabel(item.id, 1, t, item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatItemLabel(
  itemId: string,
  quantity: number,
  t: GamedataT,
  explicitDef?: ItemDef,
): string {
  const itemDef = explicitDef ?? getItemDef(itemId)
  const type = itemDef?.type ?? 'gear'
  const name = t(getItemNameKey(type, itemId), { defaultValue: itemId })
  const detail = itemDetailSuffix(itemDef, t)
  const quantityPrefix = quantity > 1 ? `${quantity}× ` : ''
  return `${quantityPrefix}${name}${detail}`
}

function itemDetailSuffix(itemDef: ItemDef | undefined, t: GamedataT): string {
  if (itemDef?.type === 'weapon') {
    const props = itemDef.properties.map((p) => t(`weaponProperties.${p}`)).join(', ')
    const dmgType = t(`damageTypes.${itemDef.damageType}`)
    return ` (${itemDef.damageDice} ${dmgType}${props ? `, ${props}` : ''})`
  }
  if (itemDef?.type === 'armor') {
    return ` (AC ${itemDef.baseAc})`
  }
  return ''
}

/**
 * Returns the typed common.json translation key for a slot's human-readable label.
 * Using literal returns keeps the type narrow for `tc(...)` call sites.
 */
function getSlotLabelKey(
  filter: SlotFilter,
):
  | 'characterBuilder.equipment.slotLabels.weaponMartial'
  | 'characterBuilder.equipment.slotLabels.weaponMartialMelee'
  | 'characterBuilder.equipment.slotLabels.weaponMartialRanged'
  | 'characterBuilder.equipment.slotLabels.weaponSimple'
  | 'characterBuilder.equipment.slotLabels.weaponSimpleMelee'
  | 'characterBuilder.equipment.slotLabels.weaponSimpleRanged'
  | 'characterBuilder.equipment.slotLabels.weaponAny'
  | 'characterBuilder.equipment.slotLabels.armorLight'
  | 'characterBuilder.equipment.slotLabels.armorMedium'
  | 'characterBuilder.equipment.slotLabels.armorHeavy'
  | 'characterBuilder.equipment.slotLabels.armorShield' {
  if (filter.kind === 'weapon') {
    if (filter.category === 'martial' && filter.range === 'melee')
      return 'characterBuilder.equipment.slotLabels.weaponMartialMelee'
    if (filter.category === 'martial' && filter.range === 'ranged')
      return 'characterBuilder.equipment.slotLabels.weaponMartialRanged'
    if (filter.category === 'simple' && filter.range === 'melee')
      return 'characterBuilder.equipment.slotLabels.weaponSimpleMelee'
    if (filter.category === 'simple' && filter.range === 'ranged')
      return 'characterBuilder.equipment.slotLabels.weaponSimpleRanged'
    if (filter.category === 'martial') return 'characterBuilder.equipment.slotLabels.weaponMartial'
    if (filter.category === 'simple') return 'characterBuilder.equipment.slotLabels.weaponSimple'
    return 'characterBuilder.equipment.slotLabels.weaponAny'
  }
  if (filter.category === 'shield') return 'characterBuilder.equipment.slotLabels.armorShield'
  if (filter.category === 'light') return 'characterBuilder.equipment.slotLabels.armorLight'
  if (filter.category === 'medium') return 'characterBuilder.equipment.slotLabels.armorMedium'
  if (filter.category === 'heavy') return 'characterBuilder.equipment.slotLabels.armorHeavy'
  const _exhaustive: never = filter.category
  throw new Error(`Unhandled armor category: ${_exhaustive}`)
}
