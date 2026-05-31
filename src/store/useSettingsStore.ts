import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  soundEnabled: boolean
  notificationsEnabled: boolean
  animationsEnabled: boolean
  accentColor: string
  profileImage: string | null

  toggleSound: () => void
  toggleNotifications: () => void
  toggleAnimations: () => void
  setAccentColor: (color: string) => void
  setProfileImage: (image: string | null) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      notificationsEnabled: true,
      animationsEnabled: true,
      accentColor: '#00f0ff',
      profileImage: null,

      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleNotifications: () => set((s) => ({ notificationsEnabled: !s.notificationsEnabled })),
      toggleAnimations: () => set((s) => ({ animationsEnabled: !s.animationsEnabled })),
      setAccentColor: (color: string) => set({ accentColor: color }),
      setProfileImage: (image: string | null) => set({ profileImage: image }),
    }),
    {
      name: 'digitaledu-settings-store',
    }
  )
)
