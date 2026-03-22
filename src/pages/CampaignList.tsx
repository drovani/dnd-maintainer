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
import { useCampaigns, useCampaignMutations } from '@/hooks/useCampaigns'
import { useQuery } from '@tanstack/react-query'
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
import { Trans, useTranslation } from 'react-i18next'
import { ValidationError } from '@/components/ui/validation-error'

export default function CampaignList() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false)
  const [campaignToArchive, setCampaignToArchive] = useState<Campaign | null>(null)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    setting: '',
    description: '',
  })
  const [nameError, setNameError] = useState<string>('')

  const { t } = useTranslation('common')

  const { data: campaigns = [], isLoading } = useCampaigns()
  const { create: createCampaignMutation, archive: archiveCampaignMutation } = useCampaignMutations()

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

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCampaign.name.trim()) {
      setNameError(t('validation.nameRequired'))
      return
    }
    createCampaignMutation.mutate(newCampaign, {
      onSuccess: (data) => {
        setShowNewCampaignForm(false)
        setNewCampaign({ name: '', setting: '', description: '' })
        setNameError('')
        if (data?.id) {
          navigate(`/campaign/${data.id}`)
        }
      },
    })
  }

  const handleArchiveCampaign = () => {
    if (campaignToArchive) {
      archiveCampaignMutation.mutate(campaignToArchive.id, {
        onSuccess: () => setCampaignToArchive(null),
      })
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
                {t('campaign.campaigns')}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t('campaign.campaignCount', { count: campaigns.length })}
              </p>
            </div>
            <Button onClick={() => { setShowNewCampaignForm(true); setNameError('') }}>
              <Plus className="size-5" />
              {t('buttons.newCampaign')}
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('campaign.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* New Campaign Dialog */}
      <Dialog open={showNewCampaignForm} onOpenChange={(open) => { setShowNewCampaignForm(open); if (!open) setNameError('') }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('campaign.createNew')}</DialogTitle>
            <DialogDescription>
              {t('campaign.createNewDescription')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">{t('campaign.campaignName')}</Label>
              <div className="flex flex-col gap-1">
                <Input
                  id="campaign-name"
                  value={newCampaign.name}
                  onChange={(e) => {
                    setNameError('')
                    setNewCampaign({ ...newCampaign, name: e.target.value })
                  }}
                  placeholder={t('campaign.placeholderName')}
                />
                <ValidationError message={nameError} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-setting">{t('campaign.setting')}</Label>
              <Input
                id="campaign-setting"
                value={newCampaign.setting}
                onChange={(e) =>
                  setNewCampaign({ ...newCampaign, setting: e.target.value })
                }
                placeholder={t('campaign.placeholderSetting')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-description">{t('campaign.description')}</Label>
              <Textarea
                id="campaign-description"
                value={newCampaign.description}
                onChange={(e) =>
                  setNewCampaign({
                    ...newCampaign,
                    description: e.target.value,
                  })
                }
                placeholder={t('campaign.placeholderDescription')}
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowNewCampaignForm(false); setNameError('') }}
              >
                {t('buttons.cancel')}
              </Button>
              <Button
                type="submit"
                pending={createCampaignMutation.isPending}
              >
                {createCampaignMutation.isPending ? t('buttons.creating') : t('buttons.create')}
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
                ? t('campaign.noCampaignsYet')
                : t('campaign.noCampaignsMatch')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {campaigns.length === 0
                ? t('campaign.noCampaignsDescription')
                : t('campaign.noCampaignsMatchDescription')}
            </p>
            {campaigns.length === 0 && (
              <Button onClick={() => { setShowNewCampaignForm(true); setNameError('') }}>
                <Plus className="size-5" />
                {t('buttons.createYourFirstCampaign')}
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
                      title={t('campaign.archiveTitle')}
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
                        <p className="text-muted-foreground text-xs">{t('campaign.stats.characters')}</p>
                        <p className="text-foreground font-bold">
                          {charCount.pc + charCount.npc}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">{t('campaign.stats.sessions')}</p>
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
                          {t('characterList.pcCount', { count: charCount.pc })}
                        </span>
                      )}
                      {charCount.npc > 0 && (
                        <span className="text-muted-foreground">
                          {t('characterList.npcCount', { count: charCount.npc })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Status indicator */}
                  <div className="mt-4 flex items-center gap-2">
                    <Zap className="size-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground capitalize">
                      {t(`status.${campaign.status || 'active'}`, { defaultValue: campaign.status || 'active' })}
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
            <DialogTitle>{t('campaign.archiveCampaign')}</DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="campaign.archiveConfirm"
                values={{ name: campaignToArchive?.name }}
                components={{ bold: <span className="font-semibold" /> }}
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCampaignToArchive(null)}
            >
              {t('buttons.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchiveCampaign}
              pending={archiveCampaignMutation.isPending}
            >
              {archiveCampaignMutation.isPending ? t('buttons.archiving') : t('buttons.archive')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
