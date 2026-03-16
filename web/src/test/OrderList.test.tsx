import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OrderList } from '../pages/dashboard/OrderList'

vi.mock('../api/client', () => ({
  apiClient: {
    getDashboardOrders: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'o1',
          order_number: 'ORD-001',
          customer_name: 'John Doe',
          customer_phone: '9876543210',
          delivery_address: {
            address: '123 St',
            city: 'Mumbai',
            state: 'MH',
            pincode: '400001',
          },
          items: [
            {
              product_id: 'p1',
              product_name: 'Apples',
              quantity: 2,
              unit_price: 150,
              total_price: 300,
            },
          ],
          total_amount: 300,
          status: 'pending',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 'o2',
          order_number: 'ORD-002',
          customer_name: 'Jane Smith',
          customer_phone: '9876543211',
          delivery_address: {
            address: '456 Ave',
            city: 'Delhi',
            state: 'DL',
            pincode: '110001',
          },
          items: [
            {
              product_id: 'p2',
              product_name: 'Rice',
              quantity: 5,
              unit_price: 80,
              total_price: 400,
            },
          ],
          total_amount: 400,
          status: 'confirmed',
          created_at: '2024-01-15T11:00:00Z',
          updated_at: '2024-01-15T11:00:00Z',
        },
      ],
      total: 2,
      page: 1,
      per_page: 20,
    }),
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

describe('OrderList', () => {
  it('renders orders table with data', async () => {
    render(<OrderList />, { wrapper: Wrapper })

    expect(await screen.findByText('ORD-001')).toBeInTheDocument()
    expect(screen.getByText('ORD-002')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('shows status badges', async () => {
    render(<OrderList />, { wrapper: Wrapper })

    await screen.findByText('ORD-001')
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThanOrEqual(1)
  })

  it('renders filter controls', async () => {
    render(<OrderList />, { wrapper: Wrapper })

    await screen.findByText('ORD-001')
    expect(
      screen.getByPlaceholderText(/search by order/i)
    ).toBeInTheDocument()
    expect(screen.getByText('All Statuses')).toBeInTheDocument()
  })
})
