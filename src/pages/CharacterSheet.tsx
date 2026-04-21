import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GenderToggle } from '@/components/ui/gender-toggle'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { AttacksPanel } from '@/components/character-sheet/AttacksPanel'
import { BonusBreakdown } from '@/components/character-sheet/BonusBreakdown'
import { LevelControls } from '@/components/character-sheet/LevelControls'
import { PendingChoicesPanel } from '@/components/character-sheet/PendingChoicesPanel'
import { ProficienciesPanel } from '@/components/character-sheet/ProficienciesPanel'
import { SkillsPanel } from '@/components/character-sheet/SkillsPanel'
import { getGrantIcon, getSourceDisplayName } from '@/lib/class-icons'
import { getItemDef, getItemNameKey } from '@/lib/sources/items'
import { useCharacter, useCharacterMutations } from '@/hooks/useCharacters'
import { useCharacterBuildLevels, useCharacterItems } from '@/hooks/useCharacterBuild'
import { CharacterProvider, useCharacterContext } from '@/hooks/useCharacterContext'
import type { PersistedItem } from '@/lib/resolver/index'
import type { SourceTag } from '@/types/sources'
import {
  DND_CLASSES,
  getProficiencyBonus,
  isBackgroundId,
  type ClassId,
  type DndGender,
} from '@/lib/dnd-helpers'
import type { Character } from '@/types/database'
import { Archive, Check, Edit2, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useBuilderAutosave } from '@/hooks/useBuilderAutosave'
import type { AutosavePayload } from '@/hooks/useBuilderAutosave'

type EditSection = 'header' | 'personality' | 'backstory' | 'appearance' | null

function SectionHeader({ title, onEdit }: { title: string; onEdit: () => void }) {
  const { t } = useTranslation('common')
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onEdit}
        title={t('characterSheet.editSection', { section: title })}
      >
        <Edit2 size={14} />
      </Button>
    </div>
  )
}

