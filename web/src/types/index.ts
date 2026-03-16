export interface Product {
  id: string
  name: string
  description: string
  price: number
  category_id: string
  category_name?: string
  unit: string
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface OrderAddress {
  address: string
  city: string
  state: string
  pincode: string
}

export interface OrderCustomer {
  name: string
  phone: string
}

export interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export type OrderStatus = 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  delivery_address: OrderAddress
  items: OrderItem[]
  total_amount: number
  status: OrderStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateOrderRequest {
  customer_name: string
  customer_phone: string
  delivery_address: OrderAddress
  items: { product_id: string; quantity: number }[]
  notes?: string
}

export interface User {
  id: string
  username: string
  role: 'admin' | 'staff'
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface ApiError {
  message: string
  code?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

export interface DashboardOrderFilters {
  status?: OrderStatus
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export interface WebSocketMessage {
  type: 'order_created' | 'order_updated' | 'order_status_changed'
  payload: Order
}

export interface Customer {
  phone: string
  name: string
  order_count: number
  total_spent: number
  last_order_at: string
}

export interface CreateUserRequest {
  username: string
  password: string
  role: 'admin' | 'staff'
}
