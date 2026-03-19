import { DND_RACE_NAMES, type DndGender } from '@/lib/dnd-helpers'
import { supabase } from '@/lib/supabase'
import { Character, Combatant } from '@/types/database'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Dice6,
  Eye,
  Flame,
  Heart,
  Plus,
  Save,
  Shield,
  Swords,
  Target,
  Trash2,
  Users,
  Wand2,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

type TabType = 'initiative' | 'generators' | 'reference'

interface InitiativeTrackerCombatant extends Combatant {
  currentHp: number
  conditions: string[]
}

interface InitiativeState {
  round: number
  currentTurn: number
  combatants: InitiativeTrackerCombatant[]
}

export default function DmToolkit() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<TabType>('initiative')

  // Initiative Tracker State
  const [initiativeState, setInitiativeState] = useState<InitiativeState>({
    round: 1,
    currentTurn: 0,
    combatants: [],
  })

  const [newCombatantName, setNewCombatantName] = useState('')
  const [newCombatantInit, setNewCombatantInit] = useState('')
  const [newCombatantHp, setNewCombatantHp] = useState('')
  const [newCombatantAc, setNewCombatantAc] = useState('')
  const [newCombatantIsPlayer, setNewCombatantIsPlayer] = useState(false)

  // Generator State
  const [generatorTab, setGeneratorTab] = useState<
    'name' | 'loot' | 'tavern' | 'encounter'
  >('name')
  const [generatedName, setGeneratedName] = useState('')
  const [selectedRace, setSelectedRace] = useState<string>('human')
  const [selectedGender, setSelectedGender] = useState<DndGender>('male')
  const [generatedLoot, setGeneratedLoot] = useState<
    { gold: number; silver: number; copper: number; items: string[] }
  >({ gold: 0, silver: 0, copper: 0, items: [] })
  const [selectedCR, setSelectedCR] = useState('1-4')
  const [generatedTavern, setGeneratedTavern] = useState<{
    name: string
    description: string
    barkeeper: string
    special: string
    rumor: string
  } | null>(null)
  const [generatedEncounter, setGeneratedEncounter] = useState<
    { name: string; cr: number; count: number }[]
  >([])
  const [partyLevel, setPartyLevel] = useState('5')
  const [partySize, setPartySize] = useState('4')
  const [encounterDifficulty, setEncounterDifficulty] = useState<
    'easy' | 'medium' | 'hard' | 'deadly'
  >('medium')

  // Reference State
  const [expandedCondition, setExpandedCondition] = useState<string | null>(null)

  // Fetch campaign characters
  const { data: characters = [] } = useQuery({
    queryKey: ['campaign-characters', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('campaign_id', id!)
        .eq('is_npc', false)
      if (error) throw error
      return data as unknown as Character[]
    },
    enabled: !!id,
  })

  // Save encounter mutation
  const saveEncounterMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Campaign ID required')

      const encounter = {
        campaign_id: id!,
        name: `Round ${initiativeState.round} Encounter`,
        combatants: initiativeState.combatants.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          initiative: c.initiative,
          hit_points: c.currentHp,
          armor_class: c.armor_class,
          status:
            c.currentHp <= 0
              ? 'dead'
              : c.currentHp < c.hit_points / 2
                ? 'injured'
                : 'healthy',
          conditions: c.conditions,
        })),
        round: initiativeState.round,
        status: 'active',
      }

      const { data, error } = await supabase
        .from('encounters')
        .insert(encounter as never)
        .select()
        .single()

      if (error) throw error
      return data
    },
  })

  // Generator Functions
  const lootTables = {
    '1-4': {
      gold: [10, 25, 50, 75, 100],
      silver: [20, 50, 100, 150, 200],
      items: [
        'Potion of Healing',
        'Scroll of Magic Missile',
        'Small Shield',
        'Rope (50ft)',
        'Lantern',
      ],
    },
    '5-10': {
      gold: [100, 250, 500, 750, 1000],
      silver: [100, 250, 500, 750, 1000],
      items: [
        'Potion of Healing',
        'Scroll of Cure Wounds',
        '+1 Weapon',
        'Wand of Magic Missiles',
        'Cloak of Protection',
      ],
    },
    '11-16': {
      gold: [500, 1000, 2500, 5000, 7500],
      silver: [500, 1000, 2500, 5000, 7500],
      items: [
        'Potion of Greater Healing',
        '+2 Weapon',
        'Robe of the Archmagi',
        'Wand of Fireballs',
        'Ring of Protection',
      ],
    },
    '17+': {
      gold: [5000, 10000, 25000, 50000, 100000],
      silver: [5000, 10000, 25000, 50000, 100000],
      items: [
        'Potion of Supreme Healing',
        '+3 Weapon',
        'Staff of Power',
        'Deck of Many Things',
        'Artifact',
      ],
    },
  }

  const tavernNames = {
    adjectives: [
      'Prancing',
      'Dancing',
      'Silver',
      'Golden',
      'Rusty',
      'Broken',
      'Weary',
    ],
    nouns: [
      'Pony',
      'Griffin',
      'Dragon',
      'Sword',
      'Shield',
      'Flagon',
      'Bottle',
    ],
  }

  const tavernDescriptions = [
    'A cozy tavern with a roaring fireplace and local patrons',
    'A bustling tavern filled with merchants and adventurers',
    'A dimly-lit tavern with suspicious corners and dark secrets',
    'A rowdy tavern known for brawls and good spirits',
    'An upscale tavern catering to nobles and wealthy merchants',
  ]

  const tavernBarkeepers = [
    'Moira Ironbrew',
    'Thorg Stonefist',
    'Elara Brightwood',
    'Caldus Blackthorne',
    'Rosie Thistlebottom',
  ]

  const tavernSpecials = [
    'Spiced mead and hearty stew',
    'Roasted pheasant with mushroom sauce',
    'Fresh bread and aged cheese selection',
    'Smoked fish and pickled vegetables',
    'Thick ale and warm meat pie',
  ]

  const tavernRumors = [
    'A strange figure was seen heading toward the old ruins',
    'Bandits have been spotted on the eastern road',
    'The local lord seeks capable adventurers for a secret task',
    'A merchant caravan went missing last week',
    'Magic has been acting strangely in these lands',
  ]

  const monstersList = [
    { name: 'Goblin', cr: 0.125 },
    { name: 'Orc', cr: 0.5 },
    { name: 'Bandit', cr: 0.125 },
    { name: 'Cultist', cr: 0.125 },
    { name: 'Zombie', cr: 0.25 },
    { name: 'Skeleton', cr: 0.25 },
    { name: 'Troll', cr: 5 },
    { name: 'Wyvern', cr: 6 },
    { name: 'Dragon Wyrmling', cr: 2 },
    { name: 'Chimera', cr: 6 },
    { name: 'Hill Giant', cr: 5 },
    { name: 'Black Pudding', cr: 4 },
    { name: 'Beholder', cr: 13 },
    { name: 'Demon Lord', cr: 20 },
    { name: 'Ancient Red Dragon', cr: 24 },
  ]

  // Helper functions
  const getRandomIndex = (arr: unknown[]) =>
    Math.floor(Math.random() * arr.length)

  const generateFantasyName = () => {
    const raceData = DND_RACE_NAMES[selectedRace]
    if (!raceData) return
    const firstNames = [...raceData[selectedGender]]
    const first = firstNames[getRandomIndex(firstNames)]
    const clan = [...raceData.clan]
    const last = clan[getRandomIndex(clan)]
    setGeneratedName(`${first} ${last}`)
  }

  const generateLoot = () => {
    const crTable =
      lootTables[selectedCR as keyof typeof lootTables]
    const gold = crTable.gold[getRandomIndex(crTable.gold)]
    const silver = crTable.silver[getRandomIndex(crTable.silver)]
    const copper = Math.floor(Math.random() * 100)

    const itemCount = Math.random() > 0.5 ? 1 : Math.random() > 0.5 ? 2 : 0
    const items: string[] = []
    for (let i = 0; i < itemCount; i++) {
      items.push(
        crTable.items[getRandomIndex(crTable.items)]
      )
    }

    setGeneratedLoot({ gold, silver, copper, items })
  }

  const generateTavern = () => {
    const adjective = tavernNames.adjectives[getRandomIndex(tavernNames.adjectives)]
    const noun = tavernNames.nouns[getRandomIndex(tavernNames.nouns)]
    const name = `The ${adjective} ${noun}`
    const description =
      tavernDescriptions[getRandomIndex(tavernDescriptions)]
    const barkeeper =
      tavernBarkeepers[getRandomIndex(tavernBarkeepers)]
    const special = tavernSpecials[getRandomIndex(tavernSpecials)]
    const rumor = tavernRumors[getRandomIndex(tavernRumors)]

    setGeneratedTavern({ name, description, barkeeper, special, rumor })
  }

  const generateEncounter = () => {
    const encounter: { name: string; cr: number; count: number }[] = []
    const totalCR = parseInt(partyLevel) * parseInt(partySize)
    let currentCR = 0

    while (currentCR < totalCR && encounter.length < 10) {
      const monster = monstersList[getRandomIndex(monstersList)]
      const count = Math.max(1, Math.floor(Math.random() * 4))
      const monsterCR = monster.cr * count

      if (currentCR + monsterCR <= totalCR * 1.5) {
        encounter.push({
          name: monster.name,
          cr: monster.cr,
          count,
        })
        currentCR += monsterCR
      }
    }

    setGeneratedEncounter(encounter)
  }

  // Initiative Tracker Functions
  const sortedCombatants = useMemo(
    () =>
      [...initiativeState.combatants].sort(
        (a, b) => b.initiative - a.initiative
      ),
    [initiativeState.combatants]
  )

  const addCombatant = () => {
    if (!newCombatantName || !newCombatantInit || !newCombatantHp || !newCombatantAc)
      return

    const combatant: InitiativeTrackerCombatant = {
      id: Math.random().toString(),
      name: newCombatantName,
      type: newCombatantIsPlayer ? 'character' : 'enemy',
      initiative: parseInt(newCombatantInit),
      hit_points: parseInt(newCombatantHp),
      armor_class: parseInt(newCombatantAc),
      currentHp: parseInt(newCombatantHp),
      status: 'healthy',
      conditions: [],
    }

    setInitiativeState({
      ...initiativeState,
      combatants: [...initiativeState.combatants, combatant],
    })

    setNewCombatantName('')
    setNewCombatantInit('')
    setNewCombatantHp('')
    setNewCombatantAc('')
    setNewCombatantIsPlayer(false)
  }

  const addQuickCharacter = (char: Character) => {
    const combatant: InitiativeTrackerCombatant = {
      id: char.id,
      name: char.name,
      type: 'character',
      initiative: 0,
      hit_points: char.hit_points_max ?? 10,
      armor_class: char.armor_class ?? 10,
      currentHp: char.hit_points_max ?? 10,
      status: 'healthy',
      conditions: [],
    }

    setInitiativeState({
      ...initiativeState,
      combatants: [...initiativeState.combatants, combatant],
    })
  }

  const removeCombatant = (id: string) => {
    const newCombatants = initiativeState.combatants.filter((c) => c.id !== id)
    setInitiativeState({
      ...initiativeState,
      combatants: newCombatants,
      currentTurn: Math.min(
        initiativeState.currentTurn,
        newCombatants.length - 1
      ),
    })
  }

  const updateCombatantHp = (id: string, amount: number) => {
    setInitiativeState({
      ...initiativeState,
      combatants: initiativeState.combatants.map((c) =>
        c.id === id
          ? {
            ...c,
            currentHp: Math.max(0, c.currentHp + amount),
            status:
              c.currentHp + amount <= 0
                ? 'unconscious'
                : c.currentHp + amount < c.hit_points / 2
                  ? 'injured'
                  : 'healthy',
          }
          : c
      ),
    })
  }

  const toggleCondition = (id: string, condition: string) => {
    setInitiativeState({
      ...initiativeState,
      combatants: initiativeState.combatants.map((c) =>
        c.id === id
          ? {
            ...c,
            conditions: c.conditions.includes(condition)
              ? c.conditions.filter((cond) => cond !== condition)
              : [...c.conditions, condition],
          }
          : c
      ),
    })
  }

  const nextTurn = () => {
    if (sortedCombatants.length === 0) return
    const next = (initiativeState.currentTurn + 1) % sortedCombatants.length
    setInitiativeState({
      ...initiativeState,
      currentTurn: next,
      round: next === 0 ? initiativeState.round + 1 : initiativeState.round,
    })
  }

  const prevTurn = () => {
    if (sortedCombatants.length === 0) return
    const prev =
      initiativeState.currentTurn === 0
        ? sortedCombatants.length - 1
        : initiativeState.currentTurn - 1
    setInitiativeState({
      ...initiativeState,
      currentTurn: prev,
      round:
        prev === sortedCombatants.length - 1
          ? Math.max(1, initiativeState.round - 1)
          : initiativeState.round,
    })
  }

  // Reference Data
  const conditions = [
    {
      name: 'Blinded',
      effects: 'Cannot see. Automatic miss on attacks. Attacks against you have advantage.',
    },
    {
      name: 'Charmed',
      effects: 'Cannot attack the charmer. Charmer has advantage on social checks against you.',
    },
    {
      name: 'Deafened',
      effects: 'Cannot hear. Automatic fail on any check requiring hearing.',
    },
    {
      name: 'Frightened',
      effects: 'Disadvantage on attack rolls and ability checks. Cannot move closer to source.',
    },
    {
      name: 'Grappled',
      effects: 'Speed becomes 0. Cannot benefit from bonuses to speed. Ends if grappler is incapacitated.',
    },
    {
      name: 'Incapacitated',
      effects: 'Cannot take actions or reactions.',
    },
    {
      name: 'Invisible',
      effects: 'Cannot be seen. Attacks against you have disadvantage. Your attacks have advantage.',
    },
    {
      name: 'Paralyzed',
      effects: 'Cannot move or speak. Automatic fail on STR and DEX saves. Attacks have advantage.',
    },
    {
      name: 'Petrified',
      effects: 'Turned to stone along with nonmagical objects. Cannot move or speak.',
    },
    {
      name: 'Poisoned',
      effects: 'Disadvantage on attack rolls and ability checks.',
    },
    {
      name: 'Prone',
      effects: 'Melee attack rolls against you have advantage. Ranged attacks have disadvantage.',
    },
    {
      name: 'Restrained',
      effects: 'Speed becomes 0. Disadvantage on attack rolls. Attacks against you have advantage.',
    },
    {
      name: 'Stunned',
      effects: 'Cannot move or speak. Automatic fail on STR and DEX saves. Attacks have advantage.',
    },
    {
      name: 'Unconscious',
      effects: 'Cannot move or wake unless someone uses action. Attacks have advantage.',
    },
  ]

  const actionsInCombat = [
    {
      name: 'Attack',
      description: 'Make one melee or ranged attack',
    },
    {
      name: 'Cast a Spell',
      description: 'Cast a spell with a casting time of 1 action',
    },
    {
      name: 'Dash',
      description: 'Double your speed for this turn',
    },
    {
      name: 'Disengage',
      description: 'Opportunity attacks against you have disadvantage',
    },
    {
      name: 'Dodge',
      description: 'Attack rolls have disadvantage. You make DEX saves with advantage',
    },
    {
      name: 'Help',
      description: 'Give another creature advantage on next ability check within 1 minute',
    },
    {
      name: 'Hide',
      description: 'Make a Stealth check. Must be out of sight of enemies',
    },
    {
      name: 'Ready',
      description: 'Choose a trigger and response for your reaction',
    },
    {
      name: 'Search',
      description: 'Spend 1 minute searching a 5-foot cube area',
    },
    {
      name: 'Use an Object',
      description: 'Interact with a second object during your turn',
    },
  ]

  const coverRules = [
    { type: 'Half Cover', ac: '+2', description: 'Behind low wall, furniture, creatures' },
    { type: '3/4 Cover', ac: '+5', description: 'Behind portcullis, narrow tree trunk' },
    { type: 'Full Cover', ac: 'Immune', description: 'Complete concealment from attacker' },
  ]

  const dcTable = [
    { dc: 5, difficulty: 'Very Easy' },
    { dc: 10, difficulty: 'Easy' },
    { dc: 15, difficulty: 'Medium' },
    { dc: 20, difficulty: 'Hard' },
    { dc: 25, difficulty: 'Very Hard' },
    { dc: 30, difficulty: 'Nearly Impossible' },
  ]

  const travelPace = [
    { pace: 'Fast', miles_hour: '4 miles', miles_day: '30 miles' },
    { pace: 'Normal', miles_hour: '3 miles', miles_day: '24 miles' },
    { pace: 'Slow', miles_hour: '2 miles', miles_day: '18 miles' },
  ]

  const exhaustionLevels = [
    { level: 1, effect: 'Disadvantage on ability checks' },
    { level: 2, effect: 'Speed halved' },
    { level: 3, effect: 'Disadvantage on attack rolls and saves' },
    { level: 4, effect: 'Speed reduced to 0' },
    { level: 5, effect: 'Speed 0, max HP halved' },
    { level: 6, effect: 'Death' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/50 border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3 mb-6">
            <Swords className="size-8 text-primary" />
            DM Toolkit
          </h1>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-border">
            <button
              onClick={() => setActiveTab('initiative')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'initiative'
                  ? 'text-primary border-amber-400'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
                }`}
            >
              <div className="flex items-center gap-2">
                <Swords className="size-5" />
                Initiative Tracker
              </div>
            </button>
            <button
              onClick={() => setActiveTab('generators')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'generators'
                  ? 'text-primary border-amber-400'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
                }`}
            >
              <div className="flex items-center gap-2">
                <Dice6 className="size-5" />
                Generators
              </div>
            </button>
            <button
              onClick={() => setActiveTab('reference')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'reference'
                  ? 'text-primary border-amber-400'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
                }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="size-5" />
                Quick Reference
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Initiative Tracker */}
        {activeTab === 'initiative' && (
          <div className="space-y-8">
            {/* Add Combatant Form */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Plus className="size-6 text-primary" />
                Add Combatant
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Name"
                  value={newCombatantName}
                  onChange={(e) => setNewCombatantName(e.target.value)}
                  className="md:col-span-2 bg-muted border border-border rounded px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring"
                />
                <input
                  type="number"
                  placeholder="Initiative"
                  value={newCombatantInit}
                  onChange={(e) => setNewCombatantInit(e.target.value)}
                  className="bg-muted border border-border rounded px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring"
                />
                <input
                  type="number"
                  placeholder="HP"
                  value={newCombatantHp}
                  onChange={(e) => setNewCombatantHp(e.target.value)}
                  className="bg-muted border border-border rounded px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring"
                />
                <input
                  type="number"
                  placeholder="AC"
                  value={newCombatantAc}
                  onChange={(e) => setNewCombatantAc(e.target.value)}
                  className="bg-muted border border-border rounded px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring"
                />
                <label className="flex items-center gap-2 bg-muted border border-border rounded px-4 py-2 cursor-pointer hover:border-ring/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={newCombatantIsPlayer}
                    onChange={(e) => setNewCombatantIsPlayer(e.target.checked)}
                    className="size-4"
                  />
                  <span className="text-foreground">Player</span>
                </label>
              </div>

              <button
                onClick={addCombatant}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="size-5" />
                Add Combatant
              </button>
            </div>

            {/* Quick Add from Campaign Characters */}
            {characters.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Users className="size-5 text-primary" />
                  Quick Add Party Members
                </h3>
                <div className="flex flex-wrap gap-3">
                  {characters.map((char) => (
                    <button
                      key={char.id}
                      onClick={() => addQuickCharacter(char)}
                      className="bg-muted hover:bg-muted border border-border hover:border-ring/50 rounded-lg px-4 py-2 text-foreground hover:text-primary transition-colors text-sm font-semibold"
                    >
                      {char.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Combat Controls and Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {/* Round and Turn Info */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-muted-foreground text-sm mb-2">Round</p>
                      <p className="text-4xl font-bold text-primary">
                        {initiativeState.round}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-muted-foreground text-sm mb-2">Current Turn</p>
                      <p className="text-2xl font-bold text-primary">
                        {sortedCombatants.length > 0
                          ? sortedCombatants[initiativeState.currentTurn]?.name
                          : 'None'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={prevTurn}
                      className="flex-1 bg-muted hover:bg-muted border border-border rounded-lg py-2 px-4 text-foreground hover:text-primary font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronUp className="size-5" />
                      Previous Turn
                    </button>
                    <button
                      onClick={nextTurn}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronDown className="size-5" />
                      Next Turn
                    </button>
                  </div>
                </div>

                {/* Combatants List */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Initiative Order ({sortedCombatants.length})
                  </h3>

                  {sortedCombatants.length === 0 ? (
                    <p className="text-muted-foreground italic">No combatants added yet</p>
                  ) : (
                    <div className="space-y-3">
                      {sortedCombatants.map((combatant, idx) => (
                        <div
                          key={combatant.id}
                          className={`rounded-lg p-4 border transition-all ${idx === initiativeState.currentTurn
                              ? 'bg-primary/20 border-amber-400'
                              : 'bg-muted/50 border-border'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="text-center w-12">
                                <p className="text-primary font-bold text-lg">
                                  {combatant.initiative}
                                </p>
                              </div>
                              <div className="flex-1">
                                <p className="text-foreground font-semibold">
                                  {combatant.name}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                  AC {combatant.armor_class}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeCombatant(combatant.id)}
                              className="text-destructive hover:text-destructive p-2 transition-colors"
                            >
                              <Trash2 className="size-5" />
                            </button>
                          </div>

                          {/* HP Bar and Controls */}
                          <div className="space-y-3 mb-3">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-muted-foreground text-sm">HP</span>
                                <span className="text-foreground font-bold">
                                  {combatant.currentHp} / {combatant.hit_points}
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-3">
                                <div
                                  className={`h-3 rounded-full transition-all ${combatant.currentHp <= 0
                                      ? 'bg-red-600'
                                      : combatant.currentHp <
                                        combatant.hit_points / 2
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                    }`}
                                  style={{
                                    width: `${(Math.max(0, combatant.currentHp) /
                                        combatant.hit_points) *
                                      100
                                      }%`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* HP Controls */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateCombatantHp(combatant.id, 5)}
                                className="flex-1 bg-green-100 hover:bg-green-200 border border-green-300 rounded px-3 py-1 text-green-600 text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                              >
                                <Heart className="size-4" />
                                +5
                              </button>
                              <button
                                onClick={() => updateCombatantHp(combatant.id, -5)}
                                className="flex-1 bg-red-100 hover:bg-red-200 border border-red-300 rounded px-3 py-1 text-destructive text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                              >
                                <Flame className="size-4" />
                                -5
                              </button>
                              <button
                                onClick={() =>
                                  updateCombatantHp(
                                    combatant.id,
                                    -combatant.currentHp
                                  )
                                }
                                className="flex-1 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700/40 rounded px-3 py-1 text-purple-400 text-sm font-semibold transition-colors"
                              >
                                KO
                              </button>
                            </div>
                          </div>

                          {/* Conditions */}
                          <div className="space-y-2">
                            <p className="text-muted-foreground text-sm">Conditions</p>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  toggleCondition(
                                    combatant.id,
                                    e.target.value
                                  )
                                  e.target.value = ''
                                }
                              }}
                              className="w-full bg-muted border border-input rounded px-3 py-1 text-foreground text-sm outline-none focus-visible:border-ring"
                            >
                              <option value="">Add condition...</option>
                              <option value="Blinded">Blinded</option>
                              <option value="Charmed">Charmed</option>
                              <option value="Deafened">Deafened</option>
                              <option value="Frightened">Frightened</option>
                              <option value="Grappled">Grappled</option>
                              <option value="Incapacitated">
                                Incapacitated
                              </option>
                              <option value="Invisible">Invisible</option>
                              <option value="Paralyzed">Paralyzed</option>
                              <option value="Petrified">Petrified</option>
                              <option value="Poisoned">Poisoned</option>
                              <option value="Prone">Prone</option>
                              <option value="Restrained">Restrained</option>
                              <option value="Stunned">Stunned</option>
                              <option value="Unconscious">Unconscious</option>
                            </select>

                            {combatant.conditions.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {combatant.conditions.map((cond) => (
                                  <button
                                    key={cond}
                                    onClick={() =>
                                      toggleCondition(combatant.id, cond)
                                    }
                                    className="bg-purple-900/50 hover:bg-purple-900/70 border border-purple-600/50 rounded px-3 py-1 text-purple-300 text-xs font-semibold transition-colors"
                                  >
                                    {cond} ×
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Save Encounter */}
              <div className="bg-card border border-border rounded-lg p-6 h-fit sticky top-24">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Save className="size-5 text-primary" />
                  Save Encounter
                </h3>

                <button
                  onClick={() => saveEncounterMutation.mutate()}
                  disabled={
                    sortedCombatants.length === 0 ||
                    saveEncounterMutation.isPending
                  }
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold py-2 px-4 rounded-lg transition-colors mb-4"
                >
                  {saveEncounterMutation.isPending
                    ? 'Saving...'
                    : 'Save to Campaign'}
                </button>

                {saveEncounterMutation.isSuccess && (
                  <p className="text-green-600 text-sm text-center">
                    Encounter saved!
                  </p>
                )}

                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-muted-foreground text-xs mb-4">
                    Quick stats: {sortedCombatants.length} combatants
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generators */}
        {activeTab === 'generators' && (
          <div className="space-y-8">
            {/* Generator Tabs */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex gap-4 mb-8 border-b border-border pb-4">
                <button
                  onClick={() => setGeneratorTab('name')}
                  className={`px-4 py-2 font-semibold transition-colors ${generatorTab === 'name'
                      ? 'text-primary border-b-2 border-amber-400'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Name Generator
                </button>
                <button
                  onClick={() => setGeneratorTab('loot')}
                  className={`px-4 py-2 font-semibold transition-colors ${generatorTab === 'loot'
                      ? 'text-primary border-b-2 border-amber-400'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Loot Generator
                </button>
                <button
                  onClick={() => setGeneratorTab('tavern')}
                  className={`px-4 py-2 font-semibold transition-colors ${generatorTab === 'tavern'
                      ? 'text-primary border-b-2 border-amber-400'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Tavern Generator
                </button>
                <button
                  onClick={() => setGeneratorTab('encounter')}
                  className={`px-4 py-2 font-semibold transition-colors ${generatorTab === 'encounter'
                      ? 'text-primary border-b-2 border-amber-400'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Encounter Generator
                </button>
              </div>

              {/* Name Generator */}
              {generatorTab === 'name' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-foreground font-semibold mb-3">
                        Race
                      </label>
                      <select
                        value={selectedRace}
                        onChange={(e) => setSelectedRace(e.target.value)}
                        className="w-full bg-muted border border-border rounded px-4 py-2 text-foreground outline-none focus-visible:border-ring"
                      >
                        {Object.keys(DND_RACE_NAMES).map((raceId) => (
                          <option key={raceId} value={raceId}>
                            {raceId.charAt(0).toUpperCase() + raceId.slice(1).replace(/-/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-foreground font-semibold mb-3">
                        Gender
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedGender('male')}
                          className={`flex-1 py-2 px-4 rounded border font-semibold transition-colors ${
                            selectedGender === 'male'
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted text-foreground border-border hover:border-ring/50'
                          }`}
                        >
                          Male
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedGender('female')}
                          className={`flex-1 py-2 px-4 rounded border font-semibold transition-colors ${
                            selectedGender === 'female'
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted text-foreground border-border hover:border-ring/50'
                          }`}
                        >
                          Female
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={generateFantasyName}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Wand2 className="size-5" />
                    Generate Name
                  </button>

                  {generatedName && (
                    <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
                      <p className="text-muted-foreground text-sm mb-2">Generated Name</p>
                      <p className="text-3xl font-bold text-primary">
                        {generatedName}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Loot Generator */}
              {generatorTab === 'loot' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-foreground font-semibold mb-3">
                      Encounter CR Range
                    </label>
                    <select
                      value={selectedCR}
                      onChange={(e) => setSelectedCR(e.target.value)}
                      className="w-full bg-muted border border-border rounded px-4 py-2 text-foreground outline-none focus-visible:border-ring"
                    >
                      <option value="1-4">CR 1-4</option>
                      <option value="5-10">CR 5-10</option>
                      <option value="11-16">CR 11-16</option>
                      <option value="17+">CR 17+</option>
                    </select>
                  </div>

                  <button
                    onClick={generateLoot}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Dice6 className="size-5" />
                    Generate Loot
                  </button>

                  {generatedLoot.gold > 0 && (
                    <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card rounded-lg p-4 text-center">
                          <p className="text-yellow-600 text-sm mb-2">Gold</p>
                          <p className="text-2xl font-bold text-yellow-400">
                            {generatedLoot.gold}
                          </p>
                        </div>
                        <div className="bg-card rounded-lg p-4 text-center">
                          <p className="text-gray-400 text-sm mb-2">Silver</p>
                          <p className="text-2xl font-bold text-gray-300">
                            {generatedLoot.silver}
                          </p>
                        </div>
                        <div className="bg-card rounded-lg p-4 text-center">
                          <p className="text-orange-700 text-sm mb-2">Copper</p>
                          <p className="text-2xl font-bold text-orange-400">
                            {generatedLoot.copper}
                          </p>
                        </div>
                      </div>

                      {generatedLoot.items.length > 0 && (
                        <div className="pt-4 border-t border-border">
                          <p className="text-muted-foreground text-sm mb-3">Items</p>
                          <ul className="space-y-2">
                            {generatedLoot.items.map((item, idx) => (
                              <li
                                key={idx}
                                className="flex items-center gap-2 text-foreground"
                              >
                                <Zap className="size-4 text-primary" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tavern Generator */}
              {generatorTab === 'tavern' && (
                <div className="space-y-6">
                  <button
                    onClick={generateTavern}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Wand2 className="size-5" />
                    Generate Tavern
                  </button>

                  {generatedTavern && (
                    <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-4">
                      <div>
                        <p className="text-primary text-sm mb-1">Tavern Name</p>
                        <p className="text-2xl font-bold text-foreground">
                          {generatedTavern.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-primary text-sm mb-2">Description</p>
                        <p className="text-foreground">
                          {generatedTavern.description}
                        </p>
                      </div>

                      <div>
                        <p className="text-primary text-sm mb-1">Barkeeper</p>
                        <p className="text-foreground font-semibold">
                          {generatedTavern.barkeeper}
                        </p>
                      </div>

                      <div>
                        <p className="text-primary text-sm mb-1">Special</p>
                        <p className="text-foreground">
                          {generatedTavern.special}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <p className="text-primary text-sm mb-2">Rumor</p>
                        <p className="text-foreground italic">
                          "{generatedTavern.rumor}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Encounter Generator */}
              {generatorTab === 'encounter' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-foreground font-semibold mb-2 text-sm">
                        Party Level
                      </label>
                      <input
                        type="number"
                        value={partyLevel}
                        onChange={(e) => setPartyLevel(e.target.value)}
                        min="1"
                        max="20"
                        className="w-full bg-muted border border-border rounded px-4 py-2 text-foreground outline-none focus-visible:border-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-foreground font-semibold mb-2 text-sm">
                        Party Size
                      </label>
                      <input
                        type="number"
                        value={partySize}
                        onChange={(e) => setPartySize(e.target.value)}
                        min="1"
                        max="10"
                        className="w-full bg-muted border border-border rounded px-4 py-2 text-foreground outline-none focus-visible:border-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-foreground font-semibold mb-2 text-sm">
                        Difficulty
                      </label>
                      <select
                        value={encounterDifficulty}
                        onChange={(e) =>
                          setEncounterDifficulty(
                            e.target.value as
                            | 'easy'
                            | 'medium'
                            | 'hard'
                            | 'deadly'
                          )
                        }
                        className="w-full bg-muted border border-border rounded px-4 py-2 text-foreground outline-none focus-visible:border-ring"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="deadly">Deadly</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={generateEncounter}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Swords className="size-5" />
                    Generate Encounter
                  </button>

                  {generatedEncounter.length > 0 && (
                    <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-4">
                      <div>
                        <p className="text-primary text-sm mb-4">Suggested Monsters</p>
                        <div className="space-y-3">
                          {generatedEncounter.map((monster, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-card rounded-lg p-3"
                            >
                              <div>
                                <p className="text-foreground font-semibold">
                                  {monster.name}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                  CR {monster.cr}
                                </p>
                              </div>
                              <div className="bg-primary/20 rounded-lg px-3 py-1">
                                <p className="text-primary font-bold">
                                  ×{monster.count}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Reference */}
        {activeTab === 'reference' && (
          <div className="space-y-8">
            {/* Conditions */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <AlertCircle className="size-6 text-primary" />
                Conditions
              </h2>

              <div className="space-y-3">
                {conditions.map((condition) => (
                  <button
                    key={condition.name}
                    onClick={() =>
                      setExpandedCondition(
                        expandedCondition === condition.name
                          ? null
                          : condition.name
                      )
                    }
                    className="w-full text-left bg-muted/50 hover:bg-muted border border-border hover:border-ring/30 rounded-lg p-4 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-foreground font-semibold">
                        {condition.name}
                      </h3>
                      <ChevronDown
                        className={`size-5 text-primary transition-transform ${expandedCondition === condition.name
                            ? 'rotate-180'
                            : ''
                          }`}
                      />
                    </div>
                    {expandedCondition === condition.name && (
                      <p className="text-muted-foreground text-sm mt-3">
                        {condition.effects}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions in Combat */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Swords className="size-6 text-primary" />
                Actions in Combat
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actionsInCombat.map((action) => (
                  <div
                    key={action.name}
                    className="bg-muted/50 border border-border rounded-lg p-4"
                  >
                    <h3 className="text-foreground font-semibold mb-2">
                      {action.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {action.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cover Rules */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Shield className="size-6 text-primary" />
                Cover Rules
              </h2>

              <div className="space-y-4">
                {coverRules.map((rule) => (
                  <div
                    key={rule.type}
                    className="bg-muted/50 border border-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center"
                  >
                    <div>
                      <p className="text-foreground font-semibold">
                        {rule.type}
                      </p>
                      <p className="text-muted-foreground text-sm mt-1">
                        {rule.description}
                      </p>
                    </div>
                    <div className="md:col-span-2 text-right">
                      <p className="text-primary text-lg font-bold">
                        AC {rule.ac}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty Classes */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Target className="size-6 text-primary" />
                Difficulty Classes
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-foreground font-semibold">
                        DC
                      </th>
                      <th className="px-4 py-3 text-foreground font-semibold">
                        Difficulty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dcTable.map((row) => (
                      <tr
                        key={row.dc}
                        className="border-b border-border hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 text-primary font-bold">
                          {row.dc}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {row.difficulty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Travel Pace */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Eye className="size-6 text-primary" />
                Travel Pace
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-foreground font-semibold">
                        Pace
                      </th>
                      <th className="px-4 py-3 text-foreground font-semibold">
                        Per Hour
                      </th>
                      <th className="px-4 py-3 text-foreground font-semibold">
                        Per Day
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {travelPace.map((row) => (
                      <tr
                        key={row.pace}
                        className="border-b border-border hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 text-foreground font-semibold">
                          {row.pace}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {row.miles_hour}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {row.miles_day}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Exhaustion */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Zap className="size-6 text-primary" />
                Exhaustion Levels
              </h2>

              <div className="space-y-3">
                {exhaustionLevels.map((level) => (
                  <div
                    key={level.level}
                    className="bg-muted/50 border border-border rounded-lg p-4 flex items-center gap-4"
                  >
                    <div className="bg-primary/20 rounded-lg px-4 py-2 min-w-fit">
                      <p className="text-primary font-bold text-lg">
                        Level {level.level}
                      </p>
                    </div>
                    <p className="text-foreground">{level.effect}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
