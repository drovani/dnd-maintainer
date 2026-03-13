import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, User, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

interface Character {
  id: string
  campaign_id: string
  name: string
  player_name: string | null
  character_type: 'pc' | 'npc'
  race: string
  class: string
  level: number
  hp_max: number
  ac: number
  updated_at: string
}

type FilterType = 'all' | 'pc' | 'npc'
type SortType = 'name' | 'level' | 'class' | 'updated'

export default function CharacterList() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('name')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: characters = [], isLoading, error } = useQuery({
    queryKey: ['characters', campaignId],
    queryFn: async () => {
      if (!campaignId) return []
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data as Character[]
    },
    enabled: !!campaignId,
  })

  const filteredAndSortedCharacters = useMemo(() => {
    let result = characters

    // Filter by type
    if (filterType === 'pc') {
      result = result.filter((c) => c.character_type === 'pc')
    } else if (filterType === 'npc') {
      result = result.filter((c) => c.character_type === 'npc')
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.player_name?.toLowerCase().includes(query) ||
          c.race.toLowerCase().includes(query) ||
          c.class.toLowerCase().includes(query)
      )
    }

    // Sort
    const sorted = [...result]
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'level':
        sorted.sort((a, b) => b.level - a.level)
        break
      case 'class':
        sorted.sort((a, b) => a.class.localeCompare(b.class))
        break
      case 'updated':
        // Already sorted by updated_at from query
        break
    }

    return sorted
  }, [characters, filterType, searchQuery, sortBy])

  const pcCount = characters.filter((c) => c.character_type === 'pc').length
  const npcCount = characters.filter((c) => c.character_type === 'npc').length

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-900/20 border border-red-500/50 p-4 text-red-200">
          Error loading characters: {String(error)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-amber-400 mb-2">Characters</h1>
            <p className="text-slate-400">
              {characters.length} total •{' '}
              <span className="text-blue-400">{pcCount} PCs</span> •{' '}
              <span className="text-purple-400">{npcCount} NPCs</span>
            </p>
          </div>
          <button
            onClick={() => navigate(`/campaign/${campaignId}/character/new`)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            Add Character
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by name, player, race, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${filterType === 'all'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
            >
              All Characters
            </button>
            <button
              onClick={() => setFilterType('pc')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${filterType === 'pc'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
            >
              <User size={16} />
              Player Characters
            </button>
            <button
              onClick={() => setFilterType('npc')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${filterType === 'npc'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
            >
              <Users size={16} />
              <span className="uppercase">npc</span>s
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-amber-500"
          >
            <option value="name">Sort by Name</option>
            <option value="level">Sort by Level (High to Low)</option>
            <option value="class">Sort by Class</option>
            <option value="updated">Sort by Recently Updated</option>
          </select>
        </div>

        {/* Characters Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading characters...</p>
          </div>
        ) : filteredAndSortedCharacters.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 mb-4">No characters found</p>
            <button
              onClick={() => navigate(`/campaign/${campaignId}/character/new`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
              Create First Character
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCharacters.map((character) => (
              <div
                key={character.id}
                onClick={() =>
                  navigate(
                    `/campaign/${campaignId}/character/${character.id}`
                  )
                }
                className={`p-6 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${character.character_type === 'pc'
                  ? 'bg-slate-800 border-blue-500/50 hover:border-blue-400'
                  : 'bg-slate-800/50 border-purple-500/30 hover:border-purple-400'
                  }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-amber-300 mb-1">
                      {character.name}
                    </h3>
                    {character.player_name && (
                      <p className="text-sm text-slate-400">
                        Player: {character.player_name}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${character.character_type === 'pc'
                      ? 'bg-blue-900 text-blue-200'
                      : 'bg-purple-900 text-purple-200'
                      }`}
                  >
                    {character.character_type}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Race</span>
                    <span className="text-slate-200">{character.race}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Class</span>
                    <span className="text-slate-200">{character.class}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Level</span>
                    <span className="text-amber-300 font-semibold">
                      {character.level}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">HP</span>
                    <span className="text-red-400 font-semibold">
                      {character.hp_max}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">AC</span>
                    <span className="text-cyan-400 font-semibold">
                      {character.ac}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
