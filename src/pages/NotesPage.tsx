import { supabase } from '@/lib/supabase'
import { Note } from '@/types/database'
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
import { useCallback, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

type NoteCategory = 'plot' | 'npc' | 'location' | 'loot' | 'rules' | 'other'

const CATEGORIES: { value: NoteCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'plot', label: 'Lore', icon: <Scroll className="w-4 h-4" /> },
  { value: 'npc', label: 'NPCs', icon: <Users className="w-4 h-4" /> },
  { value: 'location', label: 'Locations', icon: <MapPin className="w-4 h-4" /> },
  { value: 'loot', label: 'Items', icon: <Wand2 className="w-4 h-4" /> },
  { value: 'rules', label: 'Rules', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'other', label: 'General', icon: <Tag className="w-4 h-4" /> },
]

export default function NotesPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory | 'all'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'recent' | 'pinned' | 'alphabetical'>('recent')
  const [showNewNoteModal, setShowNewNoteModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const autoSaveTimer = useRef<NodeJS.Timeout>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'other' as NoteCategory,
    tags: '' as string,
    pinned: false,
  })

  // Fetch all notes
  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ['notes', campaignId],
    queryFn: async () => {
      if (!campaignId) return []
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data as Note[]
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
        !note.content.toLowerCase().includes(searchQuery.toLowerCase())
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
        if (a.pinned === b.pinned) {
          return (
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
          )
        }
        return (a.pinned ? -1 : 1) || (b.pinned ? 1 : -1)
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
            pinned: noteData.pinned,
          },
        ])
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', campaignId] })
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
        .update(noteData)
        .eq('id', editingNote.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', campaignId] })
      setIsSaving(false)
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
      queryClient.invalidateQueries({ queryKey: ['notes', campaignId] })
      setEditingNote(null)
    },
  })

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'other',
      tags: '',
      pinned: false,
    })
  }

  const handleOpenNewNote = () => {
    setEditingNote(null)
    resetForm()
    setShowNewNoteModal(true)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags?.join(', ') || '',
      pinned: note.pinned || false,
    })
    setShowNewNoteModal(true)
  }

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) return

    if (editingNote) {
      updateNoteMutation.mutate({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
        pinned: formData.pinned,
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

      setIsSaving(true)
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
      pinned: !note.pinned,
    })
  }

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Delete this note? This cannot be undone.')) {
      deleteNoteMutation.mutate(noteId)
    }
  }

  const getCategoryIcon = (category: NoteCategory) => {
    return CATEGORIES.find((c) => c.value === category)?.icon
  }

  const getCategoryLabel = (category: NoteCategory) => {
    return CATEGORIES.find((c) => c.value === category)?.label
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-lg bg-red-900/20 border border-red-500/50 p-4 text-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error loading notes</p>
              <p className="text-sm">{String(error)}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-linear-to-r from-slate-900 to-slate-800 border-b border-amber-500/20 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-stone-100 flex items-center gap-3">
                <Scroll className="w-10 h-10 text-amber-400" />
                DM Notes
              </h1>
              <p className="text-stone-400 mt-2">
                {notes.length} note{notes.length !== 1 ? 's' : ''} total
              </p>
            </div>
            <button
              onClick={handleOpenNewNote}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-amber-600/50"
            >
              <Plus className="w-5 h-5" />
              New Note
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-stone-500" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs and Controls */}
      <div className="bg-slate-900/50 border-b border-slate-800 sticky top-24 z-10">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${selectedCategory === 'all'
                    ? 'bg-amber-600 text-slate-950'
                    : 'bg-slate-800 text-stone-300 hover:bg-slate-700'
                  }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${selectedCategory === cat.value
                      ? 'bg-amber-600 text-slate-950'
                      : 'bg-slate-800 text-stone-300 hover:bg-slate-700'
                    }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort Control */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-stone-200 rounded-lg focus:outline-none focus:border-amber-500 text-sm"
            >
              <option value="recent">Recently Updated</option>
              <option value="pinned">Pinned First</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-stone-400 text-sm">Tags:</span>
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
                      ? 'bg-amber-600 text-slate-950'
                      : 'bg-slate-800 text-stone-300 hover:bg-slate-700'
                    }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-stone-400 hover:text-stone-200 text-xs ml-2"
                >
                  Clear filters
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
              <Scroll className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-stone-400 mt-4">Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/30 rounded-lg border border-slate-800 p-12">
            <BookOpen className="w-16 h-16 text-amber-400/50 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-stone-300 mb-2">
              {notes.length === 0 ? 'No Notes Yet' : 'No Notes Match'}
            </h3>
            <p className="text-stone-400 mb-6">
              {notes.length === 0
                ? 'Create your first note to track campaign details!'
                : 'Try adjusting your filters or search.'}
            </p>
            {notes.length === 0 && (
              <button
                onClick={handleOpenNewNote}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold py-3 px-6 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Your First Note
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="group bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-lg overflow-hidden transition-all hover:shadow-lg hover:shadow-amber-600/20"
              >
                {/* Card Header */}
                <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber-400">
                        {getCategoryIcon(note.category)}
                      </span>
                      <span className="text-xs font-semibold text-stone-400 uppercase">
                        {getCategoryLabel(note.category)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-stone-100 group-hover:text-amber-400 transition-colors line-clamp-2">
                      {note.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleTogglePinned(note)}
                    className={`ml-2 transition-colors ${note.pinned
                        ? 'text-amber-400'
                        : 'text-slate-400 hover:text-amber-400'
                      }`}
                  >
                    <Pin className="w-5 h-5" />
                  </button>
                </div>

                {/* Card Body */}
                <div className="px-6 py-4">
                  {note.content && (
                    <p className="text-stone-400 text-sm line-clamp-3 mb-3">
                      {note.content}
                    </p>
                  )}

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-slate-800 text-amber-400/70 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 text-stone-500 text-xs">
                    <Clock className="w-3 h-3" />
                    {new Date(note.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-slate-800/50 px-6 py-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleEditNote(note)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-stone-200 font-semibold py-2 rounded transition-colors text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note Editor Modal */}
      {showNewNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-amber-500/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-amber-500/20 px-8 py-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-stone-100">
                {editingNote ? 'Edit Note' : 'New Note'}
              </h2>
              {isSaving && (
                <div className="flex items-center gap-2 text-amber-400 text-sm">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  Saving...
                </div>
              )}
              <button
                onClick={() => {
                  setShowNewNoteModal(false)
                  if (!editingNote) resetForm()
                }}
                className="text-slate-400 hover:text-stone-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSaveNote} className="px-8 py-6 space-y-6">
              <div>
                <label className="block text-stone-300 font-semibold mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    if (editingNote) {
                      handleAutoSaveNote('title', e.target.value)
                    } else {
                      setFormData({ ...formData, title: e.target.value })
                    }
                  }}
                  placeholder="Note title"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-2">
                  Category
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-2">
                  Content
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
                  placeholder="Your note content (markdown supported)"
                  rows={8}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-2">
                  Tags (comma-separated)
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
                  placeholder="e.g., important, villain, quest"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
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
                  className="w-4 h-4 rounded bg-slate-800 border border-slate-700 cursor-pointer accent-amber-500"
                />
                <label htmlFor="pinned-checkbox" className="text-stone-300">
                  Pin this note (appears at top)
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  type="submit"
                  disabled={
                    createNoteMutation.isPending ||
                    updateNoteMutation.isPending
                  }
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {createNoteMutation.isPending || updateNoteMutation.isPending
                    ? 'Saving...'
                    : editingNote
                      ? 'Update Note'
                      : 'Create Note'}
                </button>

                {editingNote && (
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(editingNote.id)}
                    disabled={deleteNoteMutation.isPending}
                    className="px-6 bg-red-900/20 hover:bg-red-900/40 text-red-400 font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowNewNoteModal(false)
                    if (!editingNote) resetForm()
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-stone-200 font-bold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
