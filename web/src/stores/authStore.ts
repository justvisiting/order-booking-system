import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: localStorage.getItem('auth_token'),
  user: (() => {
    try {
      const u = localStorage.getItem('auth_user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })(),

  setAuth: (token: string, user: User) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    set({ token: null, user: null })
  },

  isAuthenticated: () => !!get().token,

  isAdmin: () => get().user?.role === 'admin',
}))
