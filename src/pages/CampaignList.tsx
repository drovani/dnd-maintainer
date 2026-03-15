import { Modal } from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { Campaign } from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Archive,
  BookOpen,
  Plus,
  Search,
  Swords,
  Users,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CampaignList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false)
  const [campaignToArchive, setCampaignToArchive] = useState<Campaign | null>(null)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    setting: '',
    description: '',
  })

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Campaign[]
    },
  })

  // Fetch character counts for each campaign
  const { data: characterCounts = {} } = useQuery({
    queryKey: ['campaign-character-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('campaign_id, is_npc')
      if (error) throw error

      const counts: Record<string, { pc: number; npc: number }> = {}
      data.forEach((char) => {
        if (!counts[char.campaign_id]) {
          counts[char.campaign_id] = { pc: 0, npc: 0 }
        }
        if (char.is_npc) {
          counts[char.campaign_id].npc++
        } else {
          counts[char.campaign_id].pc++
        }
      })
      return counts
    },
  })

  // Fetch session counts for each campaign
  const { data: sessionCounts = {} } = useQuery({
    queryKey: ['campaign-session-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('campaign_id')
      if (error) throw error

      const counts: Record<string, number> = {}
      data.forEach((session) => {
        counts[session.campaign_id] = (counts[session.campaign_id] || 0) + 1
      })
      return counts
    },
  })

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: typeof newCampaign) => {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([
          {
            name: campaign.name,
            setting: campaign.setting,
            description: campaign.description,
            status: 'planning',
          },
        ])
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      setShowNewCampaignForm(false)
      setNewCampaign({ name: '', setting: '', description: '' })
      navigate(`/campaign/${data.id}`)
    },
  })

  // Archive campaign mutation
  const archiveCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('campaigns')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', campaignId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCampaign.name.trim()) {
      createCampaignMutation.mutate(newCampaign)
    }
  }

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.setting?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <Swords className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-stone-300 mt-4">Loading your campaigns...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-linear-to-r from-slate-900 to-slate-800 border-b border-amber-500/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-stone-100 flex items-center gap-3">
                <Swords className="w-10 h-10 text-amber-400" />
                Campaigns
              </h1>
              <p className="text-stone-400 mt-2">
                {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} total
              </p>
            </div>
            <button
              onClick={() => setShowNewCampaignForm(true)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-amber-600/50"
            >
              <Plus className="w-5 h-5" />
              New Campaign
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-stone-500" />
            <input
              type="text"
              placeholder="Search campaigns by name or setting..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>
      </div>

      {/* New Campaign Modal */}
      {showNewCampaignForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-amber-500/30 p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-stone-100 mb-6">
              Create New Campaign
            </h2>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-stone-300 font-semibold mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, name: e.target.value })
                  }
                  placeholder="e.g., Lost Mines of Phandalin"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-2">
                  Setting
                </label>
                <input
                  type="text"
                  value={newCampaign.setting}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, setting: e.target.value })
                  }
                  placeholder="e.g., Forgotten Realms, Greyhawk"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-2">
                  Description
                </label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe your campaign..."
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createCampaignMutation.isPending}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {createCampaignMutation.isPending ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCampaignForm(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-stone-200 font-bold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/30 rounded-lg border border-slate-800 p-12">
            <Swords className="w-16 h-16 text-amber-400/50 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-stone-300 mb-2">
              {campaigns.length === 0
                ? 'No Campaigns Yet'
                : 'No Campaigns Match'}
            </h3>
            <p className="text-stone-400 mb-6">
              {campaigns.length === 0
                ? 'Create your first campaign to begin your adventure!'
                : 'Try adjusting your search terms.'}
            </p>
            {campaigns.length === 0 && (
              <button
                onClick={() => setShowNewCampaignForm(true)}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold py-3 px-6 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Your First Campaign
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => {
              const charCount = characterCounts[campaign.id] || {
                pc: 0,
                npc: 0,
              }
              const sessionCount = sessionCounts[campaign.id] || 0

              return (
                <div
                  key={campaign.id}
                  className="group bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-lg p-6 transition-all hover:shadow-lg hover:shadow-amber-600/20 cursor-pointer"
                  onClick={() => navigate(`/campaign/${campaign.id}`)}
                >
                  {/* Campaign Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
                        {campaign.name}
                      </h3>
                      {campaign.setting && (
                        <p className="text-sm text-amber-400/70 mt-1">
                          {campaign.setting}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setCampaignToArchive(campaign)
                      }}
                      className="text-slate-400 hover:text-amber-400 transition-colors"
                      title="Archive campaign"
                    >
                      <Archive className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Description */}
                  {campaign.description && (
                    <p className="text-stone-400 text-sm mb-4 line-clamp-2">
                      {campaign.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="text-stone-400 text-xs">Characters</p>
                        <p className="text-stone-100 font-bold">
                          {charCount.pc + charCount.npc}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="text-stone-400 text-xs">Sessions</p>
                        <p className="text-stone-100 font-bold">
                          {sessionCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sub-stats */}
                  {(charCount.pc > 0 || charCount.npc > 0) && (
                    <div className="mt-3 pt-3 border-t border-slate-800 flex gap-4 text-xs">
                      {charCount.pc > 0 && (
                        <span className="text-stone-400">
                          {charCount.pc} <span className="uppercase">pc</span>s
                        </span>
                      )}
                      {charCount.npc > 0 && (
                        <span className="text-stone-400">
                          {charCount.npc} <span className="uppercase">npc</span>s
                        </span>
                      )}
                    </div>
                  )}

                  {/* Status indicator */}
                  <div className="mt-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-stone-400 capitalize">
                      {campaign.status || 'Active'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Archive Confirmation Modal */}
      <Modal
        isOpen={!!campaignToArchive}
        onClose={() => setCampaignToArchive(null)}
        title="Archive Campaign"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setCampaignToArchive(null)}
              className="bg-slate-800 hover:bg-slate-700 text-stone-200 font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (campaignToArchive) {
                  archiveCampaignMutation.mutate(campaignToArchive.id)
                  setCampaignToArchive(null)
                }
              }}
              disabled={archiveCampaignMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {archiveCampaignMutation.isPending ? 'Archiving...' : 'Archive'}
            </button>
          </div>
        }
      >
        <p className="text-stone-300">
          Archive <span className="font-semibold text-stone-100">"{campaignToArchive?.name}"</span>? It will be hidden from view.
        </p>
      </Modal>
    </div>
  )
}
