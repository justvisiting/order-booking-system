import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OrderForm } from '../pages/customer/OrderForm'
import { useCartStore } from '../stores/cartStore'
import type { Product } from '../types'

const mockProduct: Product = {
  id: 'p1',
  name: 'Test Product',
  description: 'desc',
  price: 100,
  category_id: 'c1',
  unit: 'piece',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

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

describe('OrderForm', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
    useCartStore.getState().addItem(mockProduct, 2)
  })

  it('renders form fields', () => {
    render(<OrderForm />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/pincode/i)).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup()
    render(<OrderForm />, { wrapper: Wrapper })

    await user.click(screen.getByRole('button', { name: /review order/i }))

    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/phone is required/i)).toBeInTheDocument()
    expect(screen.getByText(/address is required/i)).toBeInTheDocument()
  })

  it('validates phone number format', async () => {
    const user = userEvent.setup()
    render(<OrderForm />, { wrapper: Wrapper })

    const phoneInput = screen.getByLabelText(/phone number/i)
    await user.type(phoneInput, '12345')
    await user.click(screen.getByRole('button', { name: /review order/i }))

    expect(screen.getByText(/valid 10-digit/i)).toBeInTheDocument()
  })

  it('validates pincode format', async () => {
    const user = userEvent.setup()
    render(<OrderForm />, { wrapper: Wrapper })

    await user.type(screen.getByLabelText(/full name/i), 'John')
    await user.type(screen.getByLabelText(/phone number/i), '1234567890')
    await user.type(screen.getByLabelText(/address/i), '123 St')
    await user.type(screen.getByLabelText(/city/i), 'Mumbai')
    await user.type(screen.getByLabelText(/state/i), 'MH')
    await user.type(screen.getByLabelText(/pincode/i), '123')
    await user.click(screen.getByRole('button', { name: /review order/i }))

    expect(screen.getByText(/valid 6-digit/i)).toBeInTheDocument()
  })

  it('displays cart total', () => {
    render(<OrderForm />, { wrapper: Wrapper })
    // 2 items * 100 = 200
    expect(screen.getByText(/₹200/)).toBeInTheDocument()
  })
})
