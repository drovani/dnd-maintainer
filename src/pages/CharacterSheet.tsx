import {
  DND_ALIGNMENTS,
  DND_BACKGROUNDS,
  DND_CLASSES,
  DND_RACE_GROUPS,
  DND_SKILLS,
  getAbilityModifier,
  getProficiencyBonus,
} from '@/lib/dnd-helpers'
import { useCharacter, useCharacterMutations } from '@/hooks/useCharacters'
import { Edit2, Minus, Plus, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Character } from '@/types/database'

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
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onEdit}
        title={`Edit ${title}`}
      >
        <Edit2 size={14} />
      </Button>
    </div>
  )
}

function ModalFooter({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSave} disabled={saving}>
        <Save size={14} />
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </DialogFooter>
  )
}

export default function CharacterSheet() {
  const { characterId } = useParams<{ id: string; characterId: string }>()
  const [editSection, setEditSection] = useState<EditSection>(null)

  const { data: character, isLoading, error } = useCharacter(characterId)
  const { update: updateMutation } = useCharacterMutations()

  const handleUpdate = (updates: Partial<Character>) => {
    if (!characterId) return
    updateMutation.mutate({ id: characterId, ...updates }, {
      onSuccess: () => setEditSection(null),
    })
  }

  const updateHP = (delta: number) => {
    if (character && characterId) {
      const newHP = Math.max(0, Math.min(character.hit_points_max ?? 0, (character.hit_points_current ?? 0) + delta))
      updateMutation.mutate({ id: characterId, hit_points_current: newHP })
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

  if (error || !character) {
    return (
      <div className="min-h-screen p-8">
        <div className="rounded-lg bg-destructive/10 border border-destructive/50 p-4 text-destructive">
          Error loading character: {String(error)}
        </div>
      </div>
    )
  }

  const alignmentName = DND_ALIGNMENTS.find((a) => a.id === character.alignment)?.name || character.alignment
  const profBonus = getProficiencyBonus(character.level)

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">CHARACTER SHEET</div>
              <h1 className="text-3xl font-bold text-foreground">{character.name}</h1>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditSection('header')}
              title="Edit Character Info"
            >
              <Edit2 size={16} />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Class</span>
              <p className="text-foreground font-semibold">
                {character.class}{character.subclass ? ` (${character.subclass})` : ''}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Level</span>
              <p className="text-foreground font-semibold">{character.level}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Race</span>
              <p className="text-foreground font-semibold">{character.race}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Background</span>
              <p className="text-foreground font-semibold">{character.background}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Alignment</span>
              <p className="text-foreground font-semibold">{alignmentName}</p>
            </div>
            {character.player_name && (
              <div>
                <span className="text-muted-foreground">Player</span>
                <p className="text-foreground font-semibold">{character.player_name}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Type</span>
              <p className="text-foreground font-semibold uppercase">{character.character_type}</p>
            </div>
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column: Abilities & Skills */}
          <div className="lg:col-span-1 space-y-6">
            {/* Ability Scores */}
            <div className="bg-card border rounded-lg p-6">
              <SectionHeader title="Abilities" onEdit={() => setEditSection('abilities')} />
              <div className="space-y-3">
                {(Object.keys(character.abilities) as Array<keyof typeof character.abilities>).map((ability) => {
                  const score = character.abilities[ability]
                  const modifier = getAbilityModifier(score)
                  return (
                    <div key={ability} className="bg-muted/50 p-3 rounded border">
                      <div className="text-xs text-muted-foreground mb-1">{ABILITY_NAMES[ability]}</div>
                      <div className="flex items-end justify-between">
                        <div className="text-sm font-bold text-foreground">{score}</div>
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

            {/* Saving Throws */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Saving Throws</h2>
              <div className="space-y-2 text-sm">
                {(Object.keys(character.abilities) as Array<keyof typeof character.abilities>).map((ability) => {
                  const modifier = getAbilityModifier(character.abilities[ability])
                  return (
                    <div key={ability} className="flex justify-between text-foreground">
                      <span>{ABILITY_NAMES[ability]}</span>
                      <span className="font-mono font-bold">
                        {modifier >= 0 ? '+' : ''}{modifier}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-card border rounded-lg p-6">
              <SectionHeader title="Skills" onEdit={() => setEditSection('skills')} />
              <div className="space-y-1 text-xs">
                {Object.entries(skillsByAbility).map(([ability, skills]) => (
                  <div key={ability}>
                    <div className="text-muted-foreground font-semibold mt-2 mb-1">{ability}</div>
                    {skills.map((skill) => {
                      const skillData = character.skills?.[skill.id] ?? { proficient: false, expertise: false }
                      const abilityMod = getAbilityModifier(
                        character.abilities[skill.ability.toLowerCase() as keyof typeof character.abilities]
                      )
                      let bonus = abilityMod
                      if (skillData.proficient) bonus += profBonus
                      if (skillData.expertise) bonus += profBonus

                      return (
                        <div key={skill.id} className="flex justify-between text-foreground py-1">
                          <span className={skillData.proficient ? 'font-bold' : ''}>
                            {skill.name}
                          </span>
                          <span
                            className={`font-mono ${skillData.expertise ? 'text-green-600 font-bold' : 'text-muted-foreground'}`}
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
            <div className="bg-card border-2 border-destructive/30 rounded-lg p-6">
              <SectionHeader title="Combat" onEdit={() => setEditSection('combat')} />

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/50 p-4 rounded border text-center">
                  <div className="text-xs text-muted-foreground mb-2">ARMOR CLASS</div>
                  <div className="text-4xl font-bold text-foreground">{character.armor_class}</div>
                </div>

                <div className="bg-muted/50 p-4 rounded border text-center">
                  <div className="text-xs text-muted-foreground mb-2">INITIATIVE</div>
                  <div className="text-4xl font-bold text-foreground">
                    {getAbilityModifier(character.abilities.dex) >= 0 ? '+' : ''}
                    {getAbilityModifier(character.abilities.dex)}
                  </div>
                </div>
              </div>

              {/* HP Tracker */}
              <div className="bg-muted/50 p-4 rounded border mb-4">
                <div className="text-xs text-muted-foreground mb-2">HIT POINTS</div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="icon-xs"
                      onClick={() => updateHP(-1)}
                    >
                      <Minus size={16} />
                    </Button>
                    <div className="text-2xl font-bold text-red-600 min-w-12 text-center">
                      {character.hit_points_current}
                    </div>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() => updateHP(1)}
                      className="text-green-600 border-green-600/30 hover:bg-green-50"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                  <div className="text-muted-foreground text-sm">/ {character.hit_points_max}</div>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all ${(character.hit_points_current ?? 0) > (character.hit_points_max ?? 1) * 0.5
                      ? 'bg-green-600'
                      : (character.hit_points_current ?? 0) > (character.hit_points_max ?? 1) * 0.25
                        ? 'bg-yellow-500'
                        : 'bg-red-600'
                      }`}
                    style={{
                      width: `${((character.hit_points_current ?? 0) / (character.hit_points_max ?? 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <div className="flex justify-between py-1">
                  <span>Proficiency Bonus</span>
                  <span className="font-mono font-bold text-foreground">+{profBonus}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Speed</span>
                  <span className="font-mono font-bold text-foreground">30 ft</span>
                </div>
              </div>
            </div>

            {/* Features */}
            {character.features && character.features.length > 0 && (
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Features & Traits</h2>
                <div className="space-y-3">
                  {character.features.map((feature) => (
                    <div key={feature.id} className="bg-muted/50 p-3 rounded border">
                      <div className="font-semibold text-foreground text-sm mb-1">{feature.name}</div>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                      {feature.source && <div className="text-xs text-muted-foreground/70 mt-1">Source: {feature.source}</div>}
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
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Equipment</h2>
                <div className="space-y-2 text-xs">
                  {character.equipment.map((item) => (
                    <div
                      key={item.id}
                      className={`flex justify-between items-center py-2 px-2 rounded ${item.equipped ? 'bg-green-50 border border-green-200' : 'bg-muted/50'
                        }`}
                    >
                      <div>
                        <div className="font-semibold text-foreground">{item.name}</div>
                        <div className="text-muted-foreground">
                          Qty: {item.quantity} | Wt: {item.weight}
                        </div>
                      </div>
                      {item.equipped && <span className="text-green-600 font-bold">E</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Spells */}
            {character.spells && character.spells.cantrips.length > 0 && (
              <div className="bg-card border border-purple-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Spells</h2>
                <div className="space-y-3">
                  {character.spells.cantrips.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-muted-foreground mb-2">CANTRIPS</div>
                      <div className="space-y-1">
                        {character.spells.cantrips.map((cantrip, i) => (
                          <div key={i} className="text-sm text-foreground">
                            &bull; {cantrip}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Personality */}
            {(character.personality_traits || character.ideals || character.bonds || character.flaws) && (
              <div className="bg-card border rounded-lg p-6">
                <SectionHeader title="Personality" onEdit={() => setEditSection('personality')} />
                <div className="space-y-3 text-xs">
                  {character.personality_traits && (
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">Traits</div>
                      <p className="text-foreground">{character.personality_traits}</p>
                    </div>
                  )}
                  {character.ideals && (
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">Ideals</div>
                      <p className="text-foreground">{character.ideals}</p>
                    </div>
                  )}
                  {character.bonds && (
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">Bonds</div>
                      <p className="text-foreground">{character.bonds}</p>
                    </div>
                  )}
                  {character.flaws && (
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">Flaws</div>
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
            <SectionHeader title="Backstory" onEdit={() => setEditSection('backstory')} />
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{character.backstory}</p>
          </div>
        )}

        {character.appearance && (
          <div className="bg-card border rounded-lg p-6 mt-6">
            <SectionHeader title="Appearance" onEdit={() => setEditSection('appearance')} />
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
      {editSection === 'abilities' && (
        <EditAbilitiesDialog
          abilities={character.abilities}
          onSave={(abilities) => handleUpdate({ abilities })}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
      {editSection === 'skills' && (
        <EditSkillsDialog
          skills={character.skills}
          onSave={(skills) => handleUpdate({ skills })}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
      {editSection === 'combat' && (
        <EditCombatDialog
          armorClass={character.armor_class ?? 10}
          hpMax={character.hit_points_max ?? 1}
          hpCurrent={character.hit_points_current ?? 1}
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
          title="Edit Backstory"
          field="backstory"
          value={character.backstory ?? ''}
          onSave={handleUpdate}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
      {editSection === 'appearance' && (
        <EditTextDialog
          title="Edit Appearance"
          field="appearance"
          value={character.appearance ?? ''}
          onSave={handleUpdate}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
    </div>
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
  const [form, setForm] = useState({
    name: character.name,
    player_name: character.player_name ?? '',
    character_type: character.character_type,
    race: character.race ?? '',
    class: character.class ?? '',
    subclass: character.subclass ?? '',
    level: character.level,
    background: character.background ?? '',
    alignment: character.alignment ?? '',
  })

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Character Info</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="char-name">Name</Label>
            <Input
              id="char-name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="char-player">Player Name</Label>
            <Input
              id="char-player"
              value={form.player_name}
              onChange={(e) => update('player_name', e.target.value)}
              placeholder="Leave empty for NPCs"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.character_type} onValueChange={(val) => update('character_type', val as 'pc' | 'npc')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pc">PC</SelectItem>
                <SelectItem value="npc">NPC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={form.class} onValueChange={(val) => val && update('class', val)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DND_CLASSES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="char-subclass">Subclass</Label>
            <Input
              id="char-subclass"
              value={form.subclass}
              onChange={(e) => update('subclass', e.target.value)}
              placeholder="e.g. Champion, Arcane Trickster"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="char-level">Level</Label>
            <Input
              id="char-level"
              type="number"
              min={1}
              max={20}
              value={form.level}
              onChange={(e) => update('level', Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Race</Label>
            <Select value={form.race} onValueChange={(val) => val && update('race', val)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DND_RACE_GROUPS.map((group) => (
                  <SelectGroup key={group.label}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.options.map((opt) => (
                      <SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Background</Label>
            <Select value={form.background} onValueChange={(val) => val && update('background', val)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DND_BACKGROUNDS.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Alignment</Label>
            <Select value={form.alignment} onValueChange={(val) => val && update('alignment', val)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DND_ALIGNMENTS.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
      </DialogContent>
    </Dialog>
  )
}

function EditAbilitiesDialog({
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

  const updateAbility = (key: keyof typeof form, value: number) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Ability Scores</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {(Object.keys(ABILITY_NAMES) as Array<keyof typeof abilities>).map((ability) => (
            <div key={ability} className="flex items-center gap-4">
              <Label className="w-28">{ABILITY_NAMES[ability]}</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={form[ability]}
                onChange={(e) => updateAbility(ability, Number(e.target.value))}
                className="w-20 text-center"
              />
              <span className={`text-sm font-mono font-bold w-8 text-center ${getAbilityModifier(form[ability]) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {getAbilityModifier(form[ability]) >= 0 ? '+' : ''}{getAbilityModifier(form[ability])}
              </span>
            </div>
          ))}
        </div>
        <ModalFooter onSave={() => onSave(form)} onCancel={onClose} saving={saving} />
      </DialogContent>
    </Dialog>
  )
}

function EditSkillsDialog({
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
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Skills</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground mb-4">
          Click <span className="font-bold text-foreground">P</span> for proficiency, <span className="font-bold text-green-600">E</span> for expertise.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 max-h-96 overflow-y-auto">
          {DND_SKILLS.map((skill) => {
            const data = form[skill.id]
            return (
              <div key={skill.id} className="flex items-center justify-between py-1.5 border-b">
                <span className="text-sm text-foreground">{skill.name}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => toggle(skill.id, 'proficient')}
                    className={`size-7 rounded text-xs font-bold transition-colors ${
                      data.proficient
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    P
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(skill.id, 'expertise')}
                    className={`size-7 rounded text-xs font-bold transition-colors ${
                      data.expertise
                        ? 'bg-green-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    E
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <ModalFooter onSave={() => onSave(form)} onCancel={onClose} saving={saving} />
      </DialogContent>
    </Dialog>
  )
}

function EditCombatDialog({
  armorClass,
  hpMax,
  hpCurrent,
  onSave,
  onClose,
  saving,
}: {
  armorClass: number
  hpMax: number
  hpCurrent: number
  onSave: (updates: { armor_class: number; hit_points_max: number; hit_points_current: number }) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({ armor_class: armorClass, hit_points_max: hpMax, hit_points_current: hpCurrent })

  useEffect(() => {
    if (form.hit_points_current > form.hit_points_max) {
      setForm((prev) => ({ ...prev, hit_points_current: prev.hit_points_max }))
    }
  }, [form.hit_points_max])

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Combat Stats</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="combat-ac">Armor Class</Label>
            <Input
              id="combat-ac"
              type="number"
              min={0}
              value={form.armor_class}
              onChange={(e) => setForm((prev) => ({ ...prev, armor_class: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="combat-hp-max">Max HP</Label>
            <Input
              id="combat-hp-max"
              type="number"
              min={1}
              value={form.hit_points_max}
              onChange={(e) => setForm((prev) => ({ ...prev, hit_points_max: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="combat-hp-current">Current HP</Label>
            <Input
              id="combat-hp-current"
              type="number"
              min={0}
              max={form.hit_points_max}
              value={form.hit_points_current}
              onChange={(e) => setForm((prev) => ({ ...prev, hit_points_current: Number(e.target.value) }))}
            />
          </div>
        </div>
        <ModalFooter onSave={() => onSave(form)} onCancel={onClose} saving={saving} />
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
  const [form, setForm] = useState({ personality_traits, ideals, bonds, flaws })

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Personality</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="personality-traits">Personality Traits</Label>
            <Textarea
              id="personality-traits"
              value={form.personality_traits}
              onChange={(e) => setForm((prev) => ({ ...prev, personality_traits: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personality-ideals">Ideals</Label>
            <Textarea
              id="personality-ideals"
              value={form.ideals}
              onChange={(e) => setForm((prev) => ({ ...prev, ideals: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personality-bonds">Bonds</Label>
            <Textarea
              id="personality-bonds"
              value={form.bonds}
              onChange={(e) => setForm((prev) => ({ ...prev, bonds: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personality-flaws">Flaws</Label>
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
