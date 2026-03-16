import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductCatalog } from '../pages/customer/ProductCatalog'
import { useCartStore } from '../stores/cartStore'

vi.mock('../api/client', () => ({
  apiClient: {
    getProducts: vi.fn().mockResolvedValue([
      {
        id: 'p1',
        name: 'Fresh Apples',
        description: 'Crispy red apples',
        price: 150,
        category_id: 'c1',
        category_name: 'Fruits',
        unit: 'kg',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'p2',
        name: 'Rice',
        description: 'Basmati rice',
        price: 80,
        category_id: 'c2',
        category_name: 'Grains',
        unit: 'kg',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]),
  },
  ApiClientError: class extends Error {
    status: number
    constructor(msg: string, status: number) {
      super(msg)
      this.status = status
    }
  },
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('ProductCatalog', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
  })

  it('renders products after loading', async () => {
    render(<ProductCatalog />, { wrapper: Wrapper })

    expect(await screen.findByText('Fresh Apples')).toBeInTheDocument()
    expect(screen.getByText('Rice')).toBeInTheDocument()
  })

  it('shows category filter buttons', async () => {
    render(<ProductCatalog />, { wrapper: Wrapper })
    await screen.findByText('Fresh Apples')

    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getAllByText('Fruits').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Grains').length).toBeGreaterThanOrEqual(1)
  })

  it('adds product to cart when clicking Add to Cart', async () => {
    const user = userEvent.setup()
    render(<ProductCatalog />, { wrapper: Wrapper })

    await screen.findByText('Fresh Apples')
    const addButtons = screen.getAllByRole('button', { name: /add to cart/i })
    await user.click(addButtons[0])

    const cartItems = useCartStore.getState().items
    expect(cartItems).toHaveLength(1)
    expect(cartItems[0].product.name).toBe('Fresh Apples')
  })

  it('filters products by search', async () => {
    const user = userEvent.setup()
    render(<ProductCatalog />, { wrapper: Wrapper })

    await screen.findByText('Fresh Apples')
    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'rice')

    expect(screen.queryByText('Fresh Apples')).not.toBeInTheDocument()
    expect(screen.getByText('Rice')).toBeInTheDocument()
  })
})
