import {
  DND_ALIGNMENTS,
  DND_SKILLS,
  getAbilityModifier,
  getProficiencyBonus,
} from '@/lib/dnd-helpers'
import { supabase } from '@/lib/supabase'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit2, Minus, Plus, Save, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

interface Character {
  id: string
  campaign_id: string
  name: string
  player_name: string | null
  character_type: 'PC' | 'NPC'
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

export default function CharacterSheet() {
  const { characterId } = useParams<{ id: string; characterId: string }>()
  const queryClient = useQueryClient()
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<unknown>(null)

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
      setEditingField(null)
    },
  })

  const startEdit = (field: string, value: unknown) => {
    setEditingField(field)
    setEditValue(value)
  }

  const saveEdit = (field: keyof Omit<Character, 'id' | 'campaign_id' | 'updated_at'>) => {
    if (editValue !== null && character) {
      updateMutation.mutate({ [field]: editValue } as Partial<Character>)
    }
  }

  const cancelEdit = () => {
    setEditingField(null)
    setEditValue(null)
  }

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
              {editingField === 'name' ? (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={editValue as string}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="px-3 py-2 bg-slate-700 border border-amber-500 rounded text-white text-2xl font-bold focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => saveEdit('name')}
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    <Save size={16} />
                  </button>
                  <button onClick={cancelEdit} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-3xl font-bold text-amber-300">{character.name}</h1>
                  <button
                    onClick={() => startEdit('name', character.name)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded transition-opacity"
                  >
                    <Edit2 size={18} className="text-amber-400" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Class</span>
              <p className="text-amber-300 font-semibold">{character.class}</p>
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
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column: Abilities & Skills */}
          <div className="lg:col-span-1 space-y-6">
            {/* Ability Scores */}
            <div className="bg-slate-800 border border-amber-700/30 rounded-lg p-6">
              <h2 className="text-lg font-bold text-amber-400 mb-4">Abilities</h2>
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
              <h2 className="text-lg font-bold text-amber-400 mb-4">Skills</h2>
              <div className="space-y-1 text-xs">
                {Object.entries(skillsByAbility).map(([ability, skills]) => (
                  <div key={ability}>
                    <div className="text-slate-500 font-semibold mt-2 mb-1">{ability}</div>
                    {skills.map((skill) => {
                      const skillData = character.skills[skill.id]
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
              <h2 className="text-lg font-bold text-amber-400 mb-4">Combat</h2>

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
            {character.personalityTraits && (
              <div className="bg-slate-800 border border-amber-700/30 rounded-lg p-6">
                <h2 className="text-lg font-bold text-amber-400 mb-4">Personality</h2>
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
            <h2 className="text-lg font-bold text-amber-400 mb-4">Backstory</h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{character.backstory}</p>
          </div>
        )}

        {character.appearance && (
          <div className="bg-slate-800 border border-amber-700/30 rounded-lg p-6 mt-6">
            <h2 className="text-lg font-bold text-amber-400 mb-4">Appearance</h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{character.appearance}</p>
          </div>
        )}
      </div>
    </div>
  )
}
