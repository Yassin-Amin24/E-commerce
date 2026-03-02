import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSummary } from '../types'

interface AuthState {
  user: UserSummary | null
  token: string | null
  setAuth: (user: UserSummary, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auth-storage' }
  )
)