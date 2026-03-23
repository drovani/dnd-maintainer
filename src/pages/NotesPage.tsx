import { supabase } from '@/lib/supabase'
import { Note } from '@/types/database'
import type { TablesUpdate } from '@/types/supabase'
import { NOTE_DETAIL_COLS } from '@/lib/query-columns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  BookOpen,
  Clock,
  MapPin,
  Pin,
  Plus,
  Save,
  Scroll,
  Search,
  Tag,
  Trash2,
  Users,
  Wand2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ValidationError } from '@/components/ui/validation-error'

type NoteCategory = 'lore' | 'npc' | 'location' | 'quest' | 'item' | 'general'

const CATEGORIES: { value: NoteCategory; icon: React.ReactNode }[] = [
  { value: 'lore', icon: <Scroll className="size-4" /> },
  { value: 'npc', icon: <Users className="size-4" /> },
  { value: 'location', icon: <MapPin className="size-4" /> },
  { value: 'item', icon: <Wand2 className="size-4" /> },
  { value: 'quest', icon: <BookOpen className="size-4" /> },
  { value: 'general', icon: <Tag className="size-4" /> },
]

export default function NotesPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { t } = useTranslation('common')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory | 'all'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'recent' | 'pinned' | 'alphabetical'>('recent')
  const [showNewNoteModal, setShowNewNoteModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
  const autoSaveTimer = useRef<NodeJS.Timeout>(null)
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [])
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle')

  const [titleError, setTitleError] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general' as NoteCategory,
    tags: '' as string,
    pinned: false,
  })

  // Fetch all notes (needs content for search)
  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ['notes', campaignId, 'full'],
    queryFn: async () => {
      if (!campaignId) return []
      const { data, error } = await supabase
        .from('notes')
        .select(NOTE_DETAIL_COLS)
        .eq('campaign_id', campaignId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data as unknown as Note[]
    },
    enabled: !!campaignId,
  })

  // Extract unique tags
  const allTags = [...new Set(notes.flatMap((note) => note.tags || []))]

  // Filter and sort notes
  const filteredNotes = notes
    .filter((note) => {
      if (selectedCategory !== 'all' && note.category !== selectedCategory) {
        return false
      }

      if (
        searchQuery &&
        !note.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !note.content?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      if (
        selectedTags.length > 0 &&
        !selectedTags.some((tag) => note.tags?.includes(tag))
      ) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      if (sortBy === 'pinned') {
        if (a.is_pinned === b.is_pinned) {
          return (
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
          )
        }
        return (a.is_pinned ? -1 : 1) || (b.is_pinned ? 1 : -1)
      } else if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title)
      }
      // 'recent' is already sorted by updated_at
      return 0
    })

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: typeof formData) => {
      if (!campaignId) throw new Error('Campaign ID is required')

      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            campaign_id: campaignId,
            title: noteData.title,
            content: noteData.content,
            category: noteData.category,
            tags: noteData.tags
              .split(',')
              .map((t) => t.trim())
              .filter((t) => t),
            is_pinned: noteData.pinned,
          },
        ])
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', campaignId, 'full'] })
      setShowNewNoteModal(false)
      resetForm()
    },
  })

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async (noteData: Partial<Note>) => {
      if (!editingNote) throw new Error('No note selected')

      const { error } = await supabase
        .from('notes')
        .update(noteData as unknown as TablesUpdate<'notes'>)
        .eq('id', editingNote.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', campaignId, 'full'] })
      setSaveStatus('idle')
    },
    onError: () => {
      setSaveStatus('error')
    },
  })

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', campaignId, 'full'] })
      setEditingNote(null)
    },
  })

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general',
      tags: '',
      pinned: false,
    })
  }

  const handleOpenNewNote = () => {
    setEditingNote(null)
    resetForm()
    setSaveStatus('idle')
    setTitleError('')
    setShowNewNoteModal(true)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setFormData({
      title: note.title,
      content: note.content ?? '',
      category: note.category ?? 'general',
      tags: note.tags?.join(', ') || '',
      pinned: note.is_pinned || false,
    })
    setSaveStatus('idle')
    setTitleError('')
    setShowNewNoteModal(true)
  }

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setTitleError(t('validation.titleRequired'))
      return
    }

    if (editingNote) {
      updateNoteMutation.mutate({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
        is_pinned: formData.pinned,
      })
      setShowNewNoteModal(false)
    } else {
      createNoteMutation.mutate(formData)
    }
  }

  const handleAutoSaveNote = useCallback(
    (field: string, value: unknown) => {
      const updated = { ...formData, [field]: value }
      setFormData(updated)

      if (!editingNote) return

      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }

      setSaveStatus('saving')
      autoSaveTimer.current = setTimeout(() => {
        updateNoteMutation.mutate({
          [field]: value,
        })
      }, 1000)
    },
    [formData, editingNote, updateNoteMutation]
  )

  const handleTogglePinned = (note: Note) => {
    updateNoteMutation.mutate({
      id: note.id,
      is_pinned: !note.is_pinned,
    })
  }

  const handleDeleteNote = (noteId: string) => {
    setDeletingNoteId(noteId)
  }

  const handleConfirmDeleteNote = () => {
    if (!deletingNoteId) return
    deleteNoteMutation.mutate(deletingNoteId, {
      onSettled: () => setDeletingNoteId(null),
    })
  }

  const getCategoryIcon = (category: NoteCategory) => {
    return CATEGORIES.find((c) => c.value === category)?.icon
  }

  const getCategoryLabel = (category: NoteCategory) => {
    return t(`notes.categories.${category}`)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-destructive flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{t('notes.errors.loading')}</p>
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
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
                <Scroll className="size-10 text-primary" />
                {t('notes.title')}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t('notes.noteCount', { count: notes.length })}
              </p>
            </div>
            <button
              onClick={handleOpenNewNote}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-md"
            >
              <Plus className="size-5" />
              {t('buttons.newNote')}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 size-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('notes.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs and Controls */}
      <div className="bg-muted/50 border-b border-border sticky top-24 z-10">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted'
                  }`}
              >
                {t('notes.all')}
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${selectedCategory === cat.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted'
                    }`}
                >
                  {cat.icon}
                  {t(`notes.categories.${cat.value}`)}
                </button>
              ))}
            </div>

            {/* Sort Control */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 bg-muted border border-border text-foreground rounded-lg outline-none focus:border-ring text-sm"
            >
              <option value="recent">{t('notes.sort.recent')}</option>
              <option value="pinned">{t('notes.sort.pinned')}</option>
              <option value="alphabetical">{t('notes.sort.alphabetical')}</option>
            </select>
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground text-sm">{t('notes.tags')}</span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter((t) => t !== tag))
                    } else {
                      setSelectedTags([...selectedTags, tag])
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${selectedTags.includes(tag)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted'
                    }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-muted-foreground hover:text-foreground text-xs ml-2"
                >
                  {t('buttons.clearFilters')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <Scroll className="size-8 text-primary" />
            </div>
            <p className="text-muted-foreground mt-4">{t('notes.loading')}</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-24 bg-card/50 rounded-lg border border-border p-12">
            <BookOpen className="size-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {notes.length === 0 ? t('notes.noNotesYet') : t('notes.noNotesMatch')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {notes.length === 0
                ? t('notes.noNotesDescription')
                : t('notes.noNotesMatchDescription')}
            </p>
            {notes.length === 0 && (
              <button
                onClick={handleOpenNewNote}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg transition-colors"
              >
                <Plus className="size-5" />
                {t('buttons.createYourFirstNote')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="group bg-card border border-border hover:border-ring rounded-lg overflow-hidden transition-all hover:shadow-md"
              >
                {/* Card Header */}
                <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-primary">
                        {note.category && getCategoryIcon(note.category)}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        {note.category ? getCategoryLabel(note.category) : t('notes.uncategorized')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {note.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleTogglePinned(note)}
                    className={`ml-2 transition-colors ${note.is_pinned
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-primary'
                      }`}
                  >
                    <Pin className="size-5" />
                  </button>
                </div>

                {/* Card Body */}
                <div className="px-6 py-4">
                  {note.content && (
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
                      {note.content}
                    </p>
                  )}

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Clock className="size-3" />
                    {new Date(note.updated_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-muted/50 px-6 py-3 border-t border-border flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleEditNote(note)}
                    className="flex-1 bg-muted hover:bg-accent text-foreground font-semibold py-2 rounded transition-colors text-sm"
                  >
                    {t('buttons.edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Note Confirmation Dialog */}
      <Dialog open={deletingNoteId !== null} onOpenChange={(open) => { if (!open) setDeletingNoteId(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('notes.confirmDeleteNoteTitle')}</DialogTitle>
            <DialogDescription>{t('notes.confirmDeleteNote')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingNoteId(null)}
            >
              {t('buttons.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteNote}
              pending={deleteNoteMutation.isPending}
            >
              {t('buttons.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Editor Modal */}
      {showNewNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border px-8 py-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {editingNote ? t('notes.editNote') : t('notes.newNote')}
              </h2>
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-2 text-primary text-sm">
                  <div className="size-2 bg-amber-400 rounded-full animate-pulse" />
                  {t('buttons.saving')}
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="size-4 shrink-0" />
                  {t('errors.saveFailed')}
                </div>
              )}
              <button
                onClick={() => {
                  setShowNewNoteModal(false)
                  setTitleError('')
                  if (!editingNote) resetForm()
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSaveNote} className="px-8 py-6 space-y-6">
              <div>
                <label className="block text-foreground font-semibold mb-2">
                  {t('notes.fields.titleRequired')}
                </label>
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setTitleError('')
                      if (editingNote) {
                        handleAutoSaveNote('title', e.target.value)
                      } else {
                        setFormData({ ...formData, title: e.target.value })
                      }
                    }}
                    placeholder={t('notes.placeholders.noteTitle')}
                    className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    autoFocus
                  />
                  <ValidationError message={titleError} />
                </div>
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-2">
                  {t('notes.fields.category')}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const value = e.target.value as NoteCategory
                    if (editingNote) {
                      handleAutoSaveNote('category', value)
                    } else {
                      setFormData({ ...formData, category: value })
                    }
                  }}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {t(`notes.categories.${cat.value}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-2">
                  {t('notes.fields.content')}
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => {
                    if (editingNote) {
                      handleAutoSaveNote('content', e.target.value)
                    } else {
                      setFormData({ ...formData, content: e.target.value })
                    }
                  }}
                  placeholder={t('notes.placeholders.noteContent')}
                  rows={8}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-2">
                  {t('notes.fields.tagsCommaSeparated')}
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => {
                    if (editingNote) {
                      handleAutoSaveNote(
                        'tags',
                        e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter((t) => t)
                      )
                    } else {
                      setFormData({ ...formData, tags: e.target.value })
                    }
                  }}
                  placeholder={t('notes.placeholders.tags')}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinned-checkbox"
                  checked={formData.pinned}
                  onChange={(e) => {
                    if (editingNote) {
                      handleAutoSaveNote('pinned', e.target.checked)
                    } else {
                      setFormData({ ...formData, pinned: e.target.checked })
                    }
                  }}
                  className="size-4 rounded bg-muted border border-border cursor-pointer accent-primary"
                />
                <label htmlFor="pinned-checkbox" className="text-foreground">
                  {t('notes.fields.pinNote')}
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  type="submit"
                  className="flex-1"
                  pending={createNoteMutation.isPending || updateNoteMutation.isPending}
                >
                  <Save className="size-4" />
                  {createNoteMutation.isPending || updateNoteMutation.isPending
                    ? t('buttons.saving')
                    : editingNote
                      ? t('buttons.updateNote')
                      : t('buttons.createNote')}
                </Button>

                {editingNote && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDeleteNote(editingNote.id)}
                    pending={deleteNoteMutation.isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowNewNoteModal(false)
                    setTitleError('')
                    if (!editingNote) resetForm()
                  }}
                >
                  {t('buttons.cancel')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
