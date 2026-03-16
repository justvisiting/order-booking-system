import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Login } from '../pages/dashboard/Login'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuthStore } from '../stores/authStore'

vi.mock('../api/client', () => ({
  apiClient: {
    login: vi.fn().mockResolvedValue({
      token: 'test-jwt-token',
      user: { id: 'u1', username: 'admin', role: 'admin', created_at: '2024-01-01T00:00:00Z' },
    }),
    getWebSocketUrl: vi.fn().mockReturnValue('ws://localhost/ws'),
  },
  ApiClientError: class extends Error {
    status: number
    constructor(msg: string, status: number) {
      super(msg)
      this.status = status
    }
  },
}))

function TestWrapper({
  children,
  initialEntries = ['/'],
}: {
  children: React.ReactNode
  initialEntries?: string[]
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Auth Flow', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().logout()
  })

  it('renders login form', () => {
    render(
      <TestWrapper initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </TestWrapper>
    )

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('shows error when submitting empty form', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: /login/i }))
    expect(
      screen.getByText(/username and password are required/i)
    ).toBeInTheDocument()
  })

  it('redirects unauthenticated users to login', () => {
    render(
      <TestWrapper initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </TestWrapper>
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('shows protected content when authenticated', () => {
    useAuthStore.getState().setAuth('token', {
      id: 'u1',
      username: 'admin',
      role: 'admin',
      created_at: '2024-01-01T00:00:00Z',
    })

    render(
      <TestWrapper initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </TestWrapper>
    )

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
  })

  it('redirects non-admin from admin routes', () => {
    useAuthStore.getState().setAuth('token', {
      id: 'u1',
      username: 'staff',
      role: 'staff',
      created_at: '2024-01-01T00:00:00Z',
    })

    render(
      <TestWrapper initialEntries={['/admin']}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <div>Admin Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </TestWrapper>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
