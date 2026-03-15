import {
  DND_ALIGNMENTS,
  DND_BACKGROUNDS,
  DND_CLASSES,
  DND_RACE_GROUPS,
  DND_RACES,
  DND_SKILLS,
  getAbilityModifier,
} from '@/lib/dnd-helpers'
import { usePlayerNames } from '@/hooks/useCharacters'
import { supabase } from '@/lib/supabase'
import { useMutation } from '@tanstack/react-query'
import { AutocompleteInput } from '@/components/ui/autocomplete-input'
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
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { useState } from 'react'
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
  abilities: {
    str: number
    dex: number
    con: number
    int: number
    wis: number
    cha: number
  }

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

    abilities: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },

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

  const selectedClass = DND_CLASSES.find((c) => c.id === characterData.class)
  const conModifier = getAbilityModifier(characterData.abilities.con)
  const calculatedHp = (selectedClass?.hitDie ?? 8) + conModifier
  const calculatedAc = 10 + getAbilityModifier(characterData.abilities.dex)

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from('characters').insert({
        campaign_id: campaignId,
        ...characterData,
        hp_max: calculatedHp,
        ac: calculatedAc,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).select().single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      if (data?.id) {
        navigate(`/campaign/${campaignId}/character/${data.id}`)
      } else {
        navigate(`/campaign/${campaignId}/characters`)
      }
    },
  })

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)

  const goToStep = (step: StepType) => {
    setCurrentStep(step)
  }

  const goNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].id)
    }
  }

  const goPrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id)
    }
  }

  const updateBasics = (updates: Partial<CharacterData>) => {
    setCharacterData((prev) => ({ ...prev, ...updates }))
  }

  const updateAbility = (ability: keyof CharacterData['abilities'], value: number) => {
    setCharacterData((prev) => ({
      ...prev,
      abilities: { ...prev.abilities, [ability]: value },
    }))
  }

  const toggleSkillProficiency = (skillId: string) => {
    setCharacterData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillId]: {
          ...prev.skills[skillId],
          proficient: !prev.skills[skillId].proficient,
          expertise: false,
        },
      },
    }))
  }

  const toggleSkillExpertise = (skillId: string) => {
    setCharacterData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillId]: {
          ...prev.skills[skillId],
          expertise: !prev.skills[skillId].expertise,
        },
      },
    }))
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
          <Label htmlFor="character-name">Character Name</Label>
          <Input
            id="character-name"
            value={characterData.name}
            onChange={(e) => updateBasics({ name: e.target.value })}
            placeholder="Enter character name"
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
        <div className="space-y-2">
          <Label>Race</Label>
          <Select
            value={characterData.race}
            onValueChange={(value) => value && updateBasics({ race: value })}
            items={DND_RACES.map((r) => ({ value: r.id, label: r.name }))}
          >
            <SelectTrigger className="w-full">
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
          <Label>Class</Label>
          <Select
            value={characterData.class}
            onValueChange={(value) => value && updateBasics({ class: value })}
            items={DND_CLASSES.map((c) => ({ value: c.id, label: c.name }))}
          >
            <SelectTrigger className="w-full">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="space-y-2">
          <Label>Alignment</Label>
          <Select
            value={characterData.alignment}
            onValueChange={(value) => value && updateBasics({ alignment: value })}
            items={DND_ALIGNMENTS.map((a) => ({ value: a.id, label: a.name }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DND_ALIGNMENTS.map((align) => (
                <SelectItem key={align.id} value={align.id}>
                  {align.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {/* Calculated stats preview */}
      <div className="flex gap-4 pt-2">
        <Card>
          <CardContent className="px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">Max HP</p>
            <p className="text-lg font-bold">{calculatedHp}</p>
            <p className="text-xs text-muted-foreground">
              {selectedClass?.hitDie ?? 8}d{selectedClass?.hitDie ?? 8} + {conModifier >= 0 ? '+' : ''}{conModifier} CON
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">Armor Class</p>
            <p className="text-lg font-bold">{calculatedAc}</p>
            <p className="text-xs text-muted-foreground">base (no armor)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderAbilitiesStep = () => (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Set your ability scores. The modifier is calculated automatically.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.keys(characterData.abilities) as Array<keyof typeof characterData.abilities>).map((ability) => {
          const score = characterData.abilities[ability]
          const modifier = getAbilityModifier(score)
          return (
            <Card key={ability}>
              <CardContent className="p-4">
                <Label className="mb-3">{ABILITY_NAMES[ability]}</Label>
                <Input
                  type="number"
                  min="1"
                  value={score}
                  onChange={(e) => updateAbility(ability, parseInt(e.target.value) || 10)}
                  className="text-center text-lg font-bold mb-3"
                />
                <div className="text-center">
                  <p className="text-muted-foreground text-xs mb-1">Modifier</p>
                  <p className={`text-2xl font-bold ${modifier >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {modifier >= 0 ? '+' : ''}{modifier}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  const renderSkillsStep = () => {
    const skillsByAbility = DND_SKILLS.reduce(
      (acc, skill) => {
        if (!acc[skill.ability]) acc[skill.ability] = []
        acc[skill.ability].push(skill)
        return acc
      },
      {} as Record<string, typeof DND_SKILLS>
    )

    return (
      <div className="space-y-8">
        <p className="text-muted-foreground text-sm">
          Select proficiencies and expertise for your skills.
        </p>
        {Object.entries(skillsByAbility).map(([ability, skills]) => (
          <div key={ability}>
            <h3 className="text-lg font-semibold mb-4">{ability}</h3>
            <div className="space-y-2">
              {skills.map((skill) => {
                const skillData = characterData.skills[skill.id]
                return (
                  <div key={skill.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                    <Checkbox
                      id={`prof-${skill.id}`}
                      checked={skillData.proficient}
                      onCheckedChange={() => toggleSkillProficiency(skill.id)}
                    />
                    <Label htmlFor={`prof-${skill.id}`} className="flex-1 cursor-pointer">
                      {skill.name}
                    </Label>
                    <Checkbox
                      id={`exp-${skill.id}`}
                      checked={skillData.expertise}
                      onCheckedChange={() => toggleSkillExpertise(skill.id)}
                      disabled={!skillData.proficient}
                    />
                    <Label htmlFor={`exp-${skill.id}`} className="text-xs text-muted-foreground cursor-pointer">
                      Expertise
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
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

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container">
        <h1 className="page-title mb-8">Create New Character</h1>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => goToStep(step.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${index === currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : index < currentStepIndex
                      ? 'bg-green-600 text-white'
                      : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {index + 1}
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${index < currentStepIndex ? 'bg-green-600' : 'bg-muted'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs">
            {STEPS.map((step) => (
              <span key={step.id} className="text-muted-foreground">
                {step.label}
              </span>
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

          {currentStepIndex === STEPS.length - 1 ? (
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !characterData.name}
            >
              <Save size={16} />
              {createMutation.isPending ? 'Saving...' : 'Create Character'}
            </Button>
          ) : (
            <Button onClick={goNextStep}>
              Next
              <ChevronRight size={16} />
            </Button>
          )}
        </div>

        {createMutation.isError && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
            Error creating character: {String(createMutation.error)}
          </div>
        )}
      </div>
    </div>
  )
}
