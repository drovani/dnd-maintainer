import { AutocompleteInput } from '@/components/ui/autocomplete-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { usePlayerNames } from '@/hooks/useCharacters'
import {
  ABILITY_ABBREVIATIONS,
  ABILITY_NAME_TO_KEY,
  DND_ALIGNMENTS,
  DND_BACKGROUNDS,
  DND_CLASSES,
  DND_RACE_GROUPS,
  DND_RACES,
  DND_SKILLS,
  getAbilityModifier,
  getPointBuyCost,
  getPointBuyDecrementReturn,
  getPointBuyEquivalent,
  getPointBuyIncrementCost,
  getProficiencyBonus,
  POINT_BUY_TOTAL,
  rollAbilityScores,
  STANDARD_ARRAY,
} from '@/lib/dnd-helpers'
import { useBuilderAutosave } from '@/hooks/useBuilderAutosave'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Dices, Save, TrendingDown, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

interface CharacterData {
  // Basics
  name: string
  player_name: string
  character_type: 'pc' | 'npc'
  race: string
  class: string
  level: number
  background: string
  custom_background: string
  alignment: string

  // Abilities
  abilityMethod: 'standard-array' | 'point-buy' | 'rolling'
  abilities: {
    str: number
    dex: number
    con: number
    int: number
    wis: number
    cha: number
  }
  abilityAssignments: Record<string, number | null>
  rolledValues: number[]

  // Skills
  skills: Record<string, { proficient: boolean; expertise: boolean }>

  // Features
  features: Array<{ id: string; name: string; description: string; source: string; uses: number }>

  // Equipment
  equipment: Array<{ id: string; name: string; quantity: number; weight: number; equipped: boolean }>

  // Spells
  spells: {
    cantrips: string[]
    spellsByLevel: Record<number, string[]>
    spellSlots: Record<number, number>
  }

  // Backstory
  personalityTraits: string
  ideals: string
  bonds: string
  flaws: string
  appearance: string
  backstory: string

  // Combat (calculated)
  hp_max: number
  ac: number
}

type StepType = 'basics' | 'abilities' | 'skills' | 'features' | 'equipment' | 'spells' | 'backstory'

const STEPS: { id: StepType; label: string }[] = [
  { id: 'basics', label: 'Basics' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'skills', label: 'Skills' },
  { id: 'features', label: 'Features' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'spells', label: 'Spells' },
  { id: 'backstory', label: 'Backstory' },
]

type RequiredField = 'name' | 'race' | 'class'

const REQUIRED_FIELDS: { field: RequiredField; step: StepType; label: string }[] = [
  { field: 'name', step: 'basics', label: 'Character Name' },
  { field: 'race', step: 'basics', label: 'Race' },
  { field: 'class', step: 'basics', label: 'Class' },
]

const ABILITY_NAMES = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

