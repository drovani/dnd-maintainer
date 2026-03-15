import {
  DND_ALIGNMENTS,
  DND_BACKGROUNDS,
  DND_CLASSES,
  DND_RACE_GROUPS,
  DND_SKILLS,
  getAbilityModifier,
  getProficiencyBonus,
} from '@/lib/dnd-helpers'
import { supabase } from '@/lib/supabase'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit2, Minus, Plus, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'

interface Character {
  id: string
  campaign_id: string
  name: string
  player_name: string | null
  character_type: 'pc' | 'npc'
  race: string
  class: string
  subclass: string
  level: number
  background: string
  alignment: string
  hp_max: number
  hp_current: number
  ac: number
  abilities: {
    str: number
    dex: number
    con: number
    int: number
    wis: number
    cha: number
  }
  skills: Record<string, { proficient: boolean; expertise: boolean }>
  features: Array<{ id: string; name: string; description: string; source: string; uses: number }>
  equipment: Array<{ id: string; name: string; quantity: number; weight: number; equipped: boolean }>
  spells: {
    cantrips: string[]
    spellsByLevel: Record<number, string[]>
    spellSlots: Record<number, number>
  }
  personalityTraits: string
  ideals: string
  bonds: string
  flaws: string
  appearance: string
  backstory: string
  updated_at: string
}

const ABILITY_NAMES: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

type EditSection = 'header' | 'abilities' | 'skills' | 'combat' | 'personality' | 'backstory' | 'appearance' | null

function SectionHeader({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-amber-400">{title}</h2>
      <button
        onClick={onEdit}
        className="p-1.5 hover:bg-slate-700 rounded transition-colors"
        title={`Edit ${title}`}
      >
        <Edit2 size={14} className="text-amber-400" />
      </button>
    </div>
  )
}

function ModalFooter({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end gap-3">
      <button
        onClick={onCancel}
        className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        <Save size={14} />
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}

export default function CharacterSheet() {
  const { characterId } = useParams<{ id: string; characterId: string }>()
  const queryClient = useQueryClient()
  const [editSection, setEditSection] = useState<EditSection>(null)

  const { data: character, isLoading, error } = useQuery({
    queryKey: ['character', characterId],
    queryFn: async () => {
      if (!characterId) return null
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single()

      if (error) throw error
      return data as Character
    },
    enabled: !!characterId,
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Character>) => {
      const { error } = await supabase
        .from('characters')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', characterId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character', characterId] })
      setEditSection(null)
    },
  })

  const updateHP = (delta: number) => {
    if (character) {
      const newHP = Math.max(0, Math.min(character.hp_max, character.hp_current + delta))
      updateMutation.mutate({ hp_current: newHP } as Partial<Character>)
    }
  }

  const skillsByAbility = useMemo(() => {
    return DND_SKILLS.reduce(
      (acc, skill) => {
        if (!acc[skill.ability]) acc[skill.ability] = []
        acc[skill.ability].push(skill)
        return acc
      },
      {} as Record<string, typeof DND_SKILLS>
    )
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <p className="text-slate-400">Loading character sheet...</p>
      </div>
    )
  }

  if (error || !character) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="rounded-lg bg-red-900/20 border border-red-500/50 p-4 text-red-200">
          Error loading character: {String(error)}
        </div>
      </div>
    )
  }

  const alignmentName = DND_ALIGNMENTS.find((a) => a.id === character.alignment)?.name || character.alignment
  const profBonus = getProficiencyBonus(character.level)

  return (
    <div className="min-h-screen bg-linear-to-b from-amber-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="bg-slate-800 border border-amber-700/50 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-slate-400 mb-1">CHARACTER SHEET</div>
              <h1 className="text-3xl font-bold text-amber-300">{character.name}</h1>
            </div>
            <button
              onClick={() => setEditSection('header')}
              className="p-2 hover:bg-slate-700 rounded transition-colors"
              title="Edit Character Info"
            >
              <Edit2 size={16} className="text-amber-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Class</span>
              <p className="text-amber-300 font-semibold">
                {character.class}{character.subclass ? ` (${character.subclass})` : ''}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Level</span>
              <p className="text-amber-300 font-semibold">{character.level}</p>
            </div>
            <div>
              <span className="text-slate-400">Race</span>
              <p className="text-amber-300 font-semibold">{character.race}</p>
            </div>
            <div>
              <span className="text-slate-400">Background</span>
              <p className="text-amber-300 font-semibold">{character.background}</p>
            </div>
            <div>
              <span className="text-slate-400">Alignment</span>
              <p className="text-amber-300 font-semibold">{alignmentName}</p>
            </div>
            {character.player_name && (
              <div>
                <span className="text-slate-400">Player</span>
                <p className="text-amber-300 font-semibold">{character.player_name}</p>
              </div>
            )}
            <div>
              <span className="text-slate-400">Type</span>
              <p className="text-amber-300 font-semibold uppercase">{character.character_type}</p>
            </div>
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column: Abilities & Skills */}
          <div className="lg:col-span-1 space-y-6">
            {/* Ability Scores */}
            <div className="bg-slate-800 border border-amber-700/30 rounded-lg p-6">
              <SectionHeader title="Abilities" onEdit={() => setEditSection('abilities')} />
              <div className="space-y-3">
                {(Object.keys(character.abilities) as Array<keyof typeof character.abilities>).map((ability) => {
                  const score = character.abilities[ability]
                  const modifier = getAbilityModifier(score)
                  return (
                    <div key={ability} className="bg-slate-900/50 p-3 rounded border border-slate-700/50">
                      <div className="text-xs text-slate-400 mb-1">{ABILITY_NAMES[ability]}</div>
                      <div className="flex items-end justify-between">
                        <div className="text-sm font-bold text-amber-300">{score}</div>
                        <div
                          className={`text-lg font-bold ${modifier >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {modifier >= 0 ? '+' : ''}{modifier}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Saving Throws */}
            <div className="bg-slate-800 border border-amber-700/30 rounded-lg p-6">
              <h2 className="text-lg font-bold text-amber-400 mb-4">Saving Throws</h2>
              <div className="space-y-2 text-sm">
                {(Object.keys(character.abilities) as Array<keyof typeof character.abilities>).map((ability) => {
                  const modifier = getAbilityModifier(character.abilities[ability])
                  return (
                    <div key={ability} className="flex justify-between text-slate-300">
                      <span>{ABILITY_NAMES[ability]}</span>
                      <span className="font-mono font-bold text-amber-300">
                        {modifier >= 0 ? '+' : ''}{modifier}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-slate-800 border border-amber-700/30 rounded-lg p-6">
              <SectionHeader title="Skills" onEdit={() => setEditSection('skills')} />
              <div className="space-y-1 text-xs">
                {Object.entries(skillsByAbility).map(([ability, skills]) => (
                  <div key={ability}>
                    <div className="text-slate-500 font-semibold mt-2 mb-1">{ability}</div>
                    {skills.map((skill) => {
                      const skillData = character.skills?.[skill.id] ?? { proficient: false, expertise: false }
                      const abilityMod = getAbilityModifier(
                        character.abilities[skill.ability.toLowerCase() as keyof typeof character.abilities]
                      )
                      let bonus = abilityMod
                      if (skillData.proficient) bonus += profBonus
                      if (skillData.expertise) bonus += profBonus

                      return (
                        <div key={skill.id} className="flex justify-between text-slate-300 py-1">
                          <span className={skillData.proficient ? 'font-bold text-amber-300' : ''}>
                            {skill.name}
                          </span>
                          <span
                            className={`font-mono ${skillData.expertise ? 'text-green-400 font-bold' : 'text-slate-400'}`}
                          >
                            {bonus >= 0 ? '+' : ''}{bonus}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column: Combat & Features */}
          <div className="lg:col-span-1 space-y-6">
            {/* Combat Stats */}
            <div className="bg-slate-800 border-2 border-red-700/50 rounded-lg p-6">
              <SectionHeader title="Combat" onEdit={() => setEditSection('combat')} />

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-900 p-4 rounded border border-red-700/30 text-center">
                  <div className="text-xs text-slate-400 mb-2">ARMOR CLASS</div>
                  <div className="text-4xl font-bold text-cyan-400">{character.ac}</div>
                </div>

                <div className="bg-slate-900 p-4 rounded border border-red-700/30 text-center">
                  <div className="text-xs text-slate-400 mb-2">INITIATIVE</div>
                  <div className="text-4xl font-bold text-cyan-400">
                    {getAbilityModifier(character.abilities.dex) >= 0 ? '+' : ''}
                    {getAbilityModifier(character.abilities.dex)}
                  </div>
                </div>
              </div>

              {/* HP Tracker */}
              <div className="bg-slate-900 p-4 rounded border border-red-700/30 mb-4">
                <div className="text-xs text-slate-400 mb-2">HIT POINTS</div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateHP(-1)}
                      className="p-1 bg-red-900 hover:bg-red-800 text-white rounded"
                    >
                      <Minus size={16} />
                    </button>
                    <div className="text-2xl font-bold text-red-400 min-w-12 text-center">
                      {character.hp_current}
                    </div>
                    <button
                      onClick={() => updateHP(1)}
                      className="p-1 bg-green-900 hover:bg-green-800 text-white rounded"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="text-slate-400 text-sm">/ {character.hp_max}</div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all ${character.hp_current > character.hp_max * 0.5
                      ? 'bg-green-600'
                      : character.hp_current > character.hp_max * 0.25
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                      }`}
                    style={{
                      width: `${(character.hp_current / character.hp_max) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="text-xs text-slate-400">
                <div className="flex justify-between py-1">
                  <span>Proficiency Bonus</span>
                  <span className="font-mono text-amber-300">+{profBonus}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Speed</span>
                  <span className="font-mono text-amber-300">30 ft</span>
                </div>
              </div>
            </div>

            {/* Features */}
            {character.features && character.features.length > 0 && (
              <div className="bg-slate-800 border border-amber-700/30 rounded-lg p-6">
                <h2 className="text-lg font-bold text-amber-400 mb-4">Features & Traits</h2>
                <div className="space-y-3">
                  {character.features.map((feature) => (
                    <div key={feature.id} className="bg-slate-900/50 p-3 rounded border border-slate-700/50">
                      <div className="font-semibold text-amber-300 text-sm mb-1">{feature.name}</div>
                      <p className="text-xs text-slate-300">{feature.description}</p>
                      {feature.source && <div className="text-xs text-slate-500 mt-1">Source: {feature.source}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Equipment & Spells */}
          <div className="lg:col-span-1 space-y-6">
            {/* Equipment */}
            {character.equipment && character.equipment.length > 0 && (
              <div className="bg-slate-800 border border-amber-700/30 rounded-lg p-6">
                <h2 className="text-lg font-bold text-amber-400 mb-4">Equipment</h2>
                <div className="space-y-2 text-xs">
                  {character.equipment.map((item) => (
                    <div
                      key={item.id}
                      className={`flex justify-between items-center py-2 px-2 rounded ${item.equipped ? 'bg-green-900/20 border border-green-700/30' : 'bg-slate-900/50'
                        }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{item.name}</div>
                        <div className="text-slate-500">
                          Qty: {item.quantity} | Wt: {item.weight}
                        </div>
                      </div>
                      {item.equipped && <span className="text-green-400 font-bold">E</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Spells */}
            {character.spells && character.spells.cantrips.length > 0 && (
              <div className="bg-slate-800 border border-purple-700/30 rounded-lg p-6">
                <h2 className="text-lg font-bold text-amber-400 mb-4">Spells</h2>
                <div className="space-y-3">
                  {character.spells.cantrips.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-slate-400 mb-2">CANTRIPS</div>
                      <div className="space-y-1">
                        {character.spells.cantrips.map((cantrip, i) => (
                          <div key={i} className="text-sm text-slate-300">
                            • {cantrip}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Personality */}
            {(character.personalityTraits || character.ideals || character.bonds || character.flaws) && (
              <div className="bg-slate-800 border border-amber-700/30 rounded-lg p-6">
                <SectionHeader title="Personality" onEdit={() => setEditSection('personality')} />
                <div className="space-y-3 text-xs">
                  {character.personalityTraits && (
                    <div>
                      <div className="font-semibold text-slate-400 mb-1">Traits</div>
                      <p className="text-slate-300">{character.personalityTraits}</p>
                    </div>
                  )}
                  {character.ideals && (
                    <div>
                      <div className="font-semibold text-slate-400 mb-1">Ideals</div>
                      <p className="text-slate-300">{character.ideals}</p>
                    </div>
                  )}
                  {character.bonds && (
                    <div>
                      <div className="font-semibold text-slate-400 mb-1">Bonds</div>
                      <p className="text-slate-300">{character.bonds}</p>
                    </div>
                  )}
                  {character.flaws && (
                    <div>
                      <div className="font-semibold text-slate-400 mb-1">Flaws</div>
                      <p className="text-slate-300">{character.flaws}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full Width Backstory */}
        {character.backstory && (
          <div className="bg-slate-800 border border-amber-700/30 rounded-lg p-6">
            <SectionHeader title="Backstory" onEdit={() => setEditSection('backstory')} />
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{character.backstory}</p>
          </div>
        )}

        {character.appearance && (
          <div className="bg-slate-800 border border-amber-700/30 rounded-lg p-6 mt-6">
            <SectionHeader title="Appearance" onEdit={() => setEditSection('appearance')} />
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{character.appearance}</p>
          </div>
        )}
      </div>

      {/* Edit Modals */}
      {editSection === 'header' && (
        <EditHeaderModal
          character={character}
          onSave={(updates) => updateMutation.mutate(updates as Partial<Character>)}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
      {editSection === 'abilities' && (
        <EditAbilitiesModal
          abilities={character.abilities}
          onSave={(abilities) => updateMutation.mutate({ abilities } as Partial<Character>)}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
      {editSection === 'skills' && (
        <EditSkillsModal
          skills={character.skills}
          onSave={(skills) => updateMutation.mutate({ skills } as Partial<Character>)}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
      {editSection === 'combat' && (
        <EditCombatModal
          ac={character.ac}
          hpMax={character.hp_max}
          hpCurrent={character.hp_current}
          onSave={(updates) => updateMutation.mutate(updates as Partial<Character>)}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
      {editSection === 'personality' && (
        <EditPersonalityModal
          personalityTraits={character.personalityTraits}
          ideals={character.ideals}
          bonds={character.bonds}
          flaws={character.flaws}
          onSave={(updates) => updateMutation.mutate(updates as Partial<Character>)}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
      {editSection === 'backstory' && (
        <EditTextModal
          title="Edit Backstory"
          field="backstory"
          value={character.backstory}
          onSave={(updates) => updateMutation.mutate(updates as Partial<Character>)}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
      {editSection === 'appearance' && (
        <EditTextModal
          title="Edit Appearance"
          field="appearance"
          value={character.appearance}
          onSave={(updates) => updateMutation.mutate(updates as Partial<Character>)}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
    </div>
  )
}

// --- Edit Modals ---

function EditHeaderModal({
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
  const [form, setForm] = useState({
    name: character.name,
    player_name: character.player_name ?? '',
    character_type: character.character_type,
    race: character.race,
    class: character.class,
    subclass: character.subclass,
    level: character.level,
    background: character.background,
    alignment: character.alignment,
  })

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit Character Info"
      size="lg"
      footer={
        <ModalFooter
          onSave={() =>
            onSave({
              ...form,
              player_name: form.player_name || null,
              level: Number(form.level),
            })
          }
          onCancel={onClose}
          saving={saving}
        />
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          autoFocus
        />
        <Input
          label="Player Name"
          value={form.player_name}
          onChange={(e) => update('player_name', e.target.value)}
          placeholder="Leave empty for NPCs"
        />
        <Select
          label="Type"
          value={form.character_type}
          onChange={(e) => update('character_type', e.target.value as 'pc' | 'npc')}
          options={[
            { value: 'pc', label: 'PC' },
            { value: 'npc', label: 'NPC' },
          ]}
        />
        <Select
          label="Class"
          value={form.class}
          onChange={(e) => update('class', e.target.value)}
          options={DND_CLASSES.map((c) => ({ value: c.name, label: c.name }))}
        />
        <Input
          label="Subclass"
          value={form.subclass}
          onChange={(e) => update('subclass', e.target.value)}
          placeholder="e.g. Champion, Arcane Trickster"
        />
        <Input
          label="Level"
          type="number"
          min={1}
          max={20}
          value={form.level}
          onChange={(e) => update('level', Number(e.target.value))}
        />
        <Select
          label="Race"
          value={form.race}
          onChange={(e) => update('race', e.target.value)}
          optgroups={DND_RACE_GROUPS}
        />
        <Select
          label="Background"
          value={form.background}
          onChange={(e) => update('background', e.target.value)}
          options={DND_BACKGROUNDS.map((b) => ({ value: b.name, label: b.name }))}
        />
        <Select
          label="Alignment"
          value={form.alignment}
          onChange={(e) => update('alignment', e.target.value)}
          options={DND_ALIGNMENTS.map((a) => ({ value: a.id, label: a.name }))}
        />
      </div>
    </Modal>
  )
}

function EditAbilitiesModal({
  abilities,
  onSave,
  onClose,
  saving,
}: {
  abilities: Character['abilities']
  onSave: (abilities: Character['abilities']) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({ ...abilities })

  const update = (key: keyof typeof form, value: number) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit Ability Scores"
      size="sm"
      footer={<ModalFooter onSave={() => onSave(form)} onCancel={onClose} saving={saving} />}
    >
      <div className="space-y-4">
        {(Object.keys(ABILITY_NAMES) as Array<keyof typeof abilities>).map((ability) => (
          <div key={ability} className="flex items-center gap-4">
            <label className="text-sm font-medium text-amber-400 w-28">{ABILITY_NAMES[ability]}</label>
            <input
              type="number"
              min={1}
              max={30}
              value={form[ability]}
              onChange={(e) => update(ability, Number(e.target.value))}
              className="w-20 px-3 py-2 bg-slate-800 border border-amber-900/30 text-slate-100 rounded focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/30 text-center"
            />
            <span className={`text-sm font-mono font-bold w-8 text-center ${getAbilityModifier(form[ability]) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {getAbilityModifier(form[ability]) >= 0 ? '+' : ''}{getAbilityModifier(form[ability])}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function EditSkillsModal({
  skills,
  onSave,
  onClose,
  saving,
}: {
  skills: Character['skills']
  onSave: (skills: Character['skills']) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<Record<string, { proficient: boolean; expertise: boolean }>>(() => {
    const initial: Record<string, { proficient: boolean; expertise: boolean }> = {}
    for (const skill of DND_SKILLS) {
      initial[skill.id] = skills?.[skill.id] ?? { proficient: false, expertise: false }
    }
    return initial
  })

  const toggle = (skillId: string, field: 'proficient' | 'expertise') => {
    setForm((prev) => {
      const current = prev[skillId]
      if (field === 'proficient' && current.proficient) {
        return { ...prev, [skillId]: { proficient: false, expertise: false } }
      }
      if (field === 'expertise' && !current.proficient) {
        return { ...prev, [skillId]: { proficient: true, expertise: true } }
      }
      return { ...prev, [skillId]: { ...current, [field]: !current[field] } }
    })
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit Skills"
      size="md"
      footer={<ModalFooter onSave={() => onSave(form)} onCancel={onClose} saving={saving} />}
    >
      <div className="text-xs text-slate-400 mb-4">
        Click <span className="font-bold text-amber-300">P</span> for proficiency, <span className="font-bold text-green-400">E</span> for expertise.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        {DND_SKILLS.map((skill) => {
          const data = form[skill.id]
          return (
            <div key={skill.id} className="flex items-center justify-between py-1.5 border-b border-slate-700/30">
              <span className="text-sm text-slate-300">{skill.name}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => toggle(skill.id, 'proficient')}
                  className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                    data.proficient
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  P
                </button>
                <button
                  type="button"
                  onClick={() => toggle(skill.id, 'expertise')}
                  className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                    data.expertise
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  E
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

function EditCombatModal({
  ac,
  hpMax,
  hpCurrent,
  onSave,
  onClose,
  saving,
}: {
  ac: number
  hpMax: number
  hpCurrent: number
  onSave: (updates: { ac: number; hp_max: number; hp_current: number }) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({ ac, hp_max: hpMax, hp_current: hpCurrent })

  useEffect(() => {
    if (form.hp_current > form.hp_max) {
      setForm((prev) => ({ ...prev, hp_current: prev.hp_max }))
    }
  }, [form.hp_max, form.hp_current])

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit Combat Stats"
      size="sm"
      footer={<ModalFooter onSave={() => onSave(form)} onCancel={onClose} saving={saving} />}
    >
      <div className="space-y-4">
        <Input
          label="Armor Class"
          type="number"
          min={0}
          value={form.ac}
          onChange={(e) => setForm((prev) => ({ ...prev, ac: Number(e.target.value) }))}
        />
        <Input
          label="Max HP"
          type="number"
          min={1}
          value={form.hp_max}
          onChange={(e) => setForm((prev) => ({ ...prev, hp_max: Number(e.target.value) }))}
        />
        <Input
          label="Current HP"
          type="number"
          min={0}
          max={form.hp_max}
          value={form.hp_current}
          onChange={(e) => setForm((prev) => ({ ...prev, hp_current: Number(e.target.value) }))}
        />
      </div>
    </Modal>
  )
}

function EditPersonalityModal({
  personalityTraits,
  ideals,
  bonds,
  flaws,
  onSave,
  onClose,
  saving,
}: {
  personalityTraits: string
  ideals: string
  bonds: string
  flaws: string
  onSave: (updates: { personalityTraits: string; ideals: string; bonds: string; flaws: string }) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({ personalityTraits, ideals, bonds, flaws })

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit Personality"
      size="md"
      footer={<ModalFooter onSave={() => onSave(form)} onCancel={onClose} saving={saving} />}
    >
      <div className="space-y-4">
        <Textarea
          label="Personality Traits"
          value={form.personalityTraits}
          onChange={(e) => setForm((prev) => ({ ...prev, personalityTraits: e.target.value }))}
          rows={3}
        />
        <Textarea
          label="Ideals"
          value={form.ideals}
          onChange={(e) => setForm((prev) => ({ ...prev, ideals: e.target.value }))}
          rows={2}
        />
        <Textarea
          label="Bonds"
          value={form.bonds}
          onChange={(e) => setForm((prev) => ({ ...prev, bonds: e.target.value }))}
          rows={2}
        />
        <Textarea
          label="Flaws"
          value={form.flaws}
          onChange={(e) => setForm((prev) => ({ ...prev, flaws: e.target.value }))}
          rows={2}
        />
      </div>
    </Modal>
  )
}

function EditTextModal({
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
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      size="lg"
      footer={<ModalFooter onSave={() => onSave({ [field]: text })} onCancel={onClose} saving={saving} />}
    >
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        autoFocus
      />
    </Modal>
  )
}
