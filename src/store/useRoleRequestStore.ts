import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { RoleRequest, RoleRequestWithProfile } from '../types/roleRequest'

interface RoleRequestState {
  myRequest: RoleRequest | null
  allRequests: RoleRequestWithProfile[]
  loading: boolean

  fetchMyRequest: () => Promise<void>
  submitRequest: () => Promise<{ error: string | null }>
  fetchAllRequests: () => Promise<void>
  reviewRequest: (requestId: string, approved: boolean) => Promise<{ error: string | null }>
}

export const useRoleRequestStore = create<RoleRequestState>()((set) => ({
  myRequest: null,
  allRequests: [],
  loading: false,

  fetchMyRequest: async () => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ myRequest: null, loading: false })
        return
      }

      const { data, error } = await supabase
        .from('role_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Fetch my request error:', error)
        set({ loading: false })
        return
      }

      set({ myRequest: data as RoleRequest | null, loading: false })
    } catch (err) {
      console.error('Fetch my request error:', err)
      set({ loading: false })
    }
  },

  submitRequest: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.rpc('submit_role_request')

      if (error) {
        set({ loading: false })
        return { error: error.message }
      }

      // After successful submission, set the new request locally
      const newRequest: RoleRequest = {
        id: data as string,
        user_id: '',
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Fetch the actual request to get complete data
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        newRequest.user_id = user.id
      }

      set({ myRequest: newRequest, loading: false })
      return { error: null }
    } catch (err) {
      set({ loading: false })
      return { error: err instanceof Error ? err.message : 'Xatolik yuz berdi' }
    }
  },

  fetchAllRequests: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('role_requests')
        .select('*, profiles:user_id(full_name, group_name, avatar_emoji)')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch all requests error:', error)
        set({ loading: false })
        return
      }

      set({ allRequests: (data || []) as RoleRequestWithProfile[], loading: false })
    } catch (err) {
      console.error('Fetch all requests error:', err)
      set({ loading: false })
    }
  },

  reviewRequest: async (requestId: string, approved: boolean) => {
    set({ loading: true })
    try {
      const { error } = await supabase.rpc('review_role_request', {
        p_request_id: requestId,
        p_approved: approved,
      })

      if (error) {
        set({ loading: false })
        return { error: error.message }
      }

      // Update local state: change the reviewed request's status
      set((state) => ({
        allRequests: state.allRequests.map((req) =>
          req.id === requestId
            ? { ...req, status: approved ? 'approved' : 'rejected' as const }
            : req
        ),
        loading: false,
      }))

      return { error: null }
    } catch (err) {
      set({ loading: false })
      return { error: err instanceof Error ? err.message : 'Xatolik yuz berdi' }
    }
  },
}))
