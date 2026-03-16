import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { useAuthStore } from '../stores/authStore'
import type { LoginRequest } from '../types'

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: (credentials: LoginRequest) => apiClient.login(credentials),
    onSuccess: (data) => {
      setAuth(data.token, data.user)
    },
  })
}

export function useAuth() {
  const store = useAuthStore()
  return {
    token: store.token,
    user: store.user,
    isAuthenticated: store.isAuthenticated(),
    isAdmin: store.isAdmin(),
    logout: store.logout,
  }
}
