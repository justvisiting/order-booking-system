import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Textarea } from '../../components/Textarea'
import { Select } from '../../components/Select'
import { Modal } from '../../components/Modal'
import { Loading } from '../../components/Loading'
import { EmptyState } from '../../components/EmptyState'
import { toast } from '../../components/Toast'
import { formatCurrency } from '../../utils/format'
import type { Product, Category } from '../../types'

interface ProductFormData {
  name: string
  description: string
  price: string
  category_id: string
  unit: string
  active: boolean
}

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  price: '',
  category_id: '',
  unit: 'piece',
  active: true,
}

export function ProductManager() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormData>(emptyForm)

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const products = await apiClient.getProducts()
      const catMap = new Map<string, string>()
      products.forEach((p) => {
        if (p.category_id && p.category_name) {
          catMap.set(p.category_id, p.category_name)
        }
      })
      return Array.from(catMap.entries()).map(([id, name]) => ({
        id,
        name,
      })) as Pick<Category, 'id' | 'name'>[]
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) =>
      apiClient.createProduct({
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        category_id: data.category_id ? parseInt(data.category_id, 10) : 0,
        unit: data.unit,
        is_active: data.active,
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setModalOpen(false)
      setForm(emptyForm)
      toast('success', 'Product created')
    },
    onError: (err) => toast('error', err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) =>
      apiClient.updateProduct(id, {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        category_id: data.category_id ? parseInt(data.category_id, 10) : 0,
        unit: data.unit,
        is_active: data.active,
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setModalOpen(false)
      setEditingId(null)
      setForm(emptyForm)
      toast('success', 'Product updated')
    },
    onError: (err) => toast('error', err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast('success', 'Product deleted')
    },
    onError: (err) => toast('error', err.message),
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      category_id: product.category_id,
      unit: product.unit,
      active: product.is_active,
    })
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price) {
      toast('error', 'Name and price are required')
      return
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) return <Loading message="Loading products..." />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Button onClick={openCreate}>Add Product</Button>
      </div>

      {!products || products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Create your first product to get started."
          action={<Button onClick={openCreate}>Add Product</Button>}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Active</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">
                          {product.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {product.category_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{product.unit}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          product.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
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
        title={editingId ? 'Edit Product' : 'Add Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Product name"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Product description"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
              placeholder="0.00"
            />
            <Input
              label="Unit"
              value={form.unit}
              onChange={(e) =>
                setForm((f) => ({ ...f, unit: e.target.value }))
              }
              placeholder="e.g. kg, piece, litre"
            />
          </div>
          {categories && categories.length > 0 && (
            <Select
              label="Category"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              value={form.category_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, category_id: e.target.value }))
              }
              placeholder="Select category"
            />
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
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
