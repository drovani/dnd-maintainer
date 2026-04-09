import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ValidationError } from '@/components/ui/validation-error'
import { ThemePicker } from '@/components/ThemePicker'
import { useCampaign, useCampaignMutations } from '@/hooks/useCampaigns'
import { useCampaignContext } from '@/hooks/useCampaignContext'
import { useCharacters } from '@/hooks/useCharacters'
import { useSessions } from '@/hooks/useSessions'
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock,
  Edit2,
  Palette,
  Save,
  Scroll,
  Swords,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

export default function CampaignDashboard() {
  const { campaignSlug } = useParams<{ campaignSlug: string }>()
  const { campaignId } = useCampaignContext()
  const navigate = useNavigate()

  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isEditingSetting, setIsEditingSetting] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedSetting, setEditedSetting] = useState('')
  const [nameError, setNameError] = useState<string>('')

  const { t } = useTranslation('common')
  const { t: tg } = useTranslation('gamedata')

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignSlug)
  const { update: updateMutation } = useCampaignMutations()

  // Fetch characters for this campaign (by UUID for FK queries)
  const { data: charactersRaw = [], error: charactersError } = useCharacters(campaignId!)
  const characters = useMemo(
    () => [...charactersRaw].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [charactersRaw]
  )

  // Fetch sessions for this campaign (by UUID for FK queries)
  const { data: sessions = [], error: sessionsError } = useSessions(campaignId!)

  if (!campaignSlug) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="text-center">
          <p className="text-destructive">{t('campaign.notFound')}</p>
        </div>
      </div>
    )
  }

  const handleUpdate = (updates: Record<string, string>) => {
    updateMutation.mutate({ id: campaign!.id, ...updates }, {
      onSuccess: () => {
        setIsEditingName(false)
        setIsEditingDescription(false)
        setIsEditingSetting(false)
      },
    })
  }

  const handleUpdateName = () => {
    if (!editedName.trim()) {
      setNameError(t('validation.nameRequired'))
      return
    }
    handleUpdate({ name: editedName })
  }

  const handleUpdateDescription = () => {
    handleUpdate({ description: editedDescription })
  }

  const handleUpdateSetting = () => {
    handleUpdate({ setting: editedSetting })
  }

  const pcCount = characters.filter((c) => c.character_type === 'pc').length
  const npcCount = characters.filter((c) => c.character_type === 'npc').length
  const lastSession = sessions[0]
  const recentCharacters = characters.slice(0, 5)

  if (campaignLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <Swords className="size-8 text-primary" />
          </div>
          <p className="text-foreground mt-4">{t('campaign.loading')}</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="text-center">
          <p className="text-destructive">{t('campaign.notFound')}</p>
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
            {t('campaign.backToCampaigns')}
          </button>

          {/* Campaign Title - Editable */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => {
                        setEditedName(e.target.value)
                        setNameError('')
                      }}
                      className="text-3xl font-bold bg-muted border border-ring rounded px-3 py-1 text-foreground outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') { setIsEditingName(false); setNameError('') }
                        if (e.key === 'Enter') handleUpdateName()
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleUpdateName}
                      pending={updateMutation.isPending}
                    >
                      <Save className="size-6" />
                    </Button>
                    <button
                      onClick={() => { setIsEditingName(false); setNameError('') }}
                      className="text-muted-foreground hover:text-foreground p-2"
                    >
                      <X className="size-6" />
                    </button>
                  </div>
                  <ValidationError message={nameError} />
                </div>
              ) : (
                <div className="flex items-center gap-4 group">
                  <h1 className="text-3xl font-bold text-foreground">
                    {campaign.name}
                  </h1>
                  <button
                    onClick={() => {
                      setEditedName(campaign.name)
                      setNameError('')
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
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleUpdateSetting}
                    pending={updateMutation.isPending}
                  >
                    <Save className="size-4" />
                  </Button>
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
                        {t('campaign.noSetting')}
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
                <span className="text-foreground">
                  {t(`status.${campaign.status || 'active'}`, { defaultValue: campaign.status || 'active' })}
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
            <label className="text-foreground font-semibold">{t('campaign.description')}</label>
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
              <Button
                onClick={handleUpdateDescription}
                pending={updateMutation.isPending}
              >
                <Save className="size-4" />
                {t('buttons.save')}
              </Button>
              <button
                onClick={() => setIsEditingDescription(false)}
                className="flex items-center gap-2 bg-muted hover:bg-muted text-foreground font-bold py-2 px-4 rounded-lg transition-colors"
              >
                <X className="size-4" />
                {t('buttons.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-foreground font-semibold">{t('campaign.description')}</h3>
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
                  {t('campaign.noDescription')}
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
                    {t('campaign.stats.characters')}
                  </h3>
                  <Link
                    to={`/campaign/${campaignSlug}/characters`}
                    className="text-primary hover:text-foreground"
                  >
                    <ChevronRight className="size-5" />
                  </Link>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('campaign.stats.total')}</span>
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
                    <span>{t('characterList.pcCount', { count: pcCount })}</span>
                    <span>{t('characterList.npcCount', { count: npcCount })}</span>
                  </div>
                </div>
              </div>

              {/* Sessions Stat */}
              <div className="bg-card border border-border hover:border-border rounded-lg p-6 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-foreground font-semibold flex items-center gap-2">
                    <BookOpen className="size-5 text-primary" />
                    {t('campaign.stats.sessions')}
                  </h3>
                  <Link
                    to={`/campaign/${campaignSlug}/sessions`}
                    className="text-primary hover:text-foreground"
                  >
                    <ChevronRight className="size-5" />
                  </Link>
                </div>
                <p className="text-foreground font-bold text-lg">{sessions.length}</p>
                {lastSession && (
                  <p className="text-muted-foreground text-sm mt-2">
                    {t('campaign.stats.lastSession', { date: lastSession.date ? new Date(lastSession.date).toLocaleDateString() : t('campaign.stats.noDate') })}
                  </p>
                )}
              </div>

              {/* Notes Stat */}
              <div className="bg-card border border-border hover:border-border rounded-lg p-6 transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-foreground font-semibold flex items-center gap-2">
                    <Scroll className="size-5 text-primary" />
                    {t('campaign.stats.notes')}
                  </h3>
                  <Link
                    to={`/campaign/${campaignSlug}/notes`}
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
                {t('campaign.activity.title')}
              </h3>

              {sessionsError ? (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-destructive text-sm">
                  {t('campaign.activity.failedToLoadSessions')}
                </div>
              ) : lastSession ? (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="text-foreground font-semibold">
                      {t('campaign.activity.lastSessionPlayed')}
                    </p>
                    <p className="text-primary font-bold text-lg mt-1">
                      {t('sessionDetail.sessionHeading', { number: lastSession.session_number, title: lastSession.name })}
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                      {lastSession.date ? new Date(lastSession.date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) : t('campaign.stats.noDate')}
                    </p>
                    {lastSession.summary && (
                      <p className="text-muted-foreground text-sm mt-3 line-clamp-2">
                        {lastSession.summary}
                      </p>
                    )}
                  </div>

                  <Link
                    to={`/campaign/${campaignSlug}/sessions`}
                    className="block text-primary hover:text-foreground text-sm font-semibold transition-colors"
                  >
                    {t('campaign.activity.viewAllSessions')}
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/30 rounded-lg border border-border">
                  <BookOpen className="size-8 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">{t('campaign.activity.noSessions')}</p>
                  <Link
                    to={`/campaign/${campaignSlug}/sessions`}
                    className="text-primary hover:text-foreground text-sm font-semibold mt-3 inline-block transition-colors"
                  >
                    {t('campaign.activity.createFirstSession')}
                  </Link>
                </div>
              )}
            </div>

            {/* Recently Modified Characters */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                <Users className="size-5 text-primary" />
                {t('campaign.party.title')}
              </h3>

              {charactersError ? (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-destructive text-sm">
                  {t('campaign.party.failedToLoadCharacters')}
                </div>
              ) : recentCharacters.length > 0 ? (
                <div className="space-y-3">
                  {recentCharacters.map((char) => (
                    <Link
                      key={char.id}
                      to={`/campaign/${campaignSlug}/character/${char.slug}`}
                      className="block bg-muted/50 hover:bg-muted rounded-lg p-4 border border-border hover:border-border transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-foreground font-semibold group-hover:text-primary transition-colors">
                            {char.name}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {t('campaign.party.charSummary', { race: char.race ? tg(`races.${char.race}`, { defaultValue: char.race }) : '', class: char.class ? tg(`classes.${char.class}`, { defaultValue: char.class }) : '', level: char.level })}
                          </p>
                          {char.player_name && (
                            <p className="text-muted-foreground text-xs mt-1">
                              {t('campaign.party.playedBy', { name: char.player_name })}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  ))}

                  {characters.length > recentCharacters.length && (
                    <Link
                      to={`/campaign/${campaignSlug}/characters`}
                      className="block text-primary hover:text-foreground text-sm font-semibold transition-colors mt-4"
                    >
                      {t('campaign.party.viewAllCharacters', { count: characters.length })}
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/30 rounded-lg border border-border">
                  <Users className="size-8 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">{t('campaign.party.noCharacters')}</p>
                  <Link
                    to={`/campaign/${campaignSlug}/character/new`}
                    className="text-primary hover:text-foreground text-sm font-semibold mt-3 inline-block transition-colors"
                  >
                    {t('campaign.party.createCharacter')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 bg-card border border-border rounded-lg p-8">
          <h3 className="text-xl font-bold text-foreground mb-6">
            {t('campaign.toolkit.title')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to={`/campaign/${campaignSlug}/characters`}
              className="flex items-center gap-3 bg-muted hover:bg-muted hover:border-border border border-border rounded-lg p-4 transition-all group"
            >
              <Users className="size-6 text-primary" />
              <div>
                <p className="text-foreground font-semibold group-hover:text-primary transition-colors">
                  {t('campaign.stats.characters')}
                </p>
                <p className="text-muted-foreground text-xs">{pcCount + npcCount}</p>
              </div>
            </Link>

            <Link
              to={`/campaign/${campaignSlug}/sessions`}
              className="flex items-center gap-3 bg-muted hover:bg-muted hover:border-border border border-border rounded-lg p-4 transition-all group"
            >
              <BookOpen className="size-6 text-primary" />
              <div>
                <p className="text-foreground font-semibold group-hover:text-primary transition-colors">
                  {t('campaign.stats.sessions')}
                </p>
                <p className="text-muted-foreground text-xs">{sessions.length}</p>
              </div>
            </Link>

            <Link
              to={`/campaign/${campaignSlug}/notes`}
              className="flex items-center gap-3 bg-muted hover:bg-muted hover:border-border border border-border rounded-lg p-4 transition-all group"
            >
              <Scroll className="size-6 text-primary" />
              <div>
                <p className="text-foreground font-semibold group-hover:text-primary transition-colors">
                  {t('campaign.stats.notes')}
                </p>
              </div>
            </Link>

          </div>

          <div className="mt-4">
            <Card className="hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="size-5 text-muted-foreground" />
                  <h3 className="font-semibold">{t('campaign.theme')}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{t('campaign.themeDescription')}</p>
                <ThemePicker
                  value={campaign.theme ?? null}
                  onChange={(newTheme) => updateMutation.mutate({ id: campaign!.id, theme: newTheme })}
                  allowNone
                  disabled={updateMutation.isPending}
                />
                {updateMutation.isError && updateMutation.variables && 'theme' in updateMutation.variables && (
                  <p className="text-sm text-destructive mt-1">{t('errors.saveFailed')}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
