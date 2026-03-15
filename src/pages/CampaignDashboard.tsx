import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Campaign, Character, Session } from '@/types/database'
import {
  ArrowLeft,
  BookOpen,
  Users,
  Swords,
  Scroll,
  Zap,
  Clock,
  Edit2,
  Save,
  X,
  ChevronRight,
} from 'lucide-react'

export default function CampaignDashboard() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isEditingSetting, setIsEditingSetting] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedSetting, setEditedSetting] = useState('')

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="text-center">
          <p className="text-red-400">Campaign not found</p>
        </div>
      </div>
    )
  }

  // Fetch campaign
  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Campaign
    },
  })

  // Fetch characters for this campaign
  const { data: characters = [] } = useQuery({
    queryKey: ['campaign-characters', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Character[]
    },
  })

  // Fetch sessions for this campaign
  const { data: sessions = [] } = useQuery({
    queryKey: ['campaign-sessions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', id)
        .order('date', { ascending: false })
      if (error) throw error
      return data as Session[]
    },
  })

  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: async (updates: Partial<Campaign>) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['campaign', id], data)
      setIsEditingName(false)
      setIsEditingDescription(false)
      setIsEditingSetting(false)
    },
  })

  const handleUpdateName = () => {
    if (editedName.trim()) {
      updateCampaignMutation.mutate({ name: editedName })
    }
  }

  const handleUpdateDescription = () => {
    updateCampaignMutation.mutate({ description: editedDescription })
  }

  const handleUpdateSetting = () => {
    updateCampaignMutation.mutate({ setting: editedSetting })
  }

  const pcCount = characters.filter((c) => !c.is_npc).length
  const npcCount = characters.filter((c) => c.is_npc).length
  const lastSession = sessions[0]
  const recentCharacters = characters.slice(0, 5)

  if (campaignLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <Swords className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-stone-300 mt-4">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="text-center">
          <p className="text-red-400">Campaign not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-amber-500/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-stone-400 hover:text-amber-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Campaigns
          </button>

          {/* Campaign Title - Editable */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-3xl font-bold bg-slate-800 border border-amber-500 rounded px-3 py-1 text-stone-100 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsEditingName(false)
                      if (e.key === 'Enter') handleUpdateName()
                    }}
                  />
                  <button
                    onClick={handleUpdateName}
                    disabled={updateCampaignMutation.isPending}
                    className="text-amber-400 hover:text-amber-300 p-2"
                  >
                    <Save className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="text-stone-400 hover:text-stone-300 p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 group">
                  <h1 className="text-3xl font-bold text-stone-100">
                    {campaign.name}
                  </h1>
                  <button
                    onClick={() => {
                      setEditedName(campaign.name)
                      setIsEditingName(true)
                    }}
                    className="text-stone-500 hover:text-amber-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              )}
              {isEditingSetting ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={editedSetting}
                    onChange={(e) => setEditedSetting(e.target.value)}
                    className="text-sm bg-slate-800 border border-amber-500 rounded px-3 py-1 text-amber-400/70 focus:outline-none flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsEditingSetting(false)
                      if (e.key === 'Enter') handleUpdateSetting()
                    }}
                  />
                  <button
                    onClick={handleUpdateSetting}
                    disabled={updateCampaignMutation.isPending}
                    className="text-amber-400 hover:text-amber-300 p-1"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingSetting(false)}
                    className="text-stone-400 hover:text-stone-300 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/setting mt-2">
                  <p className="text-amber-400/70">
                    {campaign.setting || (
                      <span className="italic text-stone-500">
                        No setting specified
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => {
                      setEditedSetting(campaign.setting || '')
                      setIsEditingSetting(true)
                    }}
                    className="text-stone-500 hover:text-amber-400 transition-colors opacity-0 group-hover/setting:opacity-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-stone-200 capitalize">
                  {campaign.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="max-w-7xl mx-auto px-8 py-8 border-b border-slate-800">
        {isEditingDescription ? (
          <div className="flex flex-col gap-3">
            <label className="text-stone-300 font-semibold">Description</label>
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="bg-slate-900 border border-amber-500 rounded-lg p-4 text-stone-200 focus:outline-none min-h-24 resize-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsEditingDescription(false)
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdateDescription}
                disabled={updateCampaignMutation.isPending}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => setIsEditingDescription(false)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-stone-200 font-bold py-2 px-4 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-stone-200 font-semibold">Campaign Overview</h3>
              <button
                onClick={() => {
                  setEditedDescription(campaign.description || '')
                  setIsEditingDescription(true)
                }}
                className="text-stone-500 hover:text-amber-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-stone-400">
              {campaign.description || (
                <span className="italic text-stone-500">
                  No campaign description
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Stats */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Characters Stat */}
              <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/30 rounded-lg p-6 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-stone-300 font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" />
                    Characters
                  </h3>
                  <Link
                    to={`/campaign/${id}/characters`}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Total</span>
                    <span className="text-stone-200 font-bold text-lg">
                      {pcCount + npcCount}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{
                        width: `${
                          ((pcCount + npcCount) / Math.max(pcCount + npcCount, 1)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>{pcCount} <span className="uppercase">pc</span>s</span>
                    <span>{npcCount} <span className="uppercase">npc</span>s</span>
                  </div>
                </div>
              </div>

              {/* Sessions Stat */}
              <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/30 rounded-lg p-6 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-stone-300 font-semibold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    Sessions
                  </h3>
                  <Link
                    to={`/campaign/${id}/sessions`}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
                <p className="text-stone-200 font-bold text-lg">{sessions.length}</p>
                {lastSession && (
                  <p className="text-stone-400 text-sm mt-2">
                    Last session: {new Date(lastSession.date).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Notes Stat */}
              <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/30 rounded-lg p-6 transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-stone-300 font-semibold flex items-center gap-2">
                    <Scroll className="w-5 h-5 text-amber-400" />
                    Notes
                  </h3>
                  <Link
                    to={`/campaign/${id}/notes`}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-stone-100 flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-amber-400" />
                Recent Activity
              </h3>

              {lastSession ? (
                <div className="space-y-4">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-stone-300 font-semibold">
                      Last Session Played
                    </p>
                    <p className="text-amber-400 font-bold text-lg mt-1">
                      Session {lastSession.session_number}: {lastSession.title}
                    </p>
                    <p className="text-stone-400 text-sm mt-2">
                      {new Date(lastSession.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {lastSession.summary && (
                      <p className="text-stone-400 text-sm mt-3 line-clamp-2">
                        {lastSession.summary}
                      </p>
                    )}
                  </div>

                  <Link
                    to={`/campaign/${id}/sessions`}
                    className="block text-amber-400 hover:text-amber-300 text-sm font-semibold transition-colors"
                  >
                    View all sessions →
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-slate-700">
                  <BookOpen className="w-8 h-8 text-amber-400/50 mx-auto mb-3" />
                  <p className="text-stone-400">No sessions recorded yet</p>
                  <Link
                    to={`/campaign/${id}/sessions`}
                    className="text-amber-400 hover:text-amber-300 text-sm font-semibold mt-3 inline-block transition-colors"
                  >
                    Create first session →
                  </Link>
                </div>
              )}
            </div>

            {/* Recently Modified Characters */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-stone-100 flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-amber-400" />
                Party Members
              </h3>

              {recentCharacters.length > 0 ? (
                <div className="space-y-3">
                  {recentCharacters.map((char) => (
                    <Link
                      key={char.id}
                      to={`/campaign/${id}/character/${char.id}`}
                      className="block bg-slate-800/50 hover:bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-amber-500/30 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-stone-100 font-semibold group-hover:text-amber-400 transition-colors">
                            {char.name}
                          </p>
                          <p className="text-stone-400 text-sm">
                            {char.race} {char.class} • Level {char.level}
                          </p>
                          {char.player_name && (
                            <p className="text-amber-400/70 text-xs mt-1">
                              Played by {char.player_name}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-amber-400 transition-colors" />
                      </div>
                    </Link>
                  ))}

                  {characters.length > recentCharacters.length && (
                    <Link
                      to={`/campaign/${id}/characters`}
                      className="block text-amber-400 hover:text-amber-300 text-sm font-semibold transition-colors mt-4"
                    >
                      View all {characters.length} characters →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-slate-700">
                  <Users className="w-8 h-8 text-amber-400/50 mx-auto mb-3" />
                  <p className="text-stone-400">No characters yet</p>
                  <Link
                    to={`/campaign/${id}/character/new`}
                    className="text-amber-400 hover:text-amber-300 text-sm font-semibold mt-3 inline-block transition-colors"
                  >
                    Create a character →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 bg-slate-900 border border-amber-500/20 rounded-lg p-8">
          <h3 className="text-xl font-bold text-stone-100 mb-6">
            Campaign Toolkit
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to={`/campaign/${id}/characters`}
              className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 hover:border-amber-500/30 border border-slate-700 rounded-lg p-4 transition-all group"
            >
              <Users className="w-6 h-6 text-amber-400" />
              <div>
                <p className="text-stone-200 font-semibold group-hover:text-amber-400 transition-colors">
                  Characters
                </p>
                <p className="text-stone-500 text-xs">{pcCount + npcCount}</p>
              </div>
            </Link>

            <Link
              to={`/campaign/${id}/sessions`}
              className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 hover:border-amber-500/30 border border-slate-700 rounded-lg p-4 transition-all group"
            >
              <BookOpen className="w-6 h-6 text-amber-400" />
              <div>
                <p className="text-stone-200 font-semibold group-hover:text-amber-400 transition-colors">
                  Sessions
                </p>
                <p className="text-stone-500 text-xs">{sessions.length}</p>
              </div>
            </Link>

            <Link
              to={`/campaign/${id}/notes`}
              className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 hover:border-amber-500/30 border border-slate-700 rounded-lg p-4 transition-all group"
            >
              <Scroll className="w-6 h-6 text-amber-400" />
              <div>
                <p className="text-stone-200 font-semibold group-hover:text-amber-400 transition-colors">
                  Notes
                </p>
              </div>
            </Link>

            <Link
              to={`/campaign/${id}/toolkit`}
              className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 hover:border-amber-500/30 border border-slate-700 rounded-lg p-4 transition-all group"
            >
              <Swords className="w-6 h-6 text-amber-400" />
              <div>
                <p className="text-stone-200 font-semibold group-hover:text-amber-400 transition-colors">
                  Toolkit
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
