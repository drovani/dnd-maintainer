import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AbilitiesStep,
  BackstoryStep,
  BasicsStep,
  EquipmentStep,
  FeaturesStep,
  SkillsStep,
  SpellsStep,
} from '@/components/character-builder'
import type { CharacterData } from '@/components/character-builder'
import { useBuilderAutosave } from '@/hooks/useBuilderAutosave'
import { ABILITY_NAME_TO_KEY, DND_ALIGNMENTS, DND_BACKGROUNDS, DND_CLASSES, DND_RACES, DND_SKILLS, getAbilityModifier } from '@/lib/dnd-helpers'
import type { AbilityScores } from '@/types/database'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

type StepType = 'basics' | 'abilities' | 'skills' | 'features' | 'equipment' | 'spells' | 'backstory'
type RequiredField = 'name' | 'race' | 'class'

const STEPS: { id: StepType; label: string }[] = [
  { id: 'basics', label: 'Basics' }, { id: 'abilities', label: 'Abilities' },
  { id: 'skills', label: 'Skills' }, { id: 'features', label: 'Features' },
  { id: 'equipment', label: 'Equipment' }, { id: 'spells', label: 'Spells' },
  { id: 'backstory', label: 'Backstory' },
]

const REQUIRED_FIELDS: { field: RequiredField; step: StepType; label: string }[] = [
  { field: 'name', step: 'basics', label: 'Character Name' },
  { field: 'race', step: 'basics', label: 'Race' },
  { field: 'class', step: 'basics', label: 'Class' },
]

const INITIAL_CHARACTER_DATA: CharacterData = {
  name: '', player_name: '', character_type: 'pc',
  race: DND_RACES[0].id, class: DND_CLASSES[0].id, level: 1,
  background: DND_BACKGROUNDS[0].id, custom_background: '', alignment: DND_ALIGNMENTS[4].id,
  abilityMethod: 'standard-array',
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  abilityAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
  rolledValues: [],
  skills: DND_SKILLS.reduce((acc, s) => ({ ...acc, [s.id]: { proficient: false, expertise: false } }), {}),
  features: [], equipment: [],
  spells: { cantrips: [], spellsByLevel: {}, spellSlots: {} },
  personalityTraits: '', ideals: '', bonds: '', flaws: '', appearance: '', backstory: '',
  hp_max: 0, ac: 10,
}

