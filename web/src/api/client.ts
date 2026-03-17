import type {
  Product,
  Category,
  Order,
  CreateOrderRequest,
  LoginRequest,
  LoginResponse,
  PaginatedResponse,
  DashboardOrderFilters,
  ApiError,
  Customer,
  CreateUserRequest,
  User,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || ''

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      let error: ApiError
      try {
        error = await response.json()
      } catch {
        error = { message: `Request failed with status ${response.status}` }
      }
      throw new ApiClientError(error.message, response.status, error.code)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  // Products (public)
  async getProducts(): Promise<Product[]> {
    const res = await this.request<{ products: Product[] }>('/api/v1/products')
    return res.products
  }

  async getProduct(id: string): Promise<Product> {
    return this.request<Product>(`/api/v1/products/${id}`)
  }

  // Orders (public)
  async createOrder(order: CreateOrderRequest): Promise<Order> {
    // Transform frontend shape to backend's PlaceOrderRequest shape
    const backendRequest = {
      customer: {
        name: order.customer_name,
        phone: order.customer_phone,
        address: order.delivery_address
          ? `${order.delivery_address.address}, ${order.delivery_address.city}, ${order.delivery_address.state} - ${order.delivery_address.pincode}`
          : '',
      },
      delivery_address: order.delivery_address,
      items: order.items.map((item) => ({
        product_id: typeof item.product_id === 'string' ? parseInt(item.product_id, 10) : item.product_id,
        quantity: item.quantity,
      })),
      notes: order.notes || '',
    }
    return this.request<Order>('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify(backendRequest),
    })
  }

  async getOrder(id: string, phone: string): Promise<Order> {
    return this.request<Order>(`/api/v1/orders/${id}?phone=${encodeURIComponent(phone)}`)
  }

  async getCustomerOrders(phone: string): Promise<Order[]> {
    const res = await this.request<{ orders: Order[]; total: number }>(`/api/v1/customers/${encodeURIComponent(phone)}/orders`)
    return res.orders
  }

  // Auth
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  // Dashboard
  async getDashboardOrders(
    filters?: DashboardOrderFilters
  ): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams()
    if (filters) {
      if (filters.status) params.set('status', filters.status)
      if (filters.search) params.set('search', filters.search)
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)
      if (filters.page) params.set('page', String(filters.page))
      if (filters.per_page) params.set('per_page', String(filters.per_page))
    }
    const query = params.toString()
    const res = await this.request<{ orders: Order[]; total: number; page: number; per_page: number }>(
      `/api/v1/dashboard/orders${query ? `?${query}` : ''}`
    )
    return { data: res.orders, total: res.total, page: res.page, per_page: res.per_page }
  }

  async getDashboardOrder(id: string): Promise<Order> {
    return this.request<Order>(`/api/v1/dashboard/orders/${id}`)
  }

  async updateOrderStatus(
    id: string,
    status: string
  ): Promise<Order> {
    return this.request<Order>(`/api/v1/dashboard/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  // Admin - Products
  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category_name'>): Promise<Product> {
    return this.request<Product>('/api/v1/admin/products', {
      method: 'POST',
      body: JSON.stringify(product),
    })
  }

  async updateProduct(
    id: string,
    product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Product> {
    return this.request<Product>(`/api/v1/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    })
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/api/v1/admin/products/${id}`, {
      method: 'DELETE',
    })
  }

  // Admin - Categories
  async createCategory(
    category: Omit<Category, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Category> {
    return this.request<Category>('/api/v1/admin/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    })
  }

  async updateCategory(
    id: string,
    category: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Category> {
    return this.request<Category>(`/api/v1/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    })
  }

  // Admin - Customers
  async getCustomers(): Promise<Customer[]> {
    const res = await this.request<{ customers: Customer[]; total: number }>('/api/v1/admin/customers')
    return res.customers
  }

  // Admin - Users
  async createUser(user: CreateUserRequest): Promise<User> {
    return this.request<User>('/api/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify(user),
    })
  }

  // WebSocket URL
  getWebSocketUrl(): string {
    const wsBase = BASE_URL.replace(/^http/, 'ws')
    const token = this.getToken()
    return `${wsBase}/api/v1/dashboard/ws${token ? `?token=${token}` : ''}`
  }
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

export const apiClient = new ApiClient()
