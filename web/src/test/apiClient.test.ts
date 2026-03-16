import { describe, it, expect, beforeEach, vi } from 'vitest'
import { apiClient, ApiClientError } from '../api/client'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    localStorage.clear()
  })

  it('makes GET request with correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{ id: '1', name: 'Product 1' }]),
    })

    const result = await apiClient.getProducts()
    expect(result).toHaveLength(1)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/products'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('attaches auth token when present', async () => {
    localStorage.setItem('auth_token', 'test-token-123')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    })

    await apiClient.getProducts()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
      })
    )
  })

  it('makes POST request with body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({ id: '1', order_number: 'ORD-001' }),
    })

    const order = {
      customer_name: 'John',
      customer_phone: '1234567890',
      delivery_address: {
        address: '123 St',
        city: 'Mumbai',
        state: 'MH',
        pincode: '400001',
      },
      items: [{ product_id: 'p1', quantity: 2 }],
    }

    await apiClient.createOrder(order)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/orders'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(order),
      })
    )
  })

  it('throws ApiClientError on error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not found' }),
    })

    await expect(apiClient.getProduct('invalid')).rejects.toThrow(ApiClientError)
    await expect(
      (async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ message: 'Not found' }),
        })
        await apiClient.getProduct('invalid')
      })()
    ).rejects.toMatchObject({ status: 404 })
  })

  it('handles non-JSON error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    })

    await expect(apiClient.getProduct('x')).rejects.toThrow(
      'Request failed with status 500'
    )
  })

  it('builds query string for dashboard orders', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [], total: 0, page: 1, per_page: 20 }),
    })

    await apiClient.getDashboardOrders({
      status: 'pending',
      search: 'test',
      page: 2,
    })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('status=pending')
    expect(calledUrl).toContain('search=test')
    expect(calledUrl).toContain('page=2')
  })

  it('generates websocket URL', () => {
    const url = apiClient.getWebSocketUrl()
    expect(url).toContain('ws')
    expect(url).toContain('/api/v1/dashboard/ws')
  })

  it('includes token in websocket URL when authenticated', () => {
    localStorage.setItem('auth_token', 'ws-token')
    const url = apiClient.getWebSocketUrl()
    expect(url).toContain('token=ws-token')
  })
})
