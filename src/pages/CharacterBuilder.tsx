import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  DND_RACES,
  DND_CLASSES,
  DND_SKILLS,
  DND_BACKGROUNDS,
  DND_ALIGNMENTS,
  getAbilityModifier,
} from '@/lib/dnd-helpers'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'

interface CharacterData {
  // Basics
  name: string
  player_name: string
  character_type: 'PC' | 'NPC'
  race: string
  class: string
  subclass: string
  level: number
  background: string
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

  // Combat
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
  const [currentStep, setCurrentStep] = useState<StepType>('basics')
  const [characterData, setCharacterData] = useState<CharacterData>({
    name: '',
    player_name: '',
    character_type: 'PC',
    race: DND_RACES[0].id,
    class: DND_CLASSES[0].id,
    subclass: '',
    level: 1,
    background: DND_BACKGROUNDS[0].id,
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

    hp_max: 8,
    ac: 10,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from('characters').insert({
        campaign_id: campaignId,
        ...characterData,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-amber-400 mb-2">
            Character Name
          </label>
          <input
            type="text"
            value={characterData.name}
            onChange={(e) => updateBasics({ name: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            placeholder="Enter character name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-400 mb-2">
            Player Name
          </label>
          <input
            type="text"
            value={characterData.player_name}
            onChange={(e) => updateBasics({ player_name: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            placeholder="Enter player name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-amber-400 mb-2">
            Character Type
          </label>
          <select
            value={characterData.character_type}
            onChange={(e) => updateBasics({ character_type: e.target.value as 'PC' | 'NPC' })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="PC">Player Character</option>
            <option value="NPC">Non-Player Character</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-400 mb-2">
            Level
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={characterData.level}
            onChange={(e) => updateBasics({ level: parseInt(e.target.value) || 1 })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-amber-400 mb-2">
            Race
          </label>
          <select
            value={characterData.race}
            onChange={(e) => updateBasics({ race: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            {DND_RACES.map((race) => (
              <option key={race.id} value={race.id}>
                {race.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-400 mb-2">
            Class
          </label>
          <select
            value={characterData.class}
            onChange={(e) => updateBasics({ class: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            {DND_CLASSES.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-amber-400 mb-2">
            Subclass
          </label>
          <input
            type="text"
            value={characterData.subclass}
            onChange={(e) => updateBasics({ subclass: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            placeholder="e.g., Life Domain, Beast Master"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-400 mb-2">
            Background
          </label>
          <select
            value={characterData.background}
            onChange={(e) => updateBasics({ background: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            {DND_BACKGROUNDS.map((bg) => (
              <option key={bg.id} value={bg.id}>
                {bg.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-amber-400 mb-2">
          Alignment
        </label>
        <select
          value={characterData.alignment}
          onChange={(e) => updateBasics({ alignment: e.target.value })}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
        >
          {DND_ALIGNMENTS.map((align) => (
            <option key={align.id} value={align.id}>
              {align.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-amber-400 mb-2">
            Max HP
          </label>
          <input
            type="number"
            min="1"
            value={characterData.hp_max}
            onChange={(e) => updateBasics({ hp_max: parseInt(e.target.value) || 1 })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-400 mb-2">
            Armor Class (AC)
          </label>
          <input
            type="number"
            min="1"
            value={characterData.ac}
            onChange={(e) => updateBasics({ ac: parseInt(e.target.value) || 10 })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  )

  const renderAbilitiesStep = () => (
    <div className="space-y-6">
      <p className="text-slate-300">
        Set your ability scores. The modifier is calculated automatically.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(Object.keys(characterData.abilities) as Array<keyof typeof characterData.abilities>).map((ability) => {
          const score = characterData.abilities[ability]
          const modifier = getAbilityModifier(score)
          return (
            <div key={ability} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <label className="block text-sm font-semibold text-amber-400 mb-3">
                {ABILITY_NAMES[ability]}
              </label>
              <input
                type="number"
                min="1"
                value={score}
                onChange={(e) => updateAbility(ability, parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-center text-lg font-bold focus:outline-none focus:border-amber-500 mb-3"
              />
              <div className="text-center">
                <p className="text-slate-400 text-xs mb-1">Modifier</p>
                <p className={`text-2xl font-bold ${modifier >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {modifier >= 0 ? '+' : ''}{modifier}
                </p>
              </div>
            </div>
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
        <p className="text-slate-300">
          Select proficiencies and expertise for your skills.
        </p>
        {Object.entries(skillsByAbility).map(([ability, skills]) => (
          <div key={ability}>
            <h3 className="text-lg font-semibold text-amber-400 mb-4">{ability}</h3>
            <div className="space-y-2">
              {skills.map((skill) => {
                const skillData = characterData.skills[skill.id]
                return (
                  <div key={skill.id} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded">
                    <input
                      type="checkbox"
                      id={`prof-${skill.id}`}
                      checked={skillData.proficient}
                      onChange={() => toggleSkillProficiency(skill.id)}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <label htmlFor={`prof-${skill.id}`} className="flex-1 text-slate-300 cursor-pointer">
                      {skill.name}
                    </label>
                    <input
                      type="checkbox"
                      id={`exp-${skill.id}`}
                      checked={skillData.expertise}
                      onChange={() => toggleSkillExpertise(skill.id)}
                      disabled={!skillData.proficient}
                      className="w-4 h-4 accent-amber-500 disabled:opacity-50"
                    />
                    <label htmlFor={`exp-${skill.id}`} className="text-xs text-slate-400 cursor-pointer">
                      Expertise
                    </label>
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
      <button
        onClick={addFeature}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
      >
        Add Feature
      </button>
      <div className="space-y-4">
        {characterData.features.map((feature) => (
          <div key={feature.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-3">
            <input
              type="text"
              value={feature.name}
              onChange={(e) => updateFeature(feature.id, { name: e.target.value })}
              placeholder="Feature name"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-amber-500"
            />
            <textarea
              value={feature.description}
              onChange={(e) => updateFeature(feature.id, { description: e.target.value })}
              placeholder="Description"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-amber-500"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={feature.source}
                onChange={(e) => updateFeature(feature.id, { source: e.target.value })}
                placeholder="Source (e.g., Class Feature)"
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-amber-500"
              />
              <input
                type="number"
                min="0"
                value={feature.uses}
                onChange={(e) => updateFeature(feature.id, { uses: parseInt(e.target.value) || 0 })}
                placeholder="Uses"
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={() => removeFeature(feature.id)}
              className="px-3 py-1 bg-red-900/50 hover:bg-red-900 text-red-200 text-sm rounded transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  const renderEquipmentStep = () => (
    <div className="space-y-4">
      <button
        onClick={addEquipment}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
      >
        Add Equipment
      </button>
      <div className="space-y-4">
        {characterData.equipment.map((item) => (
          <div key={item.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-3">
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateEquipment(item.id, { name: e.target.value })}
              placeholder="Item name"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-amber-500"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateEquipment(item.id, { quantity: parseInt(e.target.value) || 1 })}
                placeholder="Qty"
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-amber-500"
              />
              <input
                type="number"
                min="0"
                step="0.1"
                value={item.weight}
                onChange={(e) => updateEquipment(item.id, { weight: parseFloat(e.target.value) || 0 })}
                placeholder="Weight"
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-amber-500"
              />
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded border border-slate-600">
                <input
                  type="checkbox"
                  checked={item.equipped}
                  onChange={(e) => updateEquipment(item.id, { equipped: e.target.checked })}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-sm text-slate-300">Equipped</span>
              </label>
            </div>
            <button
              onClick={() => removeEquipment(item.id)}
              className="px-3 py-1 bg-red-900/50 hover:bg-red-900 text-red-200 text-sm rounded transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSpellsStep = () => (
    <div className="space-y-6">
      <p className="text-slate-300">Spell management (basic version)</p>
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <label className="block text-sm font-semibold text-amber-400 mb-2">
          Cantrips (comma-separated)
        </label>
        <input
          type="text"
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
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-amber-500"
          placeholder="e.g., Fire Bolt, Mage Hand"
        />
      </div>
    </div>
  )

  const renderBackstoryStep = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-amber-400 mb-2">
          Personality Traits
        </label>
        <textarea
          value={characterData.personalityTraits}
          onChange={(e) => updateBasics({ personalityTraits: e.target.value })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
          rows={3}
          placeholder="Describe personality traits..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-amber-400 mb-2">
          Ideals
        </label>
        <textarea
          value={characterData.ideals}
          onChange={(e) => updateBasics({ ideals: e.target.value })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
          rows={3}
          placeholder="What ideals does your character hold..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-amber-400 mb-2">
          Bonds
        </label>
        <textarea
          value={characterData.bonds}
          onChange={(e) => updateBasics({ bonds: e.target.value })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
          rows={3}
          placeholder="Bonds to people, places, or things..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-amber-400 mb-2">
          Flaws
        </label>
        <textarea
          value={characterData.flaws}
          onChange={(e) => updateBasics({ flaws: e.target.value })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
          rows={3}
          placeholder="Character flaws and weaknesses..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-amber-400 mb-2">
          Appearance
        </label>
        <textarea
          value={characterData.appearance}
          onChange={(e) => updateBasics({ appearance: e.target.value })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
          rows={3}
          placeholder="Physical description..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-amber-400 mb-2">
          Backstory
        </label>
        <textarea
          value={characterData.backstory}
          onChange={(e) => updateBasics({ backstory: e.target.value })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
          rows={5}
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
    <div className="min-h-screen bg-slate-900">
      <div className="p-8">
        <h1 className="text-4xl font-bold text-amber-400 mb-8">Create New Character</h1>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => goToStep(step.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    index === currentStepIndex
                      ? 'bg-amber-600 text-white'
                      : index < currentStepIndex
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {index + 1}
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStepIndex ? 'bg-green-600' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs">
            {STEPS.map((step) => (
              <span key={step.id} className="text-slate-400">
                {step.label}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-slate-800/50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-amber-400 mb-6">
            {STEPS[currentStepIndex].label}
          </h2>
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goPrevStep}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          {currentStepIndex === STEPS.length - 1 ? (
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !characterData.name}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
            >
              <Save size={20} />
              {createMutation.isPending ? 'Saving...' : 'Create Character'}
            </button>
          ) : (
            <button
              onClick={goNextStep}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {createMutation.isError && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded text-red-200">
            Error creating character: {String(createMutation.error)}
          </div>
        )}
      </div>
    </div>
  )
}
