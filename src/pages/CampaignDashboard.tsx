import { supabase } from '@/lib/supabase'
import { Campaign, Character, Session } from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock,
  Edit2,
  Save,
  Scroll,
  Swords,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

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
      <div className="min-h-screen bg-background p-8">
        <div className="text-center">
          <p className="text-destructive">Campaign not found</p>
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
      <div className="min-h-screen bg-background p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <Swords className="size-8 text-primary" />
          </div>
          <p className="text-foreground mt-4">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="text-center">
          <p className="text-destructive">Campaign not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="size-5" />
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
                    className="text-3xl font-bold bg-muted border border-ring rounded px-3 py-1 text-foreground outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsEditingName(false)
                      if (e.key === 'Enter') handleUpdateName()
                    }}
                  />
                  <button
                    onClick={handleUpdateName}
                    disabled={updateCampaignMutation.isPending}
                    className="text-primary hover:text-foreground p-2"
                  >
                    <Save className="size-6" />
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="text-muted-foreground hover:text-foreground p-2"
                  >
                    <X className="size-6" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 group">
                  <h1 className="text-3xl font-bold text-foreground">
                    {campaign.name}
                  </h1>
                  <button
                    onClick={() => {
                      setEditedName(campaign.name)
                      setIsEditingName(true)
                    }}
                    className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="size-5" />
                  </button>
                </div>
              )}
              {isEditingSetting ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={editedSetting}
                    onChange={(e) => setEditedSetting(e.target.value)}
                    className="text-sm bg-muted border border-ring rounded px-3 py-1 text-muted-foreground outline-none flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsEditingSetting(false)
                      if (e.key === 'Enter') handleUpdateSetting()
                    }}
                  />
                  <button
                    onClick={handleUpdateSetting}
                    disabled={updateCampaignMutation.isPending}
                    className="text-primary hover:text-foreground p-1"
                  >
                    <Save className="size-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingSetting(false)}
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/setting mt-2">
                  <p className="text-muted-foreground">
                    {campaign.setting || (
                      <span className="italic text-muted-foreground">
                        No setting specified
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => {
                      setEditedSetting(campaign.setting || '')
                      setIsEditingSetting(true)
                    }}
                    className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover/setting:opacity-100"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg border border-border">
                <Zap className="size-5 text-primary" />
                <span className="text-foreground capitalize">
                  {campaign.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="max-w-7xl mx-auto px-8 py-8 border-b border-border">
        {isEditingDescription ? (
          <div className="flex flex-col gap-3">
            <label className="text-foreground font-semibold">Description</label>
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="bg-card border border-ring rounded-lg p-4 text-foreground outline-none min-h-24 resize-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsEditingDescription(false)
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdateDescription}
                disabled={updateCampaignMutation.isPending}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="size-4" />
                Save
              </button>
              <button
                onClick={() => setIsEditingDescription(false)}
                className="flex items-center gap-2 bg-muted hover:bg-muted text-foreground font-bold py-2 px-4 rounded-lg transition-colors"
              >
                <X className="size-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-foreground font-semibold">Campaign Description</h3>
              <button
                onClick={() => {
                  setEditedDescription(campaign.description || '')
                  setIsEditingDescription(true)
                }}
                className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
              >
                <Edit2 className="size-4" />
              </button>
            </div>
            <p className="text-muted-foreground">
              {campaign.description || (
                <span className="italic text-muted-foreground">
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
              <div className="bg-card border border-border hover:border-border rounded-lg p-6 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-foreground font-semibold flex items-center gap-2">
                    <Users className="size-5 text-primary" />
                    Characters
                  </h3>
                  <Link
                    to={`/campaign/${id}/characters`}
                    className="text-primary hover:text-foreground"
                  >
                    <ChevronRight className="size-5" />
                  </Link>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-foreground font-bold text-lg">
                      {pcCount + npcCount}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${((pcCount + npcCount) / Math.max(pcCount + npcCount, 1)) *
                          100
                          }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{pcCount} <span className="uppercase">pc</span>s</span>
                    <span>{npcCount} <span className="uppercase">npc</span>s</span>
                  </div>
                </div>
              </div>

              {/* Sessions Stat */}
              <div className="bg-card border border-border hover:border-border rounded-lg p-6 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-foreground font-semibold flex items-center gap-2">
                    <BookOpen className="size-5 text-primary" />
                    Sessions
                  </h3>
                  <Link
                    to={`/campaign/${id}/sessions`}
                    className="text-primary hover:text-foreground"
                  >
                    <ChevronRight className="size-5" />
                  </Link>
                </div>
                <p className="text-foreground font-bold text-lg">{sessions.length}</p>
                {lastSession && (
                  <p className="text-muted-foreground text-sm mt-2">
                    Last session: {new Date(lastSession.date).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Notes Stat */}
              <div className="bg-card border border-border hover:border-border rounded-lg p-6 transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-foreground font-semibold flex items-center gap-2">
                    <Scroll className="size-5 text-primary" />
                    Notes
                  </h3>
                  <Link
                    to={`/campaign/${id}/notes`}
                    className="text-primary hover:text-foreground"
                  >
                    <ChevronRight className="size-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                <Clock className="size-5 text-primary" />
                Recent Activity
              </h3>

              {lastSession ? (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="text-foreground font-semibold">
                      Last Session Played
                    </p>
                    <p className="text-primary font-bold text-lg mt-1">
                      Session {lastSession.session_number}: {lastSession.title}
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                      {new Date(lastSession.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {lastSession.summary && (
                      <p className="text-muted-foreground text-sm mt-3 line-clamp-2">
                        {lastSession.summary}
                      </p>
                    )}
                  </div>

                  <Link
                    to={`/campaign/${id}/sessions`}
                    className="block text-primary hover:text-foreground text-sm font-semibold transition-colors"
                  >
                    View all sessions →
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/30 rounded-lg border border-border">
                  <BookOpen className="size-8 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No sessions recorded yet</p>
                  <Link
                    to={`/campaign/${id}/sessions`}
                    className="text-primary hover:text-foreground text-sm font-semibold mt-3 inline-block transition-colors"
                  >
                    Create first session →
                  </Link>
                </div>
              )}
            </div>

            {/* Recently Modified Characters */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                <Users className="size-5 text-primary" />
                Party Members
              </h3>

              {recentCharacters.length > 0 ? (
                <div className="space-y-3">
                  {recentCharacters.map((char) => (
                    <Link
                      key={char.id}
                      to={`/campaign/${id}/character/${char.id}`}
                      className="block bg-muted/50 hover:bg-muted rounded-lg p-4 border border-border hover:border-border transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-foreground font-semibold group-hover:text-primary transition-colors">
                            {char.name}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {char.race} {char.class} • Level {char.level}
                          </p>
                          {char.player_name && (
                            <p className="text-muted-foreground text-xs mt-1">
                              Played by {char.player_name}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  ))}

                  {characters.length > recentCharacters.length && (
                    <Link
                      to={`/campaign/${id}/characters`}
                      className="block text-primary hover:text-foreground text-sm font-semibold transition-colors mt-4"
                    >
                      View all {characters.length} characters →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/30 rounded-lg border border-border">
                  <Users className="size-8 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No characters yet</p>
                  <Link
                    to={`/campaign/${id}/character/new`}
                    className="text-primary hover:text-foreground text-sm font-semibold mt-3 inline-block transition-colors"
                  >
                    Create a character →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 bg-card border border-border rounded-lg p-8">
          <h3 className="text-xl font-bold text-foreground mb-6">
            Campaign Toolkit
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to={`/campaign/${id}/characters`}
              className="flex items-center gap-3 bg-muted hover:bg-muted hover:border-border border border-border rounded-lg p-4 transition-all group"
            >
              <Users className="size-6 text-primary" />
              <div>
                <p className="text-foreground font-semibold group-hover:text-primary transition-colors">
                  Characters
                </p>
                <p className="text-muted-foreground text-xs">{pcCount + npcCount}</p>
              </div>
            </Link>

            <Link
              to={`/campaign/${id}/sessions`}
              className="flex items-center gap-3 bg-muted hover:bg-muted hover:border-border border border-border rounded-lg p-4 transition-all group"
            >
              <BookOpen className="size-6 text-primary" />
              <div>
                <p className="text-foreground font-semibold group-hover:text-primary transition-colors">
                  Sessions
                </p>
                <p className="text-muted-foreground text-xs">{sessions.length}</p>
              </div>
            </Link>

            <Link
              to={`/campaign/${id}/notes`}
              className="flex items-center gap-3 bg-muted hover:bg-muted hover:border-border border border-border rounded-lg p-4 transition-all group"
            >
              <Scroll className="size-6 text-primary" />
              <div>
                <p className="text-foreground font-semibold group-hover:text-primary transition-colors">
                  Notes
                </p>
              </div>
            </Link>

            <Link
              to={`/campaign/${id}/toolkit`}
              className="flex items-center gap-3 bg-muted hover:bg-muted hover:border-border border border-border rounded-lg p-4 transition-all group"
            >
              <Swords className="size-6 text-primary" />
              <div>
                <p className="text-foreground font-semibold group-hover:text-primary transition-colors">
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