export default function CharacterBuilder() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: playerNames = [] } = usePlayerNames()
  const [currentStep, setCurrentStep] = useState<StepType>('basics')
  const [characterData, setCharacterData] = useState<CharacterData>({
    name: '',
    player_name: '',
    character_type: 'pc',
    race: DND_RACES[0].id,
    class: DND_CLASSES[0].id,
    level: 1,
    background: DND_BACKGROUNDS[0].id,
    custom_background: '',
    alignment: DND_ALIGNMENTS[4].id,

    abilityMethod: 'standard-array',
    abilities: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    abilityAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
    rolledValues: [],

    skills: DND_SKILLS.reduce(
      (acc, skill) => ({
        ...acc,
        [skill.id]: { proficient: false, expertise: false },
      }),
      {}
    ),

    features: [],
    equipment: [],
    spells: {
      cantrips: [],
      spellsByLevel: {},
      spellSlots: {},
    },

    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    appearance: '',
    backstory: '',

    hp_max: 0,
    ac: 10,
  })

  const [isRolling, setIsRolling] = useState<boolean>(false)
  const [displayedRolls, setDisplayedRolls] = useState<number[]>([])
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectedClass = DND_CLASSES.find((c) => c.id === characterData.class)
  const selectedRace = DND_RACES.find((r) => r.id === characterData.race)
  const racialBonuses = selectedRace?.abilityBonuses ?? {}
  const conWithRacial = characterData.abilities.con + (racialBonuses.con ?? 0)
  const dexWithRacial = characterData.abilities.dex + (racialBonuses.dex ?? 0)
  const calculatedHp = (selectedClass?.hitDie ?? 8) + getAbilityModifier(conWithRacial)
  const calculatedAc = 10 + getAbilityModifier(dexWithRacial)

  const [visitedSteps, setVisitedSteps] = useState<Set<StepType>>(new Set())
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequiredField, boolean>>>({})
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [finalizeError, setFinalizeError] = useState<string | null>(null)
  const { saveStatus, saveDraft, finalize, clearStatus } = useBuilderAutosave()

  // Clear "saved" indicator after 2 seconds, but preserve "error" state
  useEffect(() => {
    if (saveStatus !== 'saved') return
    const timer = setTimeout(() => clearStatus(), 2000)
    return () => clearTimeout(timer)
  }, [saveStatus, clearStatus])

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)

  const buildPayload = () => ({
    campaign_id: campaignId as string,
    name: characterData.name,
    character_type: characterData.character_type,
    player_name: characterData.player_name || null,
    race: characterData.race || null,
    class: characterData.class || null,
    subclass: null,
    level: characterData.level,
    background: characterData.custom_background || characterData.background || null,
    alignment: characterData.alignment || null,
    hit_points_max: calculatedHp,
    hit_points_current: calculatedHp,
    armor_class: calculatedAc,
    speed: 30,
    abilities: characterData.abilities,
    saving_throws: {},
    skills: characterData.skills,
    features: characterData.features,
    equipment: characterData.equipment,
    spells: characterData.spells,
    personality_traits: characterData.personalityTraits || null,
    ideals: characterData.ideals || null,
    bonds: characterData.bonds || null,
    flaws: characterData.flaws || null,
    appearance: characterData.appearance || null,
    backstory: characterData.backstory || null,
    notes: null,
  })

  const validateStep = (step: StepType) => {
    setFieldErrors((prev) => {
      const errors: Partial<Record<RequiredField, boolean>> = { ...prev }
      for (const { field, step: fieldStep } of REQUIRED_FIELDS) {
        if (fieldStep === step) {
          errors[field] = !characterData[field]
        }
      }
      return errors
    })
  }

  const stepHasErrors = (step: StepType): boolean => {
    if (!visitedSteps.has(step)) return false
    return REQUIRED_FIELDS.some(({ field, step: fieldStep }) => fieldStep === step && fieldErrors[field])
  }

  const isReadyToFinalize = REQUIRED_FIELDS.every(({ field }) => !!characterData[field])

  const goToStep = (targetStep: StepType) => {
    const currentStepId = STEPS[currentStepIndex].id
    setVisitedSteps((prev) => new Set([...prev, currentStepId]))
    validateStep(currentStepId)
    saveDraft(buildPayload()).catch((err) => {
      console.error('Autosave failed during step navigation:', err)
    })
    setCurrentStep(targetStep)
  }

  const goNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      goToStep(STEPS[currentStepIndex + 1].id)
    }
  }

  const goPrevStep = () => {
    if (currentStepIndex > 0) {
      goToStep(STEPS[currentStepIndex - 1].id)
    }
  }

  const handleFinalize = async () => {
    setIsFinalizing(true)
    setFinalizeError(null)
    try {
      const id = await finalize(buildPayload())
      navigate(`/campaign/${campaignId}/character/${id}`)
    } catch (err) {
      console.error('Character finalization failed:', err)
      setFinalizeError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
    } finally {
      setIsFinalizing(false)
    }
  }

  const updateBasics = (updates: Partial<CharacterData>) => {
    // Clear errors for fields being updated
    for (const key of Object.keys(updates)) {
      if (key in fieldErrors) {
        setFieldErrors((prev) => ({ ...prev, [key as RequiredField]: false }))
      }
    }
    setCharacterData((prev) => {
      const next = { ...prev, ...updates }
      // Reset skill selections when class changes, since each class has a different available skill pool
      if ('class' in updates && updates.class !== prev.class) {
        next.skills = Object.fromEntries(
          DND_SKILLS.map((skill) => [skill.id, { proficient: false, expertise: false }])
        ) as Record<string, { proficient: boolean; expertise: boolean }>
      }
      return next
    })
  }

  const updateAbility = (ability: keyof CharacterData['abilities'], value: number) => {
    setCharacterData((prev) => ({
      ...prev,
      abilities: { ...prev.abilities, [ability]: value },
    }))
  }

  const resetAbilitiesForMethod = (method: CharacterData['abilityMethod']) => {
    const defaultScore = method === 'point-buy' ? 8 : 10
    setCharacterData((prev) => ({
      ...prev,
      abilityMethod: method,
      abilities: { str: defaultScore, dex: defaultScore, con: defaultScore, int: defaultScore, wis: defaultScore, cha: defaultScore },
      abilityAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
      rolledValues: method === 'rolling' ? prev.rolledValues : [],
    }))
  }

  const assignAbilityScore = (ability: keyof CharacterData['abilities'], value: number | null) => {
    setCharacterData((prev) => {
      const newAssignments = { ...prev.abilityAssignments, [ability]: value }
      const newAbilities = { ...prev.abilities }
      for (const key of Object.keys(newAbilities) as Array<keyof typeof newAbilities>) {
        newAbilities[key] = (newAssignments[key] as number) ?? 10
      }
      return { ...prev, abilityAssignments: newAssignments, abilities: newAbilities }
    })
  }

  const unassignValue = (value: number) => {
    setCharacterData((prev) => {
      const abilityToUnassign = Object.entries(prev.abilityAssignments)
        .find(([, val]) => val === value)?.[0]
      if (!abilityToUnassign) return prev
      const newAssignments = { ...prev.abilityAssignments, [abilityToUnassign]: null }
      const newAbilities = { ...prev.abilities }
      for (const key of Object.keys(newAbilities) as Array<keyof typeof newAbilities>) {
        newAbilities[key] = (newAssignments[key] as number) ?? 10
      }
      return { ...prev, abilityAssignments: newAssignments, abilities: newAbilities }
    })
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
        setCharacterData((prev) => ({
          ...prev,
          rolledValues: finalValues,
          abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          abilityAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        }))
        setIsRolling(false)
      }
    }, 80)
  }, [isRolling])

  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current)
    }
  }, [])

  const incrementAbility = (ability: keyof CharacterData['abilities']) => {
    const current = characterData.abilities[ability]
    if (current >= 15) return
    const cost = getPointBuyIncrementCost(current)
    const spent = Object.values(characterData.abilities).reduce((sum, s) => sum + getPointBuyCost(s), 0)
    if (POINT_BUY_TOTAL - spent < cost) return
    updateAbility(ability, current + 1)
  }

  const decrementAbility = (ability: keyof CharacterData['abilities']) => {
    const current = characterData.abilities[ability]
    if (current <= 8) return
    updateAbility(ability, current - 1)
  }

  const toggleSkillProficiency = (skillId: string) => {
    setCharacterData((prev) => {
      const cls = DND_CLASSES.find((c) => c.id === prev.class)
      if (!cls) return prev

      const skillName = DND_SKILLS.find((s) => s.id === skillId)?.name
      if (!skillName) return prev
      const inPool = cls.skillPool === null || cls.skillPool.includes(skillName)
      if (!inPool) return prev

      const current = prev.skills[skillId]
      if (!current) {
        console.warn(`Skill data missing for "${skillId}" — possible state desync`)
        return prev
      }

      if (current.proficient) {
        return {
          ...prev,
          skills: { ...prev.skills, [skillId]: { proficient: false, expertise: false } },
        }
      }
      const selectedCount = Object.values(prev.skills).filter((s) => s.proficient).length
      if (selectedCount >= cls.skillChoices) return prev
      return {
        ...prev,
        skills: { ...prev.skills, [skillId]: { proficient: true, expertise: false } },
      }
    })
  }

  const addFeature = () => {
    setCharacterData((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        {
          id: `feature-${Date.now()}`,
          name: '',
          description: '',
          source: '',
          uses: 0,
        },
      ],
    }))
  }

  const updateFeature = (id: string, updates: Partial<CharacterData['features'][0]>) => {
    setCharacterData((prev) => ({
      ...prev,
      features: prev.features.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }))
  }

  const removeFeature = (id: string) => {
    setCharacterData((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f.id !== id),
    }))
  }

  const addEquipment = () => {
    setCharacterData((prev) => ({
      ...prev,
      equipment: [
        ...prev.equipment,
        {
          id: `equipment-${Date.now()}`,
          name: '',
          quantity: 1,
          weight: 0,
          equipped: false,
        },
      ],
    }))
  }

  const updateEquipment = (id: string, updates: Partial<CharacterData['equipment'][0]>) => {
    setCharacterData((prev) => ({
      ...prev,
      equipment: prev.equipment.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }))
  }

  const removeEquipment = (id: string) => {
    setCharacterData((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((e) => e.id !== id),
    }))
  }

  const renderBasicsStep = () => (
    <div className="space-y-6">
      {/* Character Type Switch + Level display */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <span className={`text-sm font-semibold ${characterData.character_type === 'pc' ? 'text-foreground' : 'text-muted-foreground'}`}>PC</span>
          <Switch
            checked={characterData.character_type === 'npc'}
            onCheckedChange={(checked: boolean) =>
              updateBasics({
                character_type: checked ? 'npc' : 'pc',
                player_name: checked ? '' : characterData.player_name,
              })
            }
          />
          <span className={`text-sm font-semibold ${characterData.character_type === 'npc' ? 'text-foreground' : 'text-muted-foreground'}`}>NPC</span>
        </label>
        <span className="text-sm text-muted-foreground">
          Level <span className="font-bold text-foreground text-lg">1</span>
        </span>
      </div>

      {/* Name row */}
      <div className={`grid grid-cols-1 ${characterData.character_type === 'pc' ? 'md:grid-cols-2' : ''} gap-4`}>
        <div className="space-y-2">
          <Label htmlFor="character-name">
            Character Name
            {fieldErrors.name && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id="character-name"
            value={characterData.name}
            onChange={(e) => updateBasics({ name: e.target.value })}
            placeholder="Enter character name"
            className={fieldErrors.name ? 'border-destructive' : ''}
          />
        </div>

        {characterData.character_type === 'pc' && (
          <div className="space-y-2">
            <Label htmlFor="player-name">Player Name</Label>
            <AutocompleteInput
              id="player-name"
              suggestions={playerNames}
              value={characterData.player_name}
              onChange={(value) => updateBasics({ player_name: value })}
              placeholder="Enter player name"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              Race
              {fieldErrors.race && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={characterData.race}
              onValueChange={(value) => value && updateBasics({ race: value })}
              items={DND_RACES.map((r) => ({ value: r.id, label: r.name }))}
            >
              <SelectTrigger className={`w-full ${fieldErrors.race ? 'border-destructive' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {DND_RACE_GROUPS.map((group) => (
                  <SelectGroup key={group.label}>
                    {group.options.length > 1 && <SelectLabel>{group.label}</SelectLabel>}
                    {group.options.map((option) => {
                      const race = DND_RACES.find((r) => r.name === option.label)
                      if (!race) return null
                      return (
                        <SelectItem key={race.id} value={race.id} className={group.options.length > 1 ? 'pl-4' : ''}>
                          {option.label}
                        </SelectItem>
                      )
                    })}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Class
              {fieldErrors.class && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={characterData.class}
              onValueChange={(value) => value && updateBasics({ class: value })}
              items={DND_CLASSES.map((c) => ({ value: c.id, label: c.name }))}
            >
              <SelectTrigger className={`w-full ${fieldErrors.class ? 'border-destructive' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DND_CLASSES.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Background</Label>
            <Select
              value={characterData.background}
              onValueChange={(value) => value && updateBasics({ background: value })}
              items={DND_BACKGROUNDS.map((b) => ({ value: b.id, label: b.name }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DND_BACKGROUNDS.map((bg) => (
                  <SelectItem key={bg.id} value={bg.id}>
                    {bg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Alignment</Label>
          <div className="grid grid-cols-3 gap-0 rounded-md overflow-hidden border border-border">
            {(['Good', 'Neutral', 'Evil'] as const).map((moral) =>
              (['Lawful', 'Neutral', 'Chaotic'] as const).map((ethic) => {
                const alignment = DND_ALIGNMENTS.find(
                  (a) => a.name === (ethic === 'Neutral' && moral === 'Neutral' ? 'True Neutral' : `${ethic} ${moral}`)
                )
                if (!alignment) {
                  console.warn(`Alignment not found for "${ethic} ${moral}" — check DND_ALIGNMENTS data`)
                  return null
                }
                const isSelected = characterData.alignment === alignment.id
                const topLabel = ethic === 'Neutral' && moral === 'Neutral' ? 'True' : ethic
                const bottomLabel = moral
                return (
                  <button
                    key={alignment.id}
                    type="button"
                    title={alignment.name}
                    onClick={() => updateBasics({ alignment: alignment.id })}
                    className={`flex flex-col items-center justify-center border-r border-b border-border px-1 py-1 text-sm transition-colors cursor-pointer last-of-type:border-r-0 nth-[3n]:border-r-0 ${isSelected
                      ? 'bg-primary/10 font-medium'
                      : 'hover:bg-muted/50'
                      }`}
                  >
                    <span className="leading-tight">{topLabel}</span>
                    <span className="leading-tight">{bottomLabel}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {characterData.background === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="custom-background">Custom Background</Label>
          <Input
            id="custom-background"
            value={characterData.custom_background}
            onChange={(e) => updateBasics({ custom_background: e.target.value })}
            placeholder="Describe your background briefly"
          />
        </div>
      )}
    </div>
  )

  const renderAbilityCard = (ability: keyof CharacterData['abilities'], scoreInput: React.ReactNode) => {
    const baseScore = characterData.abilities[ability]
    const raceBonus = racialBonuses[ability] ?? 0
    const totalScore = baseScore + raceBonus
    const modifier = getAbilityModifier(totalScore)

    return (
      <Card key={ability}>
        <CardContent className="px-3 py-2 space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground">{ABILITY_NAMES[ability]}</Label>
          <div className="flex items-center justify-between gap-2">
            <div className="shrink-0">{scoreInput}</div>
            {raceBonus > 0 && selectedRace && (
              <Badge
                variant="secondary"
                className="text-[10px] shrink-0 px-1.5 py-0 cursor-default select-none"
                title={`${selectedRace.name} Racial Bonus: ${Object.entries(selectedRace.abilityBonuses).map(([ab, val]) => `+${val} ${ABILITY_NAMES[ab as keyof typeof ABILITY_NAMES]}`).join(', ')}`}
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

  const renderAssignmentSelect = (ability: keyof CharacterData['abilities'], availableValues: readonly number[]) => {
    const currentValue = characterData.abilityAssignments[ability]
    const assignedValues = Object.entries(characterData.abilityAssignments)
      .filter(([key, val]) => key !== ability && val !== null)
      .map(([, val]) => val as number)
    const options = availableValues.filter((v) => !assignedValues.includes(v) || v === currentValue)

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
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  const renderAbilitiesStep = () => {
    const abilities = Object.keys(characterData.abilities) as Array<keyof typeof characterData.abilities>
    const pointsSpent = Object.values(characterData.abilities).reduce((sum, s) => sum + getPointBuyCost(s), 0)
    const pointsRemaining = POINT_BUY_TOTAL - pointsSpent
    const rollValues = isRolling ? displayedRolls : characterData.rolledValues
    const pointBuyEquiv = characterData.rolledValues.length > 0
      ? getPointBuyEquivalent(characterData.rolledValues)
      : null
    const pointBuyDiff = pointBuyEquiv !== null ? pointBuyEquiv - POINT_BUY_TOTAL : null

    return (
      <div className="space-y-4">
        <Tabs
          value={characterData.abilityMethod}
          onValueChange={(val) => resetAbilitiesForMethod(val as CharacterData['abilityMethod'])}
        >
          <TabsList className="w-full">
            <TabsTrigger value="standard-array" className="flex-1">Standard Array</TabsTrigger>
            <TabsTrigger value="point-buy" className="flex-1">Point-Buy</TabsTrigger>
            <TabsTrigger value="rolling" className="flex-1">Rolling</TabsTrigger>
          </TabsList>

          <TabsContent value="standard-array" className="space-y-3 mt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm">
                Assign each value to an ability. Each value used once.
              </p>
              <div className="flex gap-1.5">
                {STANDARD_ARRAY.map((v) => {
                  const isAssigned = Object.values(characterData.abilityAssignments).includes(v)
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
              {abilities.map((ability) =>
                renderAbilityCard(ability, renderAssignmentSelect(ability, STANDARD_ARRAY))
              )}
            </div>
          </TabsContent>

          <TabsContent value="point-buy" className="space-y-3 mt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm">
                Spend points to increase scores from 8.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Points:</span>
                <span className={`text-2xl font-bold tabular-nums ${pointsRemaining === 0 ? 'text-muted-foreground' : pointsRemaining < 5 ? 'text-amber-600' : 'text-foreground'}`}>
                  {pointsRemaining}
                </span>
                <span className="text-sm text-muted-foreground">/ {POINT_BUY_TOTAL}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {abilities.map((ability) => {
                const score = characterData.abilities[ability]
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
                      title={canDecrement ? `Decrease score, return ${decReturn} point${decReturn > 1 ? 's' : ''}` : 'Minimum score'}
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
                      title={canIncrement ? `Increase score, spend ${incCost} point${incCost > 1 ? 's' : ''}` : score >= 15 ? 'Maximum score' : 'Not enough points'}
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
                Roll 4d6, drop the lowest, then assign results.
              </p>
              <div className="flex items-center gap-3">
                {pointBuyDiff !== null && !isRolling && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${pointBuyDiff > 0 ? 'text-green-600' : pointBuyDiff < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {pointBuyDiff > 0 ? <TrendingUp className="size-4" /> : pointBuyDiff < 0 ? <TrendingDown className="size-4" /> : null}
                    <span>
                      {pointBuyDiff > 0 ? `+${pointBuyDiff}` : pointBuyDiff < 0 ? `${pointBuyDiff}` : 'Even'}
                      {' '}vs point-buy
                    </span>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={handleRollScores} disabled={isRolling}>
                  <Dices className={`size-4 mr-1.5 ${isRolling ? 'animate-spin' : ''}`} />
                  {characterData.rolledValues.length > 0 && !isRolling ? 'Re-Roll' : isRolling ? 'Rolling...' : 'Roll Scores'}
                </Button>
              </div>
            </div>
            {(rollValues.length > 0) && (
              <div className="flex gap-1.5">
                {rollValues.map((v, i) => {
                  const isAssigned = !isRolling && Object.values(characterData.abilityAssignments).includes(v)
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
              {abilities.map((ability) =>
                renderAbilityCard(
                  ability,
                  characterData.rolledValues.length > 0 && !isRolling
                    ? renderAssignmentSelect(ability, characterData.rolledValues)
                    : <span className="text-xs text-muted-foreground w-16 text-center">{isRolling ? '...' : 'Roll first'}</span>
                )
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  const renderSkillsStep = () => {
    const cls = DND_CLASSES.find((c) => c.id === characterData.class)
    if (!cls) {
      return (
        <p className="text-muted-foreground text-sm">
          Please select a class in the Basics step before choosing skills.
        </p>
      )
    }

    const profBonus = getProficiencyBonus(characterData.level)
    const selectedCount = Object.values(characterData.skills).filter((s) => s.proficient).length
    const atMax = selectedCount >= cls.skillChoices

    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Choose {cls.skillChoices} skill{cls.skillChoices !== 1 ? 's' : ''} from your class list.{' '}
          <span className="font-medium text-foreground">{selectedCount} / {cls.skillChoices} selected</span>
        </p>
        <div className="space-y-1">
          {DND_SKILLS.map((skill) => {
            const skillData = characterData.skills[skill.id] ?? { proficient: false, expertise: false }
            const abilityKey = ABILITY_NAME_TO_KEY[skill.ability]
            const abilityMod = getAbilityModifier(characterData.abilities[abilityKey] + (racialBonuses[abilityKey] ?? 0))
            const totalMod = skillData.proficient ? abilityMod + profBonus : abilityMod
            const abbrev = ABILITY_ABBREVIATIONS[skill.ability]
            const inPool = cls.skillPool === null || cls.skillPool.includes(skill.name)
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
                    onCheckedChange={() => toggleSkillProficiency(skill.id)}
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
                  {skill.name}
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

  const renderFeaturesStep = () => (
    <div className="space-y-4">
      <Button onClick={addFeature}>Add Feature</Button>
      <div className="space-y-4">
        {characterData.features.map((feature) => (
          <Card key={feature.id}>
            <CardContent className="p-4 space-y-3">
              <Input
                value={feature.name}
                onChange={(e) => updateFeature(feature.id, { name: e.target.value })}
                placeholder="Feature name"
              />
              <Textarea
                value={feature.description}
                onChange={(e) => updateFeature(feature.id, { description: e.target.value })}
                placeholder="Description"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={feature.source}
                  onChange={(e) => updateFeature(feature.id, { source: e.target.value })}
                  placeholder="Source (e.g., Class Feature)"
                />
                <Input
                  type="number"
                  min="0"
                  value={feature.uses}
                  onChange={(e) => updateFeature(feature.id, { uses: parseInt(e.target.value) || 0 })}
                  placeholder="Uses"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeFeature(feature.id)}
              >
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderEquipmentStep = () => (
    <div className="space-y-4">
      <Button onClick={addEquipment}>Add Equipment</Button>
      <div className="space-y-4">
        {characterData.equipment.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 space-y-3">
              <Input
                value={item.name}
                onChange={(e) => updateEquipment(item.id, { name: e.target.value })}
                placeholder="Item name"
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateEquipment(item.id, { quantity: parseInt(e.target.value) || 1 })}
                  placeholder="Qty"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={item.weight}
                  onChange={(e) => updateEquipment(item.id, { weight: parseFloat(e.target.value) || 0 })}
                  placeholder="Weight"
                />
                <Label className="flex items-center gap-2">
                  <Checkbox
                    checked={item.equipped}
                    onCheckedChange={(checked) => updateEquipment(item.id, { equipped: checked === true })}
                  />
                  Equipped
                </Label>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeEquipment(item.id)}
              >
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderSpellsStep = () => (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">Spell management (basic version)</p>
      <Card>
        <CardContent className="p-4 space-y-2">
          <Label htmlFor="cantrips">Cantrips (comma-separated)</Label>
          <Input
            id="cantrips"
            value={characterData.spells.cantrips.join(', ')}
            onChange={(e) =>
              setCharacterData((prev) => ({
                ...prev,
                spells: {
                  ...prev.spells,
                  cantrips: e.target.value.split(',').map((s) => s.trim()),
                },
              }))
            }
            placeholder="e.g., Fire Bolt, Mage Hand"
          />
        </CardContent>
      </Card>
    </div>
  )

  const renderBackstoryStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="personality">Personality Traits</Label>
        <Textarea
          id="personality"
          value={characterData.personalityTraits}
          onChange={(e) => updateBasics({ personalityTraits: e.target.value })}
          placeholder="Describe personality traits..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ideals">Ideals</Label>
        <Textarea
          id="ideals"
          value={characterData.ideals}
          onChange={(e) => updateBasics({ ideals: e.target.value })}
          placeholder="What ideals does your character hold..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bonds">Bonds</Label>
        <Textarea
          id="bonds"
          value={characterData.bonds}
          onChange={(e) => updateBasics({ bonds: e.target.value })}
          placeholder="Bonds to people, places, or things..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="flaws">Flaws</Label>
        <Textarea
          id="flaws"
          value={characterData.flaws}
          onChange={(e) => updateBasics({ flaws: e.target.value })}
          placeholder="Character flaws and weaknesses..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="appearance">Appearance</Label>
        <Textarea
          id="appearance"
          value={characterData.appearance}
          onChange={(e) => updateBasics({ appearance: e.target.value })}
          placeholder="Physical description..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="backstory">Backstory</Label>
        <Textarea
          id="backstory"
          value={characterData.backstory}
          onChange={(e) => updateBasics({ backstory: e.target.value })}
          placeholder="Character backstory..."
        />
      </div>
    </div>
  )

  const renderStep = () => {
    switch (currentStep) {
      case 'basics':
        return renderBasicsStep()
      case 'abilities':
        return renderAbilitiesStep()
      case 'skills':
        return renderSkillsStep()
      case 'features':
        return renderFeaturesStep()
      case 'equipment':
        return renderEquipmentStep()
      case 'spells':
        return renderSpellsStep()
      case 'backstory':
        return renderBackstoryStep()
    }
  }

  if (!campaignId) {
    return <div className="page-container"><p className="text-destructive">Campaign ID is required to create a character.</p></div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container">
        <h1 className="page-title mb-8">Create New Character</h1>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-start">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => goToStep(step.id)}
                    className={`size-10 rounded-full flex items-center justify-center font-bold transition-colors ${index === currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : stepHasErrors(step.id)
                        ? 'bg-destructive text-destructive-foreground'
                        : index < currentStepIndex
                          ? 'bg-green-600 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {index + 1}
                  </button>
                  <span className="text-xs text-muted-foreground mt-2">
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 self-start mt-5 ${index < currentStepIndex ? 'bg-green-600' : 'bg-muted'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">
              {STEPS[currentStepIndex].label}
            </h2>
            {renderStep()}
          </CardContent>
        </Card>

        {(finalizeError || saveStatus === 'error') && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
            {finalizeError
              ? `Failed to finalize character: ${finalizeError}`
              : 'Failed to save draft. Your recent changes may not have been saved.'}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goPrevStep}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft size={16} />
            Previous
          </Button>

          <div className="flex items-center gap-3">
            {saveStatus === 'saved' && (
              <span className="text-sm text-muted-foreground">Draft saved</span>
            )}
            {currentStepIndex < STEPS.length - 1 && (
              <Button onClick={goNextStep}>
                Next
                <ChevronRight size={16} />
              </Button>
            )}
            <Button
              onClick={handleFinalize}
              disabled={isFinalizing || !isReadyToFinalize}
            >
              <Save className="size-4" />
              {isFinalizing ? 'Finalizing...' : 'Finalize Character'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
