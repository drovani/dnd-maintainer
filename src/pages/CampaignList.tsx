import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 space-y-4">
            <Skeleton className="h-10 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-muted/50 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
                <Swords className="size-10 text-muted-foreground" />
                Campaigns
              </h1>
              <p className="text-muted-foreground mt-2">
                {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} total
              </p>
            </div>
            <Button onClick={() => setShowNewCampaignForm(true)}>
              <Plus className="size-5" />
              New Campaign
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search campaigns by name or setting..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* New Campaign Dialog */}
      <Dialog open={showNewCampaignForm} onOpenChange={setShowNewCampaignForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Set up a new campaign to begin your adventure.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={newCampaign.name}
                onChange={(e) =>
                  setNewCampaign({ ...newCampaign, name: e.target.value })
                }
                placeholder="e.g., Lost Mines of Phandalin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-setting">Setting</Label>
              <Input
                id="campaign-setting"
                value={newCampaign.setting}
                onChange={(e) =>
                  setNewCampaign({ ...newCampaign, setting: e.target.value })
                }
                placeholder="e.g., Forgotten Realms, Greyhawk"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-description">Description</Label>
              <Textarea
                id="campaign-description"
                value={newCampaign.description}
                onChange={(e) =>
                  setNewCampaign({
                    ...newCampaign,
                    description: e.target.value,
                  })
                }
                placeholder="Describe your campaign..."
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewCampaignForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCampaignMutation.isPending}
              >
                {createCampaignMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-24 rounded-lg border bg-card p-12">
            <Swords className="size-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {campaigns.length === 0
                ? 'No Campaigns Yet'
                : 'No Campaigns Match'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {campaigns.length === 0
                ? 'Create your first campaign to begin your adventure!'
                : 'Try adjusting your search terms.'}
            </p>
            {campaigns.length === 0 && (
              <Button onClick={() => setShowNewCampaignForm(true)}>
                <Plus className="size-5" />
                Create Your First Campaign
              </Button>
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
                  className="group bg-card border rounded-lg p-6 transition-all hover:shadow-md hover:border-ring cursor-pointer"
                  onClick={() => navigate(`/campaign/${campaign.id}`)}
                >
                  {/* Campaign Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {campaign.name}
                      </h3>
                      {campaign.setting && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {campaign.setting}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setCampaignToArchive(campaign)
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Archive campaign"
                    >
                      <Archive className="size-5" />
                    </button>
                  </div>

                  {/* Description */}
                  {campaign.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {campaign.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Characters</p>
                        <p className="text-foreground font-bold">
                          {charCount.pc + charCount.npc}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Sessions</p>
                        <p className="text-foreground font-bold">
                          {sessionCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sub-stats */}
                  {(charCount.pc > 0 || charCount.npc > 0) && (
                    <div className="mt-3 pt-3 border-t flex gap-4 text-xs">
                      {charCount.pc > 0 && (
                        <span className="text-muted-foreground">
                          {charCount.pc} <span className="uppercase">pc</span>s
                        </span>
                      )}
                      {charCount.npc > 0 && (
                        <span className="text-muted-foreground">
                          {charCount.npc} <span className="uppercase">npc</span>s
                        </span>
                      )}
                    </div>
                  )}

                  {/* Status indicator */}
                  <div className="mt-4 flex items-center gap-2">
                    <Zap className="size-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground capitalize">
                      {campaign.status || 'Active'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Archive Confirmation Dialog */}
      <Dialog open={!!campaignToArchive} onOpenChange={(open) => { if (!open) setCampaignToArchive(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive Campaign</DialogTitle>
            <DialogDescription>
              Archive <span className="font-semibold">"{campaignToArchive?.name}"</span>? It will be hidden from view.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCampaignToArchive(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (campaignToArchive) {
                  archiveCampaignMutation.mutate(campaignToArchive.id)
                  setCampaignToArchive(null)
                }
              }}
              disabled={archiveCampaignMutation.isPending}
            >
              {archiveCampaignMutation.isPending ? 'Archiving...' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
