import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Select } from '../../components/Select'
import { Modal } from '../../components/Modal'
import { toast } from '../../components/Toast'

interface UserFormData {
  username: string
  password: string
  role: 'admin' | 'staff'
}

const emptyForm: UserFormData = { username: '', password: '', role: 'staff' }

const roleOptions = [
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
]

export function UserManager() {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<UserFormData>(emptyForm)
  const [createdUsers, setCreatedUsers] = useState<
    { username: string; role: string }[]
  >([])

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => apiClient.createUser(data),
    onSuccess: (user) => {
      setCreatedUsers((prev) => [
        { username: user.username, role: user.role },
        ...prev,
      ])
      setModalOpen(false)
      setForm(emptyForm)
      toast('success', `User "${user.username}" created`)
    },
    onError: (err) => toast('error', err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username.trim()) {
      toast('error', 'Username is required')
      return
    }
    if (!form.password || form.password.length < 6) {
      toast('error', 'Password must be at least 6 characters')
      return
    }
    createMutation.mutate(form)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Button onClick={() => setModalOpen(true)}>Add User</Button>
      </div>

      {createdUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h2 className="text-sm font-medium text-gray-600">
              Recently Created Users
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Username</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {createdUsers.map((user, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-sm text-gray-500">
          Create staff or admin accounts for your team. Staff accounts can access
          the order dashboard. Admin accounts can additionally manage products,
          categories, and users.
        </p>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add User"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            value={form.username}
            onChange={(e) =>
              setForm((f) => ({ ...f, username: e.target.value }))
            }
            placeholder="Enter username"
            autoComplete="off"
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            placeholder="Minimum 6 characters"
            autoComplete="new-password"
          />
          <Select
            label="Role"
            options={roleOptions}
            value={form.role}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                role: e.target.value as 'admin' | 'staff',
              }))
            }
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createMutation.isPending}
            >
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
