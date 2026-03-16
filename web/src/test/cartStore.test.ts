import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../stores/cartStore'
import type { Product } from '../types'

const mockProduct: Product = {
  id: 'p1',
  name: 'Test Product',
  description: 'A test product',
  price: 100,
  category_id: 'c1',
  category_name: 'Test Category',
  unit: 'piece',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockProduct2: Product = {
  id: 'p2',
  name: 'Another Product',
  description: 'Another test product',
  price: 200,
  category_id: 'c1',
  category_name: 'Test Category',
  unit: 'kg',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('Cart Store', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
  })

  it('starts with empty cart', () => {
    expect(useCartStore.getState().items).toEqual([])
  })

  it('adds item to cart', () => {
    useCartStore.getState().addItem(mockProduct)
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].product.id).toBe('p1')
    expect(items[0].quantity).toBe(1)
  })

  it('increments quantity when adding same product', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct)
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('adds item with specified quantity', () => {
    useCartStore.getState().addItem(mockProduct, 5)
    expect(useCartStore.getState().items[0].quantity).toBe(5)
  })

  it('removes item from cart', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct2)
    useCartStore.getState().removeItem('p1')
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].product.id).toBe('p2')
  })

  it('updates quantity', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().updateQuantity('p1', 10)
    expect(useCartStore.getState().items[0].quantity).toBe(10)
  })

  it('removes item when quantity set to 0', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().updateQuantity('p1', 0)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('clears cart', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct2)
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('calculates total correctly', () => {
    useCartStore.getState().addItem(mockProduct, 2) // 100 * 2 = 200
    useCartStore.getState().addItem(mockProduct2, 3) // 200 * 3 = 600
    expect(useCartStore.getState().getTotal()).toBe(800)
  })

  it('calculates item count correctly', () => {
    useCartStore.getState().addItem(mockProduct, 2)
    useCartStore.getState().addItem(mockProduct2, 3)
    expect(useCartStore.getState().getItemCount()).toBe(5)
  })
})
