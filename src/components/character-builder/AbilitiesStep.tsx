import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DndRace } from '@/lib/dnd-helpers'
import {
  getAbilityModifier,
  getPointBuyCost,
  getPointBuyDecrementReturn,
  getPointBuyEquivalent,
  getPointBuyIncrementCost,
  POINT_BUY_TOTAL,
  rollAbilityScores,
  STANDARD_ARRAY,
} from '@/lib/dnd-helpers'
import type { AbilityScores } from '@/types/database'
import { Check, ChevronDown, ChevronUp, Dices, TrendingDown, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterData } from './types'

interface AbilitiesStepProps {
  abilityMethod: CharacterData['abilityMethod']
  abilities: AbilityScores
  abilityAssignments: Record<keyof AbilityScores, number | null>
  rolledValues: number[]
  racialBonuses: Partial<AbilityScores>
  selectedRace: DndRace | undefined
  onMethodChange: (method: CharacterData['abilityMethod']) => void
  onAbilitiesChange: (
    abilities: AbilityScores,
    assignments: Record<keyof AbilityScores, number | null>,
    rolledValues?: number[]
  ) => void
}

export function AbilitiesStep({
  abilityMethod,
  abilities,
  abilityAssignments,
  rolledValues,
  racialBonuses,
  selectedRace,
  onMethodChange,
  onAbilitiesChange,
}: AbilitiesStepProps) {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')
  const [isRolling, setIsRolling] = useState<boolean>(false)
  const [displayedRolls, setDisplayedRolls] = useState<number[]>([])
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onAbilitiesChangeRef = useRef(onAbilitiesChange)
  onAbilitiesChangeRef.current = onAbilitiesChange

  // Cleanup interval on unmount to prevent leaks
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current)
    }
  }, [])

  const updateAbility = (ability: keyof AbilityScores, value: number) => {
    onAbilitiesChange({ ...abilities, [ability]: value }, abilityAssignments)
  }

  const assignAbilityScore = (ability: keyof AbilityScores, value: number | null) => {
    const newAssignments = { ...abilityAssignments, [ability]: value }
    // Only unassign a conflict if the value is used more times than it appears in the pool
    if (value !== null) {
      const pool = abilityMethod === 'standard-array' ? STANDARD_ARRAY : rolledValues
      const poolCount = pool.filter((v) => v === value).length
      const assignedCount = Object.entries(newAssignments)
        .filter(([, val]) => val === value).length
      if (assignedCount > poolCount) {
        // Unassign the first other ability that has this value
        for (const key of Object.keys(newAssignments) as Array<keyof AbilityScores>) {
          if (key !== ability && newAssignments[key] === value) {
            newAssignments[key] = null
            break
          }
        }
      }
    }
    const newAbilities = { ...abilities }
    for (const key of Object.keys(newAbilities) as Array<keyof typeof newAbilities>) {
      newAbilities[key] = (newAssignments[key] as number) ?? 10
    }
    onAbilitiesChange(newAbilities, newAssignments)
  }

  const unassignValue = (value: number) => {
    const abilityToUnassign = Object.entries(abilityAssignments)
      .find(([, val]) => val === value)?.[0]
    if (!abilityToUnassign) return
    const newAssignments = { ...abilityAssignments, [abilityToUnassign]: null }
    const newAbilities = { ...abilities }
    for (const key of Object.keys(newAbilities) as Array<keyof typeof newAbilities>) {
      newAbilities[key] = (newAssignments[key] as number) ?? 10
    }
    onAbilitiesChange(newAbilities, newAssignments)
  }

  const handleRollScores = useCallback(() => {
    if (isRolling) return
    setIsRolling(true)
    setDisplayedRolls(Array.from({ length: 6 }, () => Math.floor(Math.random() * 13) + 3))

    const finalValues = rollAbilityScores()
    let ticks = 0
    const totalTicks = 12

    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current)
    rollIntervalRef.current = setInterval(() => {
      ticks++
      if (ticks < totalTicks) {
        setDisplayedRolls(Array.from({ length: 6 }, () => Math.floor(Math.random() * 13) + 3))
      } else {
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current)
        setDisplayedRolls(finalValues)
        const resetAbilities: AbilityScores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
        const resetAssignments: Record<keyof AbilityScores, number | null> = { str: null, dex: null, con: null, int: null, wis: null, cha: null }
        onAbilitiesChangeRef.current(resetAbilities, resetAssignments, finalValues)
        setIsRolling(false)
      }
    }, 80)
  }, [isRolling])

  const incrementAbility = (ability: keyof AbilityScores) => {
    const current = abilities[ability]
    if (current >= 15) return
    const cost = getPointBuyIncrementCost(current)
    const spent = Object.values(abilities).reduce((sum, s) => sum + getPointBuyCost(s), 0)
    if (POINT_BUY_TOTAL - spent < cost) return
    updateAbility(ability, current + 1)
  }

  const decrementAbility = (ability: keyof AbilityScores) => {
    const current = abilities[ability]
    if (current <= 8) return
    updateAbility(ability, current - 1)
  }

  const renderAbilityCard = (ability: keyof AbilityScores, scoreInput: React.ReactNode) => {
    const baseScore = abilities[ability]
    const raceBonus = racialBonuses[ability] ?? 0
    const totalScore = baseScore + raceBonus
    const modifier = getAbilityModifier(totalScore)

    return (
      <Card key={ability}>
        <CardContent className="px-3 py-2 space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground">{t(`abilities.${ability}`)}</Label>
          <div className="flex items-center justify-between gap-2">
            <div className="shrink-0">{scoreInput}</div>
            {raceBonus > 0 && selectedRace && (
              <Badge
                variant="secondary"
                className="text-[10px] shrink-0 px-1.5 py-0 cursor-default select-none"
                title={`${t(`races.${selectedRace.id}`)} Racial Bonus: ${Object.entries(selectedRace.abilityBonuses).map(([ab, val]) => `+${val} ${t(`abilities.${ab as keyof AbilityScores}`)}`).join(', ')}`}
              >
                +{raceBonus}
              </Badge>
            )}
            <div className="flex items-baseline gap-2 ml-auto">
              <span className="text-sm font-bold">{totalScore}</span>
              <span className={`text-lg font-bold ${modifier >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {modifier >= 0 ? '+' : ''}{modifier}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderAssignmentSelect = (ability: keyof AbilityScores, availableValues: readonly number[]) => {
    const currentValue = abilityAssignments[ability]
    const options = [...new Set(availableValues)].sort((a, b) => b - a)
    const assignedByOthers = new Set(
      Object.entries(abilityAssignments)
        .filter(([key, val]) => key !== ability && val !== null)
        .map(([, val]) => val as number)
    )

    return (
      <Select
        value={currentValue !== null ? String(currentValue) : ''}
        onValueChange={(val) => assignAbilityScore(ability, val ? Number(val) : null)}
      >
        <SelectTrigger size="sm" className="w-16 text-center font-bold">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {options.map((v) => (
            <SelectItem key={v} value={String(v)}>
              <span className="flex items-center justify-between w-full">
                {v}
                {assignedByOthers.has(v) && v !== currentValue && (
                  <Check className="size-3 text-muted-foreground" />
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  const abilityKeys = Object.keys(abilities) as Array<keyof AbilityScores>
  const pointsSpent = Object.values(abilities).reduce((sum, s) => sum + getPointBuyCost(s), 0)
  const pointsRemaining = POINT_BUY_TOTAL - pointsSpent
  const rollValues = isRolling ? displayedRolls : rolledValues
  const pointBuyEquiv = rolledValues.length > 0 ? getPointBuyEquivalent(rolledValues) : null
  const pointBuyDiff = pointBuyEquiv !== null ? pointBuyEquiv - POINT_BUY_TOTAL : null

  const handleMethodChange = (val: string) => {
    const VALID_METHODS: CharacterData['abilityMethod'][] = ['standard-array', 'point-buy', 'rolling']
    if (!VALID_METHODS.includes(val as CharacterData['abilityMethod'])) return
    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current)
      rollIntervalRef.current = null
    }
    setDisplayedRolls([])
    setIsRolling(false)
    onMethodChange(val as CharacterData['abilityMethod'])
  }

  return (
    <div className="space-y-4">
      <Tabs value={abilityMethod} onValueChange={handleMethodChange}>
        <TabsList className="w-full">
          <TabsTrigger value="standard-array" className="flex-1">{tc('characterBuilder.abilities.standardArray')}</TabsTrigger>
          <TabsTrigger value="point-buy" className="flex-1">{tc('characterBuilder.abilities.pointBuy')}</TabsTrigger>
          <TabsTrigger value="rolling" className="flex-1">{tc('characterBuilder.abilities.rolling')}</TabsTrigger>
        </TabsList>

        <TabsContent value="standard-array" className="space-y-3 mt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground text-sm">
              {tc('characterBuilder.abilities.assignEachValue')}
            </p>
            <div className="flex gap-1.5">
              {STANDARD_ARRAY.map((v) => {
                const isAssigned = Object.values(abilityAssignments).includes(v)
                return (
                  <Badge
                    key={v}
                    variant={isAssigned ? 'outline' : 'default'}
                    className={`text-xs select-none ${isAssigned ? 'opacity-30 cursor-pointer hover:opacity-60 transition-opacity' : 'cursor-default'}`}
                    onClick={isAssigned ? () => unassignValue(v) : undefined}
                  >
                    {v}
                  </Badge>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {abilityKeys.map((ability) =>
              renderAbilityCard(ability, renderAssignmentSelect(ability, STANDARD_ARRAY))
            )}
          </div>
        </TabsContent>

        <TabsContent value="point-buy" className="space-y-3 mt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground text-sm">
              {tc('characterBuilder.abilities.spendPoints')}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{tc('characterBuilder.abilities.points')}</span>
              <span className={`text-2xl font-bold tabular-nums ${pointsRemaining === 0 ? 'text-muted-foreground' : pointsRemaining < 5 ? 'text-amber-600' : 'text-foreground'}`}>
                {pointsRemaining}
              </span>
              <span className="text-sm text-muted-foreground">/ {POINT_BUY_TOTAL}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {abilityKeys.map((ability) => {
              const score = abilities[ability]
              const canIncrement = score < 15 && pointsRemaining >= getPointBuyIncrementCost(score)
              const canDecrement = score > 8
              const incCost = score < 15 ? getPointBuyIncrementCost(score) : 0
              const decReturn = score > 8 ? getPointBuyDecrementReturn(score) : 0

              return renderAbilityCard(
                ability,
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => decrementAbility(ability)}
                    disabled={!canDecrement}
                    title={canDecrement ? `Decrease score, return ${decReturn} point${decReturn > 1 ? 's' : ''}` : tc('characterBuilder.abilities.minimumScore')}
                  >
                    <ChevronDown className="size-3" />
                    {canDecrement && <span className="text-[10px] font-bold text-green-600">+{decReturn}</span>}
                  </Button>
                  <span className="text-lg font-bold w-8 text-center tabular-nums">{score}</span>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => incrementAbility(ability)}
                    disabled={!canIncrement}
                    title={canIncrement ? `Increase score, spend ${incCost} point${incCost > 1 ? 's' : ''}` : score >= 15 ? tc('characterBuilder.abilities.maximumScore') : tc('characterBuilder.abilities.notEnoughPoints')}
                  >
                    <ChevronUp className="size-3" />
                    {canIncrement && <span className="text-[10px] font-bold text-red-600">{incCost}</span>}
                  </Button>
                </div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="rolling" className="space-y-3 mt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground text-sm">
              {tc('characterBuilder.abilities.rollInstructions')}
            </p>
            <div className="flex items-center gap-3">
              {pointBuyDiff !== null && !isRolling && (
                <div className={`flex items-center gap-1 text-sm font-medium ${pointBuyDiff > 0 ? 'text-green-600' : pointBuyDiff < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {pointBuyDiff > 0 ? <TrendingUp className="size-4" /> : pointBuyDiff < 0 ? <TrendingDown className="size-4" /> : null}
                  <span>
                    {pointBuyDiff > 0 ? `+${pointBuyDiff}` : pointBuyDiff < 0 ? `${pointBuyDiff}` : tc('characterBuilder.abilities.even')}
                    {' '}{tc('characterBuilder.abilities.vsPointBuy')}
                  </span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleRollScores} disabled={isRolling}>
                <Dices className={`size-4 mr-1.5 ${isRolling ? 'animate-spin' : ''}`} />
                {rolledValues.length > 0 && !isRolling ? tc('buttons.reRoll') : isRolling ? tc('buttons.rolling') : tc('buttons.rollScores')}
              </Button>
            </div>
          </div>
          {(rollValues.length > 0) && (
            <div className="flex gap-1.5">
              {rollValues.map((v, i) => {
                // Count how many of this value are assigned vs how many appear up to and including this index
                const assignedCount = !isRolling ? Object.values(abilityAssignments).filter((a) => a === v).length : 0
                const poolCountUpToHere = rollValues.slice(0, i + 1).filter((rv) => rv === v).length
                const isAssigned = assignedCount >= poolCountUpToHere
                return (
                  <Badge
                    key={i}
                    variant={isAssigned ? 'outline' : 'default'}
                    className={`text-xs select-none transition-all duration-100 ${isAssigned ? 'opacity-30 cursor-pointer hover:opacity-60' : 'cursor-default'} ${isRolling ? 'animate-pulse' : ''}`}
                    onClick={isAssigned && !isRolling ? () => unassignValue(v) : undefined}
                  >
                    {v}
                  </Badge>
                )
              })}
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {abilityKeys.map((ability) =>
              renderAbilityCard(
                ability,
                rolledValues.length > 0 && !isRolling
                  ? renderAssignmentSelect(ability, rolledValues)
                  : <span className="text-xs text-muted-foreground w-16 text-center">{isRolling ? '...' : tc('characterBuilder.abilities.rollFirst')}</span>
              )
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
