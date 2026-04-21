import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AbilitiesStep,
  BackstoryStep,
  BasicsStep,
  ClassFeaturesStep,
  EquipmentStep,
  ProficienciesStep,
  SkillsStep,
} from '@/components/character-builder'
import { CharacterProvider, useCharacterContext } from '@/hooks/useCharacterContext'
import { useBuilderAutosave } from '@/hooks/useBuilderAutosave'
import type { AutosavePayload } from '@/hooks/useBuilderAutosave'
import { useCharacterBuildLevels, useCharacterItems } from '@/hooks/useCharacterBuild'
import { useCharacter } from '@/hooks/useCharacters'
import { useCampaignContext } from '@/hooks/useCampaignContext'
import type { Character } from '@/types/database'
import { ChevronLeft, ChevronRight, Save, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DND_RACES, DND_CLASSES } from '@/lib/dnd-helpers'
import type { StepType } from '@/types/character-builder'

const STEPS: { id: StepType }[] = [
  { id: 'basics' }, { id: 'abilities' },
  { id: 'skills' }, { id: 'classFeatures' },
  { id: 'proficiencies' }, { id: 'equipment' },
  { id: 'backstory' },
]

function renderStep(step: StepType, goToStep: (s: StepType) => void): ReactElement {
  switch (step) {
    case 'basics': return <BasicsStep onRequestAdvance={goToStep} />
    case 'abilities': return <AbilitiesStep />
    case 'skills': return <SkillsStep />
    case 'classFeatures': return <ClassFeaturesStep />
    case 'proficiencies': return <ProficienciesStep />
    case 'equipment': return <EquipmentStep />
    case 'backstory': return <BackstoryStep />
    default: {
      const _exhaustive: never = step
      return _exhaustive
    }
  }
}

function buildSeedCharacter(campaignId: string): Character {
  return {
    id: '',
    slug: '',
    previous_slugs: [],
    campaign_id: campaignId,
    name: '',
    player_name: null,
    character_type: 'pc',
    race: null,
    class: null,
    subclass: null,
    level: 0,
    background: null,
    alignment: null,
    gender: null,
    size: null,
    age: null,
    height: null,
    weight: null,
    eye_color: null,
    hair_color: null,
    skin_color: null,
    hit_points_max: null,
    armor_class: null,
    speed: null,
    proficiency_bonus: null,
    personality_traits: null,
    ideals: null,
    bonds: null,
    flaws: null,
    appearance: null,
    backstory: null,
    notes: null,
    portrait_url: null,
    is_active: true,
    status: 'draft',
    created_at: '',
    updated_at: '',
  }
}

