import { useState, useMemo } from 'react'
import { useProducts } from '../../hooks/useProducts'
import { useCartStore } from '../../stores/cartStore'
import { formatCurrency } from '../../utils/format'
import { Loading } from '../../components/Loading'
import { EmptyState } from '../../components/EmptyState'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
import { toast } from '../../components/Toast'
import type { Product } from '../../types'

export function ProductCatalog() {
  const { data: products, isLoading, error } = useProducts()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const addItem = useCartStore((s) => s.addItem)

  const categories = useMemo(() => {
    if (!products) return []
    const cats = new Set(products.map((p) => p.category_name || 'Uncategorized'))
    return Array.from(cats).sort()
  }, [products])

  const filtered = useMemo(() => {
    if (!products) return []
    return products.filter((p) => {
      if (!p.is_active) return false
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        !selectedCategory ||
        (p.category_name || 'Uncategorized') === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, search, selectedCategory])

  const handleAddToCart = (product: Product) => {
    addItem(product)
    toast('success', `${product.name} added to cart`)
  }

  if (isLoading) return <Loading message="Loading products..." />
  if (error) {
    return (
      <EmptyState
        title="Failed to load products"
        description="Please try again later."
      />
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Our Products</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            aria-label="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={!selectedCategory ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedCategory('')}
            aria-pressed={!selectedCategory}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={selectedCategory === cat}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 flex flex-col"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-neutral-900">{product.name}</h3>
                  <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">
                    {product.category_name || 'Uncategorized'}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 mb-3">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-neutral-900">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-xs text-neutral-500">per {product.unit}</span>
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() => handleAddToCart(product)}
              >
                Add to Cart
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
