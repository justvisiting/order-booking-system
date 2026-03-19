import {
  Product,
  Order,
  PlaceOrderRequest,
  LoginResponse,
  DashboardOrdersResponse,
  OrderStatus,
  CreateProductRequest,
  UpdateProductRequest,
  Category,
} from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8090';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error: any = new Error(body.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.serverError = body.error;
    throw error;
  }

  return response.json();
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

// ── Public endpoints ──

export async function fetchProducts(): Promise<Product[]> {
  const data = await request<{ products: Product[] }>('/api/v1/products');
  return data.products || [];
}

export async function placeOrder(order: PlaceOrderRequest): Promise<Order> {
  return request<Order>('/api/v1/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export async function fetchOrdersByPhone(phone: string): Promise<Order[]> {
  const data = await request<{ orders: Order[]; total: number; page: number; per_page: number }>(
    `/api/v1/customers/${phone}/orders`
  );
  return data.orders || [];
}

// ── Auth ──

export async function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

// ── Staff dashboard ──

export async function fetchDashboardOrders(
  token: string,
  params?: { page?: number; per_page?: number; status?: OrderStatus }
): Promise<DashboardOrdersResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.per_page) query.set('per_page', String(params.per_page));
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  return request<DashboardOrdersResponse>(
    `/api/v1/dashboard/orders${qs ? `?${qs}` : ''}`,
    { headers: authHeaders(token) }
  );
}

export async function fetchDashboardOrder(token: string, orderId: number): Promise<Order> {
  return request<Order>(`/api/v1/dashboard/orders/${orderId}`, {
    headers: authHeaders(token),
  });
}

export async function updateOrderStatus(
  token: string,
  orderId: number,
  status: OrderStatus,
  note?: string
): Promise<Order> {
  return request<Order>(`/api/v1/dashboard/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status, note }),
  });
}

// ── Admin ──

export async function createProduct(token: string, data: CreateProductRequest): Promise<Product> {
  return request<Product>('/api/v1/admin/products', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function updateProduct(
  token: string,
  productId: number,
  data: UpdateProductRequest
): Promise<Product> {
  return request<Product>(`/api/v1/admin/products/${productId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(token: string, productId: number): Promise<void> {
  await request<{}>(`/api/v1/admin/products/${productId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function fetchCategories(): Promise<Category[]> {
  const data = await request<{ products: Product[] }>('/api/v1/products');
  const products = data.products || [];
  const catMap = new Map<number, Category>();
  for (const p of products) {
    if (p.category_id && p.category_name && !catMap.has(p.category_id)) {
      catMap.set(p.category_id, { id: p.category_id, name: p.category_name, slug: p.category_name.toLowerCase().replace(/\s+/g, '-') });
    }
  }
  return Array.from(catMap.values());
}