function CharacterBuilderInner() {
  const { t } = useTranslation('common')
  const { t: tg } = useTranslation('gamedata')
  const { campaignSlug } = useParams<{ campaignSlug: string }>()
  const { campaignId } = useCampaignContext()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<StepType>('basics')
  // Tracks the furthest step the user has reached. We use this to defer "Before you
  // can finalize" hints until the user has seen every step at least once — otherwise
  // a brand-new character on step 1 shows a wall of expected-missing warnings.
  const [furthestStepIndex, setFurthestStepIndex] = useState(0)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [finalizeError, setFinalizeError] = useState<string | null>(null)
  const [confirmAbandon, setConfirmAbandon] = useState(false)
  const [isAbandoning, setIsAbandoning] = useState(false)
  const { saveStatus, saveDraft, finalize, clearStatus, abandon, markSaveError } = useBuilderAutosave()

  const context = useCharacterContext()
  const { character, rows, resolved, buildError, isDirty, markSaved } = context

  useEffect(() => {
    if (saveStatus !== 'saved') return
    const timer = setTimeout(() => clearStatus(), 2000)
    return () => clearTimeout(timer)
  }, [saveStatus, clearStatus])

  // Keep a ref to the latest payload so the debounced save always uses fresh data
  const latestPayloadRef = useRef<AutosavePayload>({ character, rows, resolved })
  latestPayloadRef.current = { character, rows, resolved }

  // Required fields before any draft can be saved
  const hasRequiredFields = !!character.name && !!character.race && !!character.class && !!character.alignment

  // Autosave when isDirty changes to true — debounced 500ms, only if required fields present
  useEffect(() => {
    if (!isDirty || !hasRequiredFields) return
    const timer = setTimeout(() => {
      saveDraft(latestPayloadRef.current)
        .then(() => markSaved())
        .catch((err: unknown) => {
          // saveDraft sets saveStatus='error' internally on its own failure. This
          // .catch covers the markSaved() path too: if it fails, we still need
          // the banner so the user knows "saved" on screen is misleading.
          console.error('Autosave chain error:', err, { characterId: character.id, campaignId: character.campaign_id })
          markSaveError()
        })
    }, 500)
    return () => clearTimeout(timer)
  }, [isDirty, hasRequiredFields, saveDraft, markSaved, markSaveError, character.id, character.campaign_id])

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)

  const selectedRace = character.race ? DND_RACES.find((r) => r.id === character.race) : null
  const selectedClass = character.class ? DND_CLASSES.find((c) => c.id === character.class) : null

  const isReadyToFinalize =
    !!character.name &&
    !!character.race &&
    !!character.class &&
    !!character.background &&
    (resolved?.pendingChoices.length ?? 0) === 0

  // Surface exactly what's blocking finalize so the user can find and fix it.
  const finalizeBlockers: readonly string[] = (() => {
    const reasons: string[] = []
    if (!character.name) reasons.push(t('characterBuilder.finalizeBlockers.missingName'))
    if (!character.race) reasons.push(t('characterBuilder.finalizeBlockers.missingRace'))
    if (!character.class) reasons.push(t('characterBuilder.finalizeBlockers.missingClass'))
    if (!character.background) reasons.push(t('characterBuilder.finalizeBlockers.missingBackground'))
    for (const pending of resolved?.pendingChoices ?? []) {
      reasons.push(
        t('characterBuilder.finalizeBlockers.pendingChoice', {
          type: pending.type,
          key: pending.choiceKey,
        }),
      )
    }
    return reasons
  })()

  // Can only leave Basics step once required fields are filled
  const canLeaveBasics = hasRequiredFields

  const goToStep = (targetStep: StepType) => {
    const targetIndex = STEPS.findIndex((s) => s.id === targetStep)
    if (targetIndex > 0 && !canLeaveBasics) return
    if (hasRequiredFields) {
      const payload: AutosavePayload = { character, rows, resolved }
      saveDraft(payload)
        .then(() => markSaved())
        .catch((err: unknown) => {
          // saveDraft sets saveStatus='error' internally on its own failure. This
          // .catch covers the markSaved() path too: if it fails, we still need
          // the banner so the user knows "saved" on screen is misleading.
          console.error('Autosave chain error:', err, { characterId: character.id, campaignId: character.campaign_id })
          markSaveError()
        })
    }
    setCurrentStep(targetStep)
    setFurthestStepIndex((prev) => Math.max(prev, targetIndex))
  }

  const goNextStep = () => { if (currentStepIndex < STEPS.length - 1) goToStep(STEPS[currentStepIndex + 1].id) }
  const goPrevStep = () => { if (currentStepIndex > 0) goToStep(STEPS[currentStepIndex - 1].id) }

  const handleAbandon = async () => {
    if (!campaignId || !campaignSlug) return
    setIsAbandoning(true)
    try {
      await abandon(campaignId)
      toast.success(t('characterBuilder.abandon.success'))
      navigate(`/campaign/${campaignSlug}/characters`)
    } catch (err) {
      console.error('Abandon draft failed:', err)
      toast.error(t('characterBuilder.abandon.failed'))
      setIsAbandoning(false)
      setConfirmAbandon(false)
    }
  }

  const handleFinalize = async () => {
    if (!hasRequiredFields) return
    setIsFinalizing(true)
    setFinalizeError(null)
    try {
      const payload: AutosavePayload = { character, rows, resolved }
      const slug = await finalize(payload)
      navigate(`/campaign/${campaignSlug}/character/${slug}`)
    } catch (err) {
      console.error('Character finalization failed:', err)
      setFinalizeError(err instanceof Error ? err.message : t('errors.unexpectedError'))
    } finally {
      setIsFinalizing(false)
    }
  }

  if (!campaignId || !campaignSlug) {
    return <div className="page-container"><p className="text-destructive">{t('characterBuilder.errors.noCampaignId')}</p></div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container">
        <h1 className="page-title mb-8">{t('characterBuilder.title')}</h1>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-start">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => goToStep(step.id)}
                    disabled={index > 0 && !canLeaveBasics}
                    className={`size-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      index === currentStepIndex
                        ? 'bg-primary text-primary-foreground'
                        : index < currentStepIndex
                          ? 'bg-green-600 text-white'
                          : index > 0 && !canLeaveBasics
                            ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                            : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </button>
                  <span className="text-xs text-muted-foreground mt-2">{t(`characterBuilder.steps.${step.id}`)}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 self-start mt-5 ${index < currentStepIndex ? 'bg-green-600' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Character Summary */}
        <div className="mb-4 text-center text-lg text-muted-foreground h-7">
          {character.name && selectedRace && selectedClass && (
            <>
              <span className="font-semibold text-foreground">{character.name}</span>
              {' · '}
              {tg(`races.${selectedRace.id}`)}
              {' · '}
              {tg(`classes.${selectedClass.id}`)}
            </>
          )}
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">{t(`characterBuilder.steps.${STEPS[currentStepIndex].id}`)}</h2>
            {renderStep(currentStep, goToStep)}
          </CardContent>
        </Card>

        {buildError && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
            {t('characterSheet.errors.buildFailed', { message: buildError })}
          </div>
        )}

        {(finalizeError || saveStatus === 'error') && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm flex items-center justify-between">
            <span>
              {finalizeError
                ? t('characterBuilder.errors.failedToFinalize', { message: finalizeError })
                : t('characterBuilder.errors.failedToSaveDraft')}
            </span>
            {saveStatus === 'error' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const payload: AutosavePayload = { character, rows, resolved }
                  saveDraft(payload)
                    .then(() => markSaved())
                    .catch((err: unknown) => {
                      console.error('Autosave chain error:', err, { characterId: character.id, campaignId: character.campaign_id })
                      markSaveError()
                    })
                }}
              >
                {t('buttons.retrySave')}
              </Button>
            )}
          </div>
        )}

        {/* Navigation */}
        {/* Only surface finalize blockers once the user has reached the final step.
            Earlier in the flow they would just be a wall of expected-missing warnings. */}
        {furthestStepIndex >= STEPS.length - 1 && !isReadyToFinalize && finalizeBlockers.length > 0 && (
          <div className="mb-3 rounded-md border border-dashed border-amber-500/50 bg-amber-500/5 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
            <p className="font-semibold mb-1">{t('characterBuilder.finalizeBlockers.title')}</p>
            <ul className="space-y-0.5">
              {finalizeBlockers.map((reason, i) => (
                <li key={i}>• {reason}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={goPrevStep} disabled={currentStepIndex === 0}>
              <ChevronLeft size={16} />
              {t('buttons.previous')}
            </Button>
            <Button variant="destructive" onClick={() => setConfirmAbandon(true)}>
              <Trash2 className="size-4" />
              {t('buttons.abandonCharacter')}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && <span className="text-sm text-muted-foreground">{t('characterBuilder.status.saving')}</span>}
            {saveStatus === 'saved' && <span className="text-sm text-muted-foreground">{t('characterBuilder.status.draftSaved')}</span>}
            {currentStepIndex < STEPS.length - 1 && (
              <Button onClick={goNextStep} disabled={currentStepIndex === 0 && !canLeaveBasics}>{t('buttons.next')} <ChevronRight size={16} /></Button>
            )}
            <Button onClick={handleFinalize} disabled={!isReadyToFinalize} pending={isFinalizing}>
              <Save className="size-4" />
              {isFinalizing ? t('buttons.finalizing') : t('buttons.finalizeCharacter')}
            </Button>
          </div>
        </div>

        {confirmAbandon && (
          <Dialog open onOpenChange={(open) => { if (!open && !isAbandoning) setConfirmAbandon(false) }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('characterBuilder.abandon.title')}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">{t('characterBuilder.abandon.confirm')}</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmAbandon(false)} disabled={isAbandoning}>
                  {t('buttons.cancel')}
                </Button>
                <Button variant="destructive" onClick={handleAbandon} pending={isAbandoning}>
                  <Trash2 className="size-4" />
                  {t('buttons.abandonCharacter')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

export default function CharacterBuilder() {
  const { campaignSlug, characterSlug } = useParams<{ campaignSlug: string; characterSlug: string }>()
  const { campaignId } = useCampaignContext()
  const { t } = useTranslation('common')

  const isNew = !characterSlug
  const { data: existingCharacter, isLoading: characterLoading, error: characterError } = useCharacter(
    isNew ? undefined : characterSlug
  )
  const { data: buildRows = [], isLoading: rowsLoading } = useCharacterBuildLevels(
    isNew ? undefined : existingCharacter?.id
  )
  const { data: itemsData = [], isLoading: itemsLoading } = useCharacterItems(
    isNew ? undefined : existingCharacter?.id
  )

  if (!campaignId || !campaignSlug) {
    return (
      <div className="page-container">
        <p className="text-destructive">{t('characterBuilder.errors.noCampaignId')}</p>
      </div>
    )
  }

  const isLoading = !isNew && (characterLoading || rowsLoading || itemsLoading)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="page-container">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-12 w-full bg-muted rounded" />
            <div className="h-96 w-full bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!isNew && (characterError || !existingCharacter || !existingCharacter.id)) {
    return (
      <div className="page-container">
        <p className="text-destructive">
          {t('characterSheet.errors.loadingCharacter', { error: String(characterError) })}
        </p>
      </div>
    )
  }

  const initialCharacter = isNew ? buildSeedCharacter(campaignId) : existingCharacter!
  const initialRows = isNew ? [] : buildRows
  const initialEquippedItems: string[] = isNew
    ? []
    : itemsData.filter((item: { equipped?: boolean; item_id?: string }) => item.equipped).map((item: { item_id?: string }) => item.item_id ?? '')

  return (
    <CharacterProvider
      key={characterSlug ?? 'new'}
      initialCharacter={initialCharacter}
      initialRows={initialRows}
      initialEquippedItems={initialEquippedItems}
    >
      <CharacterBuilderInner />
    </CharacterProvider>
  )
}
