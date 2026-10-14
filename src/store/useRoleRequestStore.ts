import { create } from 'zustand'
import { googleSheetsDb } from '../lib/googleSheetsDb'
import { useAuthStore } from './useAuthStore'
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

export const useRoleRequestStore = create<RoleRequestState>()((set, get) => ({
  myRequest: null,
  allRequests: [],
  loading: false,

  fetchMyRequest: async () => {
    set({ loading: true })
    try {
      const user = useAuthStore.getState().user
      if (!user) {
        set({ myRequest: null, loading: false })
        return
      }

      const req = await googleSheetsDb.getMyRoleRequest(user.id)
      set({ myRequest: req, loading: false })
    } catch (err) {
      console.error('Fetch my request error:', err)
      set({ loading: false })
    }
  },

  submitRequest: async () => {
    set({ loading: true })
    try {
      const user = useAuthStore.getState().user
      if (!user) {
        set({ loading: false })
        return { error: 'Foydalanuvchi tizimga kirmagan' }
      }

      const res = await googleSheetsDb.submitRoleRequest(user.id)
      if (!res.success) {
        set({ loading: false })
        return { error: res.error || 'So\'rov yuborishda xatolik yuz berdi' }
      }

      const newRequest: RoleRequest = {
        id: (res.data as any)?.id || 'req_' + Date.now(),
        user_id: user.id,
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      set({ myRequest: newRequest, loading: false })
      return { error: null }
    } catch (err) {
      set({ loading: false })
      return { error: err instanceof Error ? err.message : 'So\'rov yuborishda xatolik yuz berdi' }
    }
  },

  fetchAllRequests: async () => {
    set({ loading: true })
    try {
      const requests = await googleSheetsDb.getRoleRequests()
      set({ allRequests: requests, loading: false })
    } catch (err) {
      console.error('Fetch all requests error:', err)
      set({ loading: false })
    }
  },

  reviewRequest: async (requestId, approved) => {
    set({ loading: true })
    try {
      const user = useAuthStore.getState().user
      const res = await googleSheetsDb.reviewRoleRequest(requestId, approved, user?.id || '')

      if (!res.success) {
        set({ loading: false })
        return { error: res.error || 'So\'rovni ko\'rib chiqishda xatolik yuz berdi' }
      }

      await get().fetchAllRequests()
      return { error: null }
    } catch (err) {
      set({ loading: false })
      return { error: err instanceof Error ? err.message : 'Xatolik yuz berdi' }
    }
  },
}))
