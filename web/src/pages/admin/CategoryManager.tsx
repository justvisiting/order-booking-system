import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Textarea } from '../../components/Textarea'
import { Modal } from '../../components/Modal'
import { Loading } from '../../components/Loading'
import { EmptyState } from '../../components/EmptyState'
import { toast } from '../../components/Toast'
import type { Category } from '../../types'

interface CategoryFormData {
  name: string
  description: string
}

const emptyForm: CategoryFormData = { name: '', description: '' }

export function CategoryManager() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryFormData>(emptyForm)

  // Derive categories from products since there's no direct GET categories endpoint
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const products = await apiClient.getProducts()
      const catMap = new Map<string, { id: string; name: string }>()
      products.forEach((p) => {
        if (p.category_id && p.category_name) {
          catMap.set(p.category_id, { id: p.category_id, name: p.category_name })
        }
      })
      return Array.from(catMap.values()) as Pick<Category, 'id' | 'name'>[]
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      apiClient.createCategory({ name: data.name, description: data.description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setModalOpen(false)
      setForm(emptyForm)
      toast('success', 'Category created')
    },
    onError: (err) => toast('error', err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      apiClient.updateCategory(id, { name: data.name, description: data.description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setModalOpen(false)
      setEditingId(null)
      setForm(emptyForm)
      toast('success', 'Category updated')
    },
    onError: (err) => toast('error', err.message),
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (cat: Pick<Category, 'id' | 'name'>) => {
    setEditingId(cat.id)
    setForm({ name: cat.name, description: '' })
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast('error', 'Name is required')
      return
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  if (isLoading) return <Loading message="Loading categories..." />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Button onClick={openCreate}>Add Category</Button>
      </div>

      {!categories || categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create your first category to organize products."
          action={<Button onClick={openCreate}>Add Category</Button>}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {cat.name}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Category name"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Optional description"
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
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
