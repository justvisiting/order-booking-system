import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogin, useAuth } from '../../hooks/useAuth'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
import { Navigate } from 'react-router-dom'

export function Login() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required')
      return
    }

    loginMutation.mutate(
      { username: username.trim(), password },
      {
        onSuccess: () => {
          navigate('/dashboard', { replace: true })
        },
        onError: (err) => {
          setError(err.message || 'Invalid credentials')
        },
      }
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
          Staff Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            autoComplete="username"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
          />

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={loginMutation.isPending}
          >
            Login
          </Button>
        </form>
      </div>
    </div>
  )
}