export default function CharacterBuilder() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<StepType>('basics')
  const [characterData, setCharacterData] = useState<CharacterData>(INITIAL_CHARACTER_DATA)
  const [visitedSteps, setVisitedSteps] = useState<Set<StepType>>(new Set())
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequiredField, boolean>>>({})
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [finalizeError, setFinalizeError] = useState<string | null>(null)
  const { saveStatus, saveDraft, finalize, clearStatus } = useBuilderAutosave()

  useEffect(() => {
    if (saveStatus !== 'saved') return
    const timer = setTimeout(() => clearStatus(), 2000)
    return () => clearTimeout(timer)
  }, [saveStatus, clearStatus])

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)
  const selectedClass = DND_CLASSES.find((c) => c.id === characterData.class)
  const selectedRace = DND_RACES.find((r) => r.id === characterData.race)
  const racialBonuses = selectedRace?.abilityBonuses ?? {}
  const conWithRacial = characterData.abilities.con + (racialBonuses.con ?? 0)
  const dexWithRacial = characterData.abilities.dex + (racialBonuses.dex ?? 0)
  const calculatedHp = (selectedClass?.hitDie ?? 8) + getAbilityModifier(conWithRacial)
  const calculatedAc = 10 + getAbilityModifier(dexWithRacial)

  const buildPayload = () => ({
    campaign_id: campaignId as string,
    name: characterData.name, character_type: characterData.character_type,
    player_name: characterData.player_name || null,
    race: selectedRace?.name ?? null, class: selectedClass?.name ?? null,
    subclass: null, level: characterData.level,
    background: characterData.custom_background || characterData.background || null,
    alignment: characterData.alignment || null,
    hit_points_max: calculatedHp, hit_points_current: calculatedHp, armor_class: calculatedAc,
    speed: selectedRace?.speed ?? 30, abilities: characterData.abilities,
    saving_throws: Object.fromEntries(
      (selectedClass?.savingThrowProficiencies ?? []).map((a) => [ABILITY_NAME_TO_KEY[a], { proficient: true }])
    ),
    skills: characterData.skills, features: characterData.features,
    equipment: characterData.equipment, spells: characterData.spells,
    personality_traits: characterData.personalityTraits || null,
    ideals: characterData.ideals || null, bonds: characterData.bonds || null,
    flaws: characterData.flaws || null, appearance: characterData.appearance || null,
    backstory: characterData.backstory || null, notes: null,
  })

  const validateStep = (step: StepType) => {
    setFieldErrors((prev) => {
      const errors = { ...prev }
      for (const { field, step: fs } of REQUIRED_FIELDS) {
        if (fs === step) errors[field] = !characterData[field]
      }
      return errors
    })
  }

  const stepHasErrors = (step: StepType) =>
    visitedSteps.has(step) &&
    REQUIRED_FIELDS.some(({ field, step: fs }) => fs === step && fieldErrors[field])

  const isReadyToFinalize = REQUIRED_FIELDS.every(({ field }) => !!characterData[field])

  const goToStep = (targetStep: StepType) => {
    const id = STEPS[currentStepIndex].id
    setVisitedSteps((prev) => new Set([...prev, id]))
    validateStep(id)
    saveDraft(buildPayload()).catch((err) => console.error('Autosave failed during step navigation:', err))
    setCurrentStep(targetStep)
  }

  const goNextStep = () => { if (currentStepIndex < STEPS.length - 1) goToStep(STEPS[currentStepIndex + 1].id) }
  const goPrevStep = () => { if (currentStepIndex > 0) goToStep(STEPS[currentStepIndex - 1].id) }

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
    for (const key of Object.keys(updates)) {
      if (key in fieldErrors) setFieldErrors((prev) => ({ ...prev, [key as RequiredField]: false }))
    }
    setCharacterData((prev) => {
      const next = { ...prev, ...updates }
      // Reset skill selections when class changes — each class has a different available skill pool
      if ('class' in updates && updates.class !== prev.class) {
        next.skills = Object.fromEntries(DND_SKILLS.map((s) => [s.id, { proficient: false, expertise: false }]))
      }
      return next
    })
  }

  const updateBackstory = (updates: Partial<CharacterData>) => {
    setCharacterData((prev) => ({ ...prev, ...updates }))
  }

  const resetAbilitiesForMethod = (method: CharacterData['abilityMethod']) => {
    const d = method === 'point-buy' ? 8 : 10
    setCharacterData((prev) => ({
      ...prev, abilityMethod: method,
      abilities: { str: d, dex: d, con: d, int: d, wis: d, cha: d },
      abilityAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
      rolledValues: method === 'rolling' ? prev.rolledValues : [],
    }))
  }

  const handleAbilitiesChange = (
    abilities: AbilityScores,
    assignments: Record<string, number | null>,
    rolledValues?: number[]
  ) => {
    setCharacterData((prev) => ({
      ...prev, abilities, abilityAssignments: assignments,
      ...(rolledValues !== undefined ? { rolledValues } : {}),
    }))
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
      if (!current) { console.warn(`Skill data missing for "${skillId}" — possible state desync`); return prev }
      if (current.proficient) return { ...prev, skills: { ...prev.skills, [skillId]: { proficient: false, expertise: false } } }
      if (Object.values(prev.skills).filter((s) => s.proficient).length >= cls.skillChoices) return prev
      return { ...prev, skills: { ...prev.skills, [skillId]: { proficient: true, expertise: false } } }
    })
  }

  const addFeature = () => setCharacterData((prev) => ({
    ...prev, features: [...prev.features, { id: `feature-${Date.now()}`, name: '', description: '', source: '', uses: 0 }],
  }))
  const updateFeature = (id: string, updates: Partial<CharacterData['features'][0]>) =>
    setCharacterData((prev) => ({ ...prev, features: prev.features.map((f) => f.id === id ? { ...f, ...updates } : f) }))
  const removeFeature = (id: string) =>
    setCharacterData((prev) => ({ ...prev, features: prev.features.filter((f) => f.id !== id) }))

  const addEquipment = () => setCharacterData((prev) => ({
    ...prev, equipment: [...prev.equipment, { id: `equipment-${Date.now()}`, name: '', quantity: 1, weight: 0, equipped: false }],
  }))
  const updateEquipment = (id: string, updates: Partial<CharacterData['equipment'][0]>) =>
    setCharacterData((prev) => ({ ...prev, equipment: prev.equipment.map((e) => e.id === id ? { ...e, ...updates } : e) }))
  const removeEquipment = (id: string) =>
    setCharacterData((prev) => ({ ...prev, equipment: prev.equipment.filter((e) => e.id !== id) }))

  const renderStep = () => {
    const cd = characterData
    switch (currentStep) {
      case 'basics': return (
        <BasicsStep characterType={cd.character_type} name={cd.name} playerName={cd.player_name}
          race={cd.race} characterClass={cd.class} background={cd.background}
          customBackground={cd.custom_background} alignment={cd.alignment}
          level={cd.level} fieldErrors={fieldErrors} onChange={updateBasics} />
      )
      case 'abilities': return (
        <AbilitiesStep abilityMethod={cd.abilityMethod} abilities={cd.abilities}
          abilityAssignments={cd.abilityAssignments} rolledValues={cd.rolledValues}
          racialBonuses={racialBonuses} selectedRace={selectedRace}
          onMethodChange={resetAbilitiesForMethod} onAbilitiesChange={handleAbilitiesChange} />
      )
      case 'skills': return (
        <SkillsStep characterClass={cd.class} level={cd.level} skills={cd.skills}
          abilities={cd.abilities} racialBonuses={racialBonuses} onSkillToggle={toggleSkillProficiency} />
      )
      case 'features': return (
        <FeaturesStep features={cd.features} onAdd={addFeature} onUpdate={updateFeature} onRemove={removeFeature} />
      )
      case 'equipment': return (
        <EquipmentStep equipment={cd.equipment} onAdd={addEquipment} onUpdate={updateEquipment} onRemove={removeEquipment} />
      )
      case 'spells': return (
        <SpellsStep spells={cd.spells} onSpellsChange={(spells) => setCharacterData((prev) => ({ ...prev, spells }))} />
      )
      case 'backstory': return (
        <BackstoryStep personalityTraits={cd.personalityTraits} ideals={cd.ideals} bonds={cd.bonds}
          flaws={cd.flaws} appearance={cd.appearance} backstory={cd.backstory} onChange={updateBackstory} />
      )
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
                    className={`size-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      index === currentStepIndex ? 'bg-primary text-primary-foreground'
                        : stepHasErrors(step.id) ? 'bg-destructive text-destructive-foreground'
                        : index < currentStepIndex ? 'bg-green-600 text-white'
                        : 'bg-muted text-muted-foreground'}`}
                  >
                    {index + 1}
                  </button>
                  <span className="text-xs text-muted-foreground mt-2">{step.label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 self-start mt-5 ${index < currentStepIndex ? 'bg-green-600' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">{STEPS[currentStepIndex].label}</h2>
            {renderStep()}
          </CardContent>
        </Card>

        {(finalizeError || saveStatus === 'error') && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm flex items-center justify-between">
            <span>
              {finalizeError ? `Failed to finalize character: ${finalizeError}` : 'Failed to save draft. Your recent changes may not have been saved.'}
            </span>
            {saveStatus === 'error' && (
              <Button variant="outline" size="sm" onClick={() => saveDraft(buildPayload()).catch((err) => console.error('Retry save failed:', err))}>
                Retry Save
              </Button>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={goPrevStep} disabled={currentStepIndex === 0}>
            <ChevronLeft size={16} />
            Previous
          </Button>
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && <span className="text-sm text-muted-foreground">Saving...</span>}
            {saveStatus === 'saved' && <span className="text-sm text-muted-foreground">Draft saved</span>}
            {currentStepIndex < STEPS.length - 1 && (
              <Button onClick={goNextStep}>Next <ChevronRight size={16} /></Button>
            )}
            <Button onClick={handleFinalize} disabled={isFinalizing || !isReadyToFinalize}>
              <Save className="size-4" />
              {isFinalizing ? 'Finalizing...' : 'Finalize Character'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