function ModalFooter({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  const { t } = useTranslation('common')
  return (
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>
        {t('buttons.cancel')}
      </Button>
      <Button onClick={onSave} pending={saving}>
        <Save size={14} />
        {saving ? t('buttons.saving') : t('buttons.save')}
      </Button>
    </DialogFooter>
  )
}


function CharacterSheetInner({ character, itemsData, characterId }: {
  character: Character
  itemsData: Array<{ id: string; item_id: string; equipped?: boolean; quantity: number; source?: unknown }>
  characterId: string
}) {
  const { t } = useTranslation('gamedata')
  const { t: tc } = useTranslation('common')
  const [editSection, setEditSection] = useState<EditSection>(null)

  const navigate = useNavigate()
  const { campaignSlug } = useParams<{ campaignSlug: string }>()
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null)

  const { update: updateMutation, remove: removeMutation } = useCharacterMutations()
  const { character: ctxCharacter, rows, resolved, buildError, buildWarnings, level: resolvedLevel, isDirty, markSaved } = useCharacterContext()
  const { saveDraft } = useBuilderAutosave(characterId)
  const [saveFailed, setSaveFailed] = useState(false)

  // Autosave when isDirty (level up/down, choices, etc.)
  const latestPayloadRef = useRef<AutosavePayload>({ character: ctxCharacter, rows, resolved })
  useEffect(() => {
    latestPayloadRef.current = { character: ctxCharacter, rows, resolved }
  })

  const doSave = useCallback(async () => {
    setSaveFailed(false)
    try {
      await saveDraft(latestPayloadRef.current)
      markSaved()
    } catch (err: unknown) {
      console.error('Autosave failed:', err)
      setSaveFailed(true)
      toast.error(tc('characterBuilder.errors.failedToSaveDraft'))
    }
  }, [saveDraft, markSaved, tc])

  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(doSave, 500)
    return () => clearTimeout(timer)
  }, [isDirty, doSave])

  const handleUpdate = (updates: Partial<Character>) => {
    updateMutation.mutate({ id: characterId, ...updates }, {
      onSuccess: () => setEditSection(null),
      onError: () => toast.error(tc('characterSheet.errors.updateFailed')),
    })
  }

  const handleArchive = () => {
    updateMutation.mutate({ id: characterId, is_active: false }, {
      onSuccess: () => {
        setConfirmAction(null)
        toast.success(tc('characterSheet.actions.archiveSuccess', { name: character.name }))
        navigate(`/campaign/${campaignSlug}/characters`)
      },
      onError: () => toast.error(tc('characterSheet.errors.archiveFailed')),
    })
  }

  const handleDelete = () => {
    removeMutation.mutate({ id: characterId, campaignId: character.campaign_id }, {
      onSuccess: () => {
        setConfirmAction(null)
        toast.success(tc('characterSheet.actions.deleteSuccess', { name: character.name }))
        navigate(`/campaign/${campaignSlug}/characters`)
      },
      onError: () => toast.error(tc('characterSheet.errors.deleteFailed')),
    })
  }

  const buildErrorBanner = buildError ? (
    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
      {tc('characterSheet.errors.buildFailed', { message: buildError })}
    </div>
  ) : null

  const buildWarningBanner = buildWarnings.length > 0 ? (
    <div className="mb-6 p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/40 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
      {tc('characterSheet.warnings.buildIncomplete', { message: buildWarnings.join('; ') })}
    </div>
  ) : null

  const alignmentName = character.alignment ? t(`alignments.${character.alignment}`, { defaultValue: character.alignment }) : ''
  const profBonus = resolved?.proficiencyBonus ?? getProficiencyBonus(character.level)

  // Combat stats — prefer resolved pipeline values, fall back to pre-calculated DB columns.
  // When buildError is set and resolved is null, these are stale values from the database.
  const isStale = buildError !== null && resolved === null
  const armorClass = resolved?.armorClass.effective ?? character.armor_class
  const speedValue = resolved?.speed.walk?.value ?? character.speed
  const maxHP = resolved?.hitPoints.max ?? character.hit_points_max

  // Ability scores — use resolved if available, else undefined (skip section)
  const abilities = resolved?.abilities
  const skills = resolved?.skills
  const savingThrows = resolved?.savingThrows

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto p-8">
        {buildErrorBanner}
        {buildWarningBanner}
        {saveFailed && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm flex items-center justify-between">
            <span>{tc('errors.saveFailed')}</span>
            <Button variant="outline" size="sm" onClick={doSave}>
              {tc('buttons.retrySave')}
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">{tc('characterSheet.title')}</div>
              <h1 className="text-3xl font-bold text-foreground">{character.name}</h1>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditSection('header')}
                title={tc('characterSheet.dialogs.editCharacterInfo')}
              >
                <Edit2 size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setConfirmAction('archive')}
                title={tc('buttons.archive')}
              >
                <Archive size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setConfirmAction('delete')}
                title={tc('buttons.delete')}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{tc('characterSheet.fields.class')}</span>
              <p className="text-foreground font-semibold">
                {character.class ? t(`classes.${character.class}`, { defaultValue: character.class }) : ''}
                {character.subclass ? ` (${t(`subclasses.${character.subclass}.name`, { defaultValue: character.subclass })})` : ''}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">{tc('characterSheet.fields.level')}</span>
              <p className="text-foreground font-semibold">{resolvedLevel}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{tc('characterSheet.fields.race')}</span>
              <p className="text-foreground font-semibold">
                {character.race ? t(`races.${character.race}`, { defaultValue: character.race }) : ''}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">{tc('characterSheet.fields.background')}</span>
              <p className="text-foreground font-semibold">
                {character.background
                      ? (isBackgroundId(character.background) ? t(`backgrounds.${character.background}`) : character.background)
                      : ''}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">{tc('characterSheet.fields.alignment')}</span>
              <p className="text-foreground font-semibold">{alignmentName}</p>
            </div>
            {character.player_name && (
              <div>
                <span className="text-muted-foreground">{tc('characterSheet.fields.player')}</span>
                <p className="text-foreground font-semibold">{character.player_name}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">{tc('characterSheet.fields.type')}</span>
              <p className="text-foreground font-semibold uppercase">{tc(`characterType.${character.character_type}`)}</p>
            </div>
            {character.gender && (
              <div>
                <span className="text-muted-foreground">{tc('characterSheet.fields.gender')}</span>
                <p className="text-foreground font-semibold">{t(`gender.${character.gender}`, { defaultValue: character.gender })}</p>
              </div>
            )}
          </div>

          {/* Level Controls */}
          {character.class && DND_CLASSES.some((c) => c.id === character.class) && (
            <div className="mt-4 pt-4 border-t">
              <LevelControls classId={character.class as ClassId} />
            </div>
          )}
        </div>

        {/* Pending Choices Panel */}
        <div className="mb-6">
          <PendingChoicesPanel />
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column: Abilities & Skills */}
          <div className="lg:col-span-1 space-y-6">
            {/* Ability Scores */}
            {abilities ? (
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.abilities')}</h2>
                <div className="space-y-3">
                  {(Object.keys(abilities) as Array<keyof typeof abilities>).map((ability) => {
                    const resolvedAbility = abilities[ability]
                    const modifier = resolvedAbility.modifier
                    return (
                      <div key={ability} className="bg-muted/50 p-3 rounded border">
                        <div className="text-xs text-muted-foreground mb-1">{t(`abilities.${ability}`)}</div>
                        <div className="flex items-end justify-between">
                          <div className="text-sm font-bold text-foreground">{resolvedAbility.total}</div>
                          <div
                            className={`text-lg font-bold ${modifier >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {modifier >= 0 ? '+' : ''}{modifier}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-card border rounded-lg p-6 text-center text-muted-foreground">
                <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.abilities')}</h2>
                <p>{buildError ? tc('characterSheet.buildError.abilities', { message: buildError }) : tc('characterSheet.emptyState.abilities')}</p>
              </div>
            )}

            {/* Saving Throws */}
            {savingThrows ? (
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.savingThrows')}</h2>
                <div className="space-y-2 text-xs">
                  {(Object.keys(savingThrows) as Array<keyof typeof savingThrows>).map((ability) => {
                    const save = savingThrows[ability]
                    return (
                      <div key={ability} className="flex justify-between items-center text-foreground">
                        <span className={save.proficient ? 'font-bold' : ''}>{t(`abilities.${ability}`)}</span>
                        <BonusBreakdown
                          components={save.breakdown}
                          total={save.bonus}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-card border rounded-lg p-6 text-center text-muted-foreground">
                <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.savingThrows')}</h2>
                <p>{buildError ? tc('characterSheet.buildError.savingThrows', { message: buildError }) : tc('characterSheet.emptyState.savingThrows')}</p>
              </div>
            )}

            {/* Skills */}
            {skills ? (
              <SkillsPanel skills={skills} />
            ) : (
              <div className="bg-card border rounded-lg p-6 text-center text-muted-foreground">
                <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.skills')}</h2>
                <p>{buildError ? tc('characterSheet.buildError.skills', { message: buildError }) : tc('characterSheet.emptyState.skills')}</p>
              </div>
            )}
          </div>

          {/* Center Column: Combat & Features */}
          <div className="lg:col-span-1 space-y-6">
            {/* Combat Stats */}
            <div className="bg-card border-2 border-destructive/30 rounded-lg p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.combat')}</h2>

              {!resolved && (
                <p className="text-sm text-muted-foreground mb-4">
                  {buildError ? tc('characterSheet.buildError.combat', { message: buildError }) : tc('characterSheet.emptyState.combat')}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`bg-muted/50 p-4 rounded border text-center ${isStale ? 'opacity-50' : ''}`}>
                  <div className="text-xs text-muted-foreground mb-2">{tc('characterSheet.fields.armorClass')}</div>
                  <div className="text-4xl font-bold text-foreground">{armorClass}</div>
                </div>

                <div className="bg-muted/50 p-4 rounded border text-center">
                  <div className="text-xs text-muted-foreground mb-2">{tc('characterSheet.fields.initiative')}</div>
                  <div className="text-4xl font-bold text-foreground">
                    {resolved
                      ? (resolved.initiative >= 0 ? '+' : '') + resolved.initiative
                      : (abilities
                          ? (abilities.dex.modifier >= 0 ? '+' : '') + abilities.dex.modifier
                          : '—')}
                  </div>
                </div>
              </div>

              {/* HP Display (read-only) */}
              <div className={`bg-muted/50 p-4 rounded border mb-4 ${isStale ? 'opacity-50' : ''}`}>
                <div className="text-xs text-muted-foreground mb-2">{tc('characterSheet.fields.hitPoints')}</div>
                <div className="text-2xl font-bold text-red-600">{maxHP ?? '—'}</div>
              </div>

              <div className={`text-xs text-muted-foreground ${isStale ? 'opacity-50' : ''}`}>
                <div className="flex justify-between py-1">
                  <span>{tc('characterSheet.fields.proficiencyBonus')}</span>
                  <span className="font-mono font-bold text-foreground">+{profBonus}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>{tc('characterSheet.fields.speed')}</span>
                  <span className="font-mono font-bold text-foreground">
                    {speedValue != null ? tc('characterSheet.fields.speedFt', { value: speedValue }) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Attacks */}
            {resolved && (
              <AttacksPanel attacks={resolved.attacks} />
            )}

            {/* Proficiencies */}
            {resolved && (
              <ProficienciesPanel resolved={resolved} />
            )}

            {/* Features */}
            {resolved?.features && resolved.features.length > 0 && (
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.featuresAndTraits')}</h2>
                <div className="space-y-3">
                  {resolved.features.map((resolvedFeature, i) => (
                    <div key={i} className="bg-muted/50 p-3 rounded border">
                      <div className="font-semibold text-foreground text-sm mb-1">
                        {t(`features.${resolvedFeature.feature.id}.name`, { defaultValue: resolvedFeature.feature.name ?? resolvedFeature.feature.id })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t(`features.${resolvedFeature.feature.id}.description`, { defaultValue: resolvedFeature.feature.description ?? '' })}
                      </p>
                      {resolvedFeature.source && (
                        <div className="text-xs text-muted-foreground/70 mt-1">
                          {tc('characterSheet.fields.source', {
                            source: resolvedFeature.source.origin === 'class'
                              ? t(`classes.${resolvedFeature.source.id}`)
                              : resolvedFeature.source.origin === 'subclass'
                                ? t(`subclasses.${resolvedFeature.source.id}.name`)
                                : resolvedFeature.source.origin === 'race'
                                  ? t(`races.${resolvedFeature.source.id}`)
                                  : resolvedFeature.source.origin === 'background'
                                    ? t(`backgrounds.${resolvedFeature.source.id}`)
                                    : resolvedFeature.source.origin === 'loot'
                                      ? resolvedFeature.source.description
                                      : resolvedFeature.source.id
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Equipment & Spells */}
          <div className="lg:col-span-1 space-y-6">
            {/* Equipment */}
            {itemsData.length > 0 && (
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.equipment')}</h2>
                <div className="space-y-2 text-xs">
                  {itemsData.map((item) => {
                    const itemDef = getItemDef(item.item_id)
                    const type = itemDef?.type ?? 'gear'
                    const itemName = t(getItemNameKey(type, item.item_id), {
                      defaultValue: item.item_id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                    })
                    const detail = (() => {
                      if (itemDef?.type === 'weapon') {
                        return ` — ${itemDef.damageDice} ${t(`damageTypes.${itemDef.damageType}`)}`
                      }
                      if (itemDef?.type === 'armor') {
                        return ` — AC ${itemDef.baseAc}`
                      }
                      return ''
                    })()
                    const itemSource = item.source as SourceTag | null
                    const sourceTooltip = itemSource
                      ? itemSource.origin === 'loot'
                        ? tc('characterSheet.equipment.sourceLoot')
                        : tc('characterSheet.equipment.sourceFrom', {
                            name: getSourceDisplayName(itemSource, t),
                          })
                      : null
                    const SourceIcon = itemSource
                      ? getGrantIcon(itemSource, itemDef?.type === 'pack' ? 'pack' : undefined)
                      : null
                    return (
                      <div
                        key={item.id}
                        className={`flex justify-between items-center py-2 px-2 rounded ${item.equipped ? 'bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900' : 'bg-muted/50'}`}
                      >
                        <div>
                          <div className="font-semibold text-foreground">
                            {itemName}{detail}
                          </div>
                          <div className="text-muted-foreground">
                            {tc('characterSheet.fields.qtyAndWeight', { qty: item.quantity, weight: itemDef?.type !== 'pack' ? (itemDef?.weight ?? 0) : 0 })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.equipped && <Check className="size-4 text-green-600" />}
                          {SourceIcon && (
                            <span title={sourceTooltip ?? undefined} className="inline-flex">
                              <SourceIcon
                                aria-label={sourceTooltip ?? undefined}
                                className="size-5 text-muted-foreground shrink-0"
                              />
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Spells */}
            {resolved?.spellcasting && resolved.spellcasting.cantrips.length > 0 && (
              <div className="bg-card border border-purple-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.spells')}</h2>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-bold text-muted-foreground mb-2">{tc('characterSheet.sections.cantrips')}</div>
                    <div className="space-y-1">
                      {resolved.spellcasting.cantrips.map((cantrip, i) => (
                        <div key={i} className="text-sm text-foreground">
                          &bull; {cantrip}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Personality */}
            {(character.personality_traits || character.ideals || character.bonds || character.flaws) && (
              <div className="bg-card border rounded-lg p-6">
                <SectionHeader title={tc('characterSheet.sections.personality')} onEdit={() => setEditSection('personality')} />
                <div className="space-y-3 text-xs">
                  {character.personality_traits && (
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">{tc('characterSheet.personality.traits')}</div>
                      <p className="text-foreground">{character.personality_traits}</p>
                    </div>
                  )}
                  {character.ideals && (
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">{tc('characterSheet.personality.ideals')}</div>
                      <p className="text-foreground">{character.ideals}</p>
                    </div>
                  )}
                  {character.bonds && (
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">{tc('characterSheet.personality.bonds')}</div>
                      <p className="text-foreground">{character.bonds}</p>
                    </div>
                  )}
                  {character.flaws && (
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">{tc('characterSheet.personality.flaws')}</div>
                      <p className="text-foreground">{character.flaws}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full Width Backstory */}
        {character.backstory && (
          <div className="bg-card border rounded-lg p-6">
            <SectionHeader title={tc('characterSheet.sections.backstory')} onEdit={() => setEditSection('backstory')} />
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{character.backstory}</p>
          </div>
        )}

        {character.appearance && (
          <div className="bg-card border rounded-lg p-6 mt-6">
            <SectionHeader title={tc('characterSheet.sections.appearance')} onEdit={() => setEditSection('appearance')} />
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{character.appearance}</p>
          </div>
        )}
      </div>

      {/* Edit Dialogs */}
      {editSection === 'header' && (
        <EditHeaderDialog
          character={character}
          onSave={handleUpdate}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
      {editSection === 'personality' && (
        <EditPersonalityDialog
          personality_traits={character.personality_traits ?? ''}
          ideals={character.ideals ?? ''}
          bonds={character.bonds ?? ''}
          flaws={character.flaws ?? ''}
          onSave={handleUpdate}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
      {editSection === 'backstory' && (
        <EditTextDialog
          title={tc('characterSheet.dialogs.editBackstory')}
          field="backstory"
          value={character.backstory ?? ''}
          onSave={handleUpdate}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
      {editSection === 'appearance' && (
        <EditTextDialog
          title={tc('characterSheet.dialogs.editAppearance')}
          field="appearance"
          value={character.appearance ?? ''}
          onSave={handleUpdate}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}

      {/* Archive / Delete Confirmation */}
      {confirmAction && (
        <Dialog open onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {confirmAction === 'archive'
                  ? tc('characterSheet.actions.archiveTitle')
                  : tc('characterSheet.actions.deleteTitle')}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {confirmAction === 'archive'
                ? tc('characterSheet.actions.archiveConfirm', { name: character.name })
                : tc('characterSheet.actions.deleteConfirm', { name: character.name })}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmAction(null)}>
                {tc('buttons.cancel')}
              </Button>
              <Button
                variant={confirmAction === 'delete' ? 'destructive' : 'default'}
                onClick={confirmAction === 'archive' ? handleArchive : handleDelete}
                pending={updateMutation.isPending || removeMutation.isPending}
              >
                {confirmAction === 'archive' ? tc('buttons.archive') : tc('buttons.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default function CharacterSheet() {
  const { t: tc } = useTranslation('common')
  const { characterSlug } = useParams<{ campaignSlug: string; characterSlug: string }>()

  const { data: character, isLoading: characterLoading, error } = useCharacter(characterSlug)
  const { data: buildRows = [], isLoading: rowsLoading, error: rowsError } = useCharacterBuildLevels(character?.id)
  const { data: itemsData = [], isLoading: itemsLoading, error: itemsError } = useCharacterItems(character?.id)

  const equippedItems = useMemo(
    () => itemsData.filter((item) => item.equipped).map((item) => item.item_id),
    [itemsData],
  )

  const isFinalized = character?.status === 'ready'

  const persistedItems = useMemo<readonly PersistedItem[]>(() => {
    if (!isFinalized) return []
    return itemsData.map((item) => ({
      itemId: item.item_id,
      quantity: item.quantity,
      equipped: item.equipped,
      source: (item.source as SourceTag | null) ?? { origin: 'item' as const, id: item.item_id },
    }))
  }, [isFinalized, itemsData])

  const isLoading = characterLoading || rowsLoading || itemsLoading

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-40 w-full rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error || rowsError || itemsError || !character || !characterSlug) {
    return (
      <div className="min-h-screen p-8">
        <div className="rounded-lg bg-destructive/10 border border-destructive/50 p-4 text-destructive">
          {tc('characterSheet.errors.loadingCharacter', { error: String(error ?? rowsError ?? itemsError) })}
        </div>
      </div>
    )
  }

  return (
    <CharacterProvider
      key={character.id}
      initialCharacter={character}
      initialRows={buildRows}
      initialEquippedItems={equippedItems}
      initialPersistedItems={isFinalized ? persistedItems : undefined}
      useDBInventory={isFinalized}
    >
      <CharacterSheetInner
        character={character}
        itemsData={itemsData}
        characterId={character.id}
      />
    </CharacterProvider>
  )
}

// --- Edit Dialogs ---

function EditHeaderDialog({
  character,
  onSave,
  onClose,
  saving,
}: {
  character: Character
  onSave: (updates: Partial<Character>) => void
  onClose: () => void
  saving: boolean
}) {
  const { t: tc } = useTranslation('common')
  const [form, setForm] = useState({
    name: character.name,
    player_name: character.player_name ?? '',
    character_type: character.character_type,
    gender: (character.gender ?? '') as DndGender | '',
  })

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tc('characterSheet.dialogs.editCharacterInfo')}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="char-name">{tc('characterSheet.fields.name')}</Label>
            <Input
              id="char-name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="char-player">{tc('characterSheet.fields.player')}</Label>
            <Input
              id="char-player"
              value={form.player_name}
              onChange={(e) => update('player_name', e.target.value)}
              placeholder={tc('characterSheet.hints.leaveEmptyForNpcs')}
            />
          </div>
          <div className="space-y-2">
            <Label>{tc('characterSheet.fields.type')}</Label>
            <Select value={form.character_type} onValueChange={(val) => update('character_type', val as 'pc' | 'npc')}>
              <SelectTrigger className="w-full">
                <SelectValue>{tc(`characterType.${form.character_type}`)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pc">{tc('characterType.pc')}</SelectItem>
                <SelectItem value="npc">{tc('characterType.npc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{tc('characterSheet.fields.gender')}</Label>
            <GenderToggle
              value={form.gender}
              onChange={(g) => update('gender', g)}
            />
          </div>
        </div>
        <ModalFooter
          onSave={() =>
            onSave({
              ...form,
              player_name: form.player_name || null,
              gender: form.gender === 'male' || form.gender === 'female' ? form.gender : null,
            })
          }
          onCancel={onClose}
          saving={saving}
        />
      </DialogContent>
    </Dialog>
  )
}

function EditPersonalityDialog({
  personality_traits,
  ideals,
  bonds,
  flaws,
  onSave,
  onClose,
  saving,
}: {
  personality_traits: string
  ideals: string
  bonds: string
  flaws: string
  onSave: (updates: { personality_traits: string; ideals: string; bonds: string; flaws: string }) => void
  onClose: () => void
  saving: boolean
}) {
  const { t: tc } = useTranslation('common')
  const [form, setForm] = useState({ personality_traits, ideals, bonds, flaws })

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{tc('characterSheet.dialogs.editPersonality')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="personality-traits">{tc('characterSheet.fields.personalityTraits')}</Label>
            <Textarea
              id="personality-traits"
              value={form.personality_traits}
              onChange={(e) => setForm((prev) => ({ ...prev, personality_traits: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personality-ideals">{tc('characterSheet.personality.ideals')}</Label>
            <Textarea
              id="personality-ideals"
              value={form.ideals}
              onChange={(e) => setForm((prev) => ({ ...prev, ideals: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personality-bonds">{tc('characterSheet.personality.bonds')}</Label>
            <Textarea
              id="personality-bonds"
              value={form.bonds}
              onChange={(e) => setForm((prev) => ({ ...prev, bonds: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personality-flaws">{tc('characterSheet.personality.flaws')}</Label>
            <Textarea
              id="personality-flaws"
              value={form.flaws}
              onChange={(e) => setForm((prev) => ({ ...prev, flaws: e.target.value }))}
              rows={2}
            />
          </div>
        </div>
        <ModalFooter onSave={() => onSave(form)} onCancel={onClose} saving={saving} />
      </DialogContent>
    </Dialog>
  )
}

function EditTextDialog({
  title,
  field,
  value,
  onSave,
  onClose,
  saving,
}: {
  title: string
  field: string
  value: string
  onSave: (updates: Record<string, string>) => void
  onClose: () => void
  saving: boolean
}) {
  const [text, setText] = useState(value)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          autoFocus
        />
        <ModalFooter onSave={() => onSave({ [field]: text })} onCancel={onClose} saving={saving} />
      </DialogContent>
    </Dialog>
  )
}
