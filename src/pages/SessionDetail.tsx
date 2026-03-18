import { supabase } from '@/lib/supabase'
import { Encounter, Session } from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Link as LinkIcon,
  Lock,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

interface LootEntry {
  id: string
  item_name: string
  quantity: number
  gold_value: number
  awarded_to: string
}

export default function SessionDetail() {
  const { id: campaignId, sessionId } = useParams<{
    id: string
    sessionId: string
  }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)
  const autoSaveTimer = useRef<NodeJS.Timeout>(null)

  const [formData, setFormData] = useState<Partial<Session>>({
    title: '',
    session_number: 1,
    date: new Date().toISOString().split('T')[0],
    summary: '',
    xp_awarded: 0,
  })

  const [dmNotes, setDmNotes] = useState('')
  const [loot, setLoot] = useState<LootEntry[]>([])
  const [showNewLootForm, setShowNewLootForm] = useState(false)
  const [newLoot, setNewLoot] = useState<LootEntry>({
    id: crypto.randomUUID(),
    item_name: '',
    quantity: 1,
    gold_value: 0,
    awarded_to: '',
  })

  // Fetch session
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) throw error
      return data as Session
    },
    enabled: !!sessionId,
  })

  // Fetch DM notes
  const { data: notes = '' } = useQuery({
    queryKey: ['session-dm-notes', sessionId],
    queryFn: async () => {
      if (!sessionId) return ''
      const { data, error } = await supabase
        .from('session_dm_notes')
        .select('content')
        .eq('session_id', sessionId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data?.content || ''
    },
    enabled: !!sessionId,
  })

  // Fetch loot
  const { data: lootItems = [] } = useQuery({
    queryKey: ['session-loot', sessionId],
    queryFn: async () => {
      if (!sessionId) return []
      const { data, error } = await supabase
        .from('session_loot')
        .select('*')
        .eq('session_id', sessionId)

      if (error) throw error
      return data as LootEntry[]
    },
    enabled: !!sessionId,
  })

  // Fetch linked encounters
  const { data: encounters = [] } = useQuery({
    queryKey: ['session-encounters', sessionId],
    queryFn: async () => {
      if (!sessionId) return []
      const { data, error } = await supabase
        .from('encounters')
        .select('*')
        .eq('session_id', sessionId)

      if (error) throw error
      return data as Encounter[]
    },
    enabled: !!sessionId,
  })

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (updates: Partial<Session>) => {
      if (!sessionId) throw new Error('Session ID is required')

      const { error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      setIsSaving(false)
    },
  })

  // Update DM notes mutation
  const updateDmNotesMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!sessionId) throw new Error('Session ID is required')

      const { error: deleteError } = await supabase
        .from('session_dm_notes')
        .delete()
        .eq('session_id', sessionId)

      if (deleteError && deleteError.code !== 'PGRST116') throw deleteError

      if (content.trim()) {
        const { error: insertError } = await supabase
          .from('session_dm_notes')
          .insert([
            {
              session_id: sessionId,
              content,
            },
          ])

        if (insertError) throw insertError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['session-dm-notes', sessionId],
      })
    },
  })

  // Upsert loot mutation
  const upsertLootMutation = useMutation({
    mutationFn: async (lootEntry: LootEntry) => {
      if (!sessionId) throw new Error('Session ID is required')

      const { error } = await supabase
        .from('session_loot')
        .upsert(
          [
            {
              id: lootEntry.id,
              session_id: sessionId,
              item_name: lootEntry.item_name,
              quantity: lootEntry.quantity,
              gold_value: lootEntry.gold_value,
              awarded_to: lootEntry.awarded_to,
            },
          ],
          { onConflict: 'id' }
        )

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-loot', sessionId] })
    },
  })

  // Delete loot mutation
  const deleteLootMutation = useMutation({
    mutationFn: async (lootId: string) => {
      const { error } = await supabase
        .from('session_loot')
        .delete()
        .eq('id', lootId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-loot', sessionId] })
    },
  })

  // Initialize form when session loads
  useState(() => {
    if (session) {
      setFormData(session)
    }
  })

  useState(() => {
    if (notes) {
      setDmNotes(notes)
    }
  })

  useState(() => {
    if (lootItems) {
      setLoot(lootItems)
    }
  })

  // Auto-save handler
  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      const updated = { ...formData, [field]: value }
      setFormData(updated)

      // Clear existing timer
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }

      // Set new timer for auto-save
      setIsSaving(true)
      autoSaveTimer.current = setTimeout(() => {
        updateSessionMutation.mutate(updated)
      }, 1000)
    },
    [formData, updateSessionMutation]
  )

  const handleAddLoot = (e: React.FormEvent) => {
    e.preventDefault()
    if (newLoot.item_name.trim()) {
      upsertLootMutation.mutate(newLoot)
      setNewLoot({
        id: crypto.randomUUID(),
        item_name: '',
        quantity: 1,
        gold_value: 0,
        awarded_to: '',
      })
      setShowNewLootForm(false)
    }
  }

  const handleDeleteLoot = (lootId: string) => {
    if (confirm('Remove this item from the loot table?')) {
      deleteLootMutation.mutate(lootId)
    }
  }

  const handleSaveDmNotes = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }

    setIsSaving(true)
    autoSaveTimer.current = setTimeout(() => {
      updateDmNotesMutation.mutate(dmNotes)
    }, 1000)
  }, [dmNotes, updateDmNotesMutation])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary hover:text-foreground mb-8"
          >
            <ArrowLeft className="size-5" />
            Back
          </button>
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-destructive flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error loading session</p>
              <p className="text-sm">{String(error)}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="inline-block animate-spin">
            <Calendar className="size-8 text-primary" />
          </div>
          <p className="text-muted-foreground mt-4">Loading session...</p>
        </div>
      </div>
    )
  }

  const totalLootValue = loot.reduce((sum, item) => sum + item.gold_value, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/50 border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="size-5" />
            Back to Sessions
          </button>
          <h1 className="text-4xl font-bold text-foreground">
            Session {formData.session_number}: {formData.title}
          </h1>
          <p className="text-muted-foreground mt-2">{formatDate(formData.date || '')}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Auto-save indicator */}
        {isSaving && (
          <div className="mb-6 flex items-center gap-2 text-primary text-sm">
            <div className="size-2 bg-amber-400 rounded-full animate-pulse" />
            Saving...
          </div>
        )}

        {/* Session Info Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            Session Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-muted-foreground text-sm font-semibold mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="Session title"
              />
            </div>

            <div>
              <label className="block text-muted-foreground text-sm font-semibold mb-2">
                Session Number
              </label>
              <input
                type="number"
                value={formData.session_number || 1}
                onChange={(e) =>
                  handleFieldChange(
                    'session_number',
                    parseInt(e.target.value, 10)
                  )
                }
                className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                min="1"
              />
            </div>

            <div>
              <label className="block text-muted-foreground text-sm font-semibold mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-muted-foreground text-sm font-semibold mb-2">
              Summary (Player-Facing)
            </label>
            <textarea
              value={formData.summary || ''}
              onChange={(e) => handleFieldChange('summary', e.target.value)}
              placeholder="What happened in this session? This will be visible to players."
              rows={4}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <label className="block text-muted-foreground text-sm font-semibold mb-2">
              XP Awarded
            </label>
            <input
              type="number"
              value={formData.xp_awarded || 0}
              onChange={(e) =>
                handleFieldChange('xp_awarded', parseInt(e.target.value, 10))
              }
              className="w-full md:w-48 bg-muted border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              min="0"
            />
          </div>
        </div>

        {/* DM Notes Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Lock className="size-5 text-primary" />
            DM Notes (Private)
          </h2>

          <textarea
            value={dmNotes}
            onChange={(e) => {
              setDmNotes(e.target.value)
              handleSaveDmNotes()
            }}
            placeholder="Your private DM notes for this session. Not visible to players."
            rows={6}
            className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
          />
        </div>

        {/* Loot Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Zap className="size-5 text-primary" />
              Loot Table
            </h2>
            <button
              onClick={() => setShowNewLootForm(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              <Plus className="size-4" />
              Add Item
            </button>
          </div>

          {showNewLootForm && (
            <form onSubmit={handleAddLoot} className="bg-muted rounded-lg p-4 mb-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newLoot.item_name}
                  onChange={(e) =>
                    setNewLoot({ ...newLoot, item_name: e.target.value })
                  }
                  placeholder="Item name"
                  className="bg-muted border border-input rounded px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-ring"
                  autoFocus
                />
                <input
                  type="number"
                  value={newLoot.quantity}
                  onChange={(e) =>
                    setNewLoot({
                      ...newLoot,
                      quantity: parseInt(e.target.value, 10),
                    })
                  }
                  placeholder="Quantity"
                  className="bg-muted border border-input rounded px-3 py-2 text-foreground outline-none focus:border-ring"
                  min="1"
                />
                <input
                  type="number"
                  value={newLoot.gold_value}
                  onChange={(e) =>
                    setNewLoot({
                      ...newLoot,
                      gold_value: parseInt(e.target.value, 10),
                    })
                  }
                  placeholder="Gold value"
                  className="bg-muted border border-input rounded px-3 py-2 text-foreground outline-none focus:border-ring"
                  min="0"
                />
                <input
                  type="text"
                  value={newLoot.awarded_to}
                  onChange={(e) =>
                    setNewLoot({ ...newLoot, awarded_to: e.target.value })
                  }
                  placeholder="Awarded to (optional)"
                  className="bg-muted border border-input rounded px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-ring"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewLootForm(false)}
                  className="px-4 py-2 bg-muted hover:bg-accent text-foreground rounded transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upsertLootMutation.isPending}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded transition-colors text-sm disabled:opacity-50"
                >
                  {upsertLootMutation.isPending ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          )}

          {loot.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No items awarded yet
            </p>
          ) : (
            <div className="space-y-3">
              {loot.map((item) => (
                <div
                  key={item.id}
                  className="bg-muted rounded-lg p-4 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <p className="text-foreground font-semibold">
                      {item.item_name}
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Qty: {item.quantity} • Value: {item.gold_value} gp
                    </p>
                    {item.awarded_to && (
                      <p className="text-muted-foreground text-sm mt-2">
                        → {item.awarded_to}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteLoot(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-4"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
              ))}

              {totalLootValue > 0 && (
                <div className="border-t border-border pt-3 mt-4 flex justify-end items-center gap-2">
                  <span className="text-muted-foreground text-sm">Total value:</span>
                  <span className="text-primary font-bold">
                    {totalLootValue} gp
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Encounters Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <LinkIcon className="size-5 text-primary" />
              Linked Encounters
            </h2>
            <button
              onClick={() =>
                navigate(`/campaign/${campaignId}/encounter/new?session=${sessionId}`)
              }
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              <Plus className="size-4" />
              Add Encounter
            </button>
          </div>

          {encounters.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No encounters linked to this session
            </p>
          ) : (
            <div className="space-y-3">
              {encounters.map((encounter) => (
                <div
                  key={encounter.id}
                  onClick={() =>
                    navigate(`/campaign/${campaignId}/encounter/${encounter.id}`)
                  }
                  className="bg-muted hover:bg-muted/50 rounded-lg p-4 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-foreground font-semibold">
                        {encounter.name}
                      </p>
                      {encounter.location && (
                        <p className="text-muted-foreground text-sm mt-1">
                          {encounter.location}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${encounter.status === 'completed'
                          ? 'bg-green-100 text-green-600'
                          : encounter.status === 'active'
                            ? 'bg-red-100 text-destructive'
                            : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      {encounter.status === 'completed'
                        ? 'Completed'
                        : encounter.status === 'active'
                          ? 'Active'
                          : 'Planning'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
