import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export type ContentType = 'material' | 'test' | 'practice'
export type ContentStatus = 'draft' | 'published'

export interface MultilingualQuestion {
  q: { uz: string; ru: string; en: string }
  options: { uz: string[]; ru: string[]; en: string[] }
  answer: number
}

export interface ContentPracticePhase {
  title: string
  duration: string
  durationMinutes: number
  description: string
  tools: string[]
}

export interface ContentPractice {
  objective?: string
  groupTask?: string
  phases?: ContentPracticePhase[]
}

export interface ContentItem {
  id: string
  content_type: ContentType
  title: string
  description: string
  body: string
  topic_id: number | null
  questions: MultilingualQuestion[]
  practice: ContentPractice
  status: ContentStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

interface ContentState {
  items: ContentItem[]
  loading: boolean
  fetchPublishedContent: () => Promise<ContentItem[]>
  fetchContentItem: (id: string) => Promise<ContentItem | null>
}

export const useContentStore = create<ContentState>()((set, get) => ({
  items: [],
  loading: false,

  fetchPublishedContent: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Content fetch error:', error)
      set({ loading: false })
      return get().items
    }

    const items = (data || []) as ContentItem[]
    set({ items, loading: false })
    return items
  },

  fetchContentItem: async (id) => {
    const cached = get().items.find((item) => item.id === id)
    if (cached) return cached

    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Content item fetch error:', error)
      return null
    }

    return (data as ContentItem | null) || null
  },
}))
