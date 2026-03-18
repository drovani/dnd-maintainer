import { supabase } from '@/lib/supabase'
import { Session } from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  BookOpen,
  Calendar,
  ChevronRight,
  Plus,
  Search,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function SessionList() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewSessionForm, setShowNewSessionForm] = useState(false)
  const [newSession, setNewSession] = useState({
    title: '',
    session_number: 1,
    date: new Date().toISOString().split('T')[0],
  })

  // Fetch sessions
  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ['sessions', campaignId],
    queryFn: async () => {
      if (!campaignId) return []
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('session_number', { ascending: true })

      if (error) throw error
      return data as Session[]
    },
    enabled: !!campaignId,
  })

  // Fetch total XP awarded
  const { data: totalXp = 0 } = useQuery({
    queryKey: ['sessions-xp', campaignId],
    queryFn: async () => {
      if (!campaignId) return 0
      const { data, error } = await supabase
        .from('sessions')
        .select('xp_awarded')
        .eq('campaign_id', campaignId)

      if (error) throw error
      return data.reduce((sum, session) => sum + (session.xp_awarded || 0), 0)
    },
    enabled: !!campaignId,
  })

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (session: typeof newSession) => {
      if (!campaignId) throw new Error('Campaign ID is required')

      const { data, error } = await supabase
        .from('sessions')
        .insert([
          {
            campaign_id: campaignId,
            title: session.title,
            session_number: session.session_number,
            date: session.date,
            status: 'planned',
          },
        ])
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', campaignId] })
      setShowNewSessionForm(false)
      setNewSession({
        title: '',
        session_number: Math.max(...sessions.map(s => s.session_number), 0) + 1,
        date: new Date().toISOString().split('T')[0],
      })
      navigate(`/campaign/${campaignId}/session/${data.id}`)
    },
  })

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSession.title.trim()) {
      createSessionMutation.mutate(newSession)
    }
  }

  const filteredSessions = sessions.filter((session) =>
    searchTerm.trim() === '' ? true :
      session.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-destructive flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error loading sessions</p>
              <p className="text-sm">{String(error)}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/50 border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
                <Calendar className="size-10 text-primary" />
                Sessions
              </h1>
              <p className="text-muted-foreground mt-2">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} • {totalXp} XP awarded
              </p>
            </div>
            <button
              onClick={() => setShowNewSessionForm(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-md"
            >
              <Plus className="size-5" />
              Log New Session
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 size-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sessions by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>
      </div>

      {/* New Session Modal */}
      {showNewSessionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Log New Session
            </h2>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-foreground font-semibold mb-2">
                  Session Title
                </label>
                <input
                  type="text"
                  value={newSession.title}
                  onChange={(e) =>
                    setNewSession({ ...newSession, title: e.target.value })
                  }
                  placeholder="e.g., The Goblin Ambush"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-2">
                  Session Number
                </label>
                <input
                  type="number"
                  value={newSession.session_number}
                  onChange={(e) =>
                    setNewSession({
                      ...newSession,
                      session_number: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-2">
                  Session Date
                </label>
                <input
                  type="date"
                  value={newSession.date}
                  onChange={(e) =>
                    setNewSession({ ...newSession, date: e.target.value })
                  }
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createSessionMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {createSessionMutation.isPending ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewSessionForm(false)}
                  className="flex-1 bg-muted hover:bg-muted text-foreground font-bold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <Calendar className="size-8 text-primary" />
            </div>
            <p className="text-muted-foreground mt-4">Loading sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-24 bg-card/50 rounded-lg border border-border p-12">
            <BookOpen className="size-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {sessions.length === 0
                ? 'No Sessions Yet'
                : 'No Sessions Match'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {sessions.length === 0
                ? 'Log your first session to begin tracking your campaign!'
                : 'Try adjusting your search terms.'}
            </p>
            {sessions.length === 0 && (
              <button
                onClick={() => setShowNewSessionForm(true)}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg transition-colors"
              >
                <Plus className="size-5" />
                Log Your First Session
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-0">
            {/* Timeline */}
            {filteredSessions.map((session, index) => (
              <div key={session.id} className="relative">
                {/* Timeline line */}
                {index < filteredSessions.length - 1 && (
                  <div className="absolute left-6 top-20 w-1 h-12 bg-linear-to-b from-primary/30 to-border/30" />
                )}

                {/* Session card */}
                <div
                  onClick={() =>
                    navigate(`/campaign/${campaignId}/session/${session.id}`)
                  }
                  className="group flex gap-6 pb-8 cursor-pointer"
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-1">
                    <div className="size-4 bg-amber-400 rounded-full ring-4 ring-background group-hover:scale-125 transition-transform" />
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-card border border-border hover:border-ring rounded-lg p-6 transition-all group-hover:shadow-lg group-hover:shadow-md">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3 mb-1">
                          <span className="text-sm font-semibold text-primary">
                            Session {session.session_number}
                          </span>
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {session.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="size-4" />
                          {formatDate(session.date)}
                        </p>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    </div>

                    {/* Summary preview */}
                    {session.summary && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {session.summary}
                      </p>
                    )}

                    {/* Stats footer */}
                    <div className="flex items-center gap-4 pt-4 border-t border-border">
                      {session.xp_awarded && (
                        <div className="flex items-center gap-2">
                          <Zap className="size-4 text-primary" />
                          <span className="text-muted-foreground text-sm">
                            {session.xp_awarded} XP
                          </span>
                        </div>
                      )}
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${session.status === 'completed'
                          ? 'bg-green-100 text-green-600'
                          : session.status === 'in-progress'
                            ? 'bg-blue-900/30 text-blue-400'
                            : 'bg-muted text-muted-foreground'
                          }`}
                      >
                        {session.status === 'completed'
                          ? 'Completed'
                          : session.status === 'in-progress'
                            ? 'In Progress'
                            : 'Planned'}
                      </span>
                    </div>
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
