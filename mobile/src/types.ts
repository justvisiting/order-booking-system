export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  category_id: number;
  category_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  total_amount: number;
  notes: string;
  delivery_address: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PlaceOrderRequest {
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  delivery_address: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: {
    product_id: number;
    quantity: number;
  }[];
  notes: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'staff';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface DashboardOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  per_page: number;
}

export interface CreateProductRequest {
  category_id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
}

export interface UpdateProductRequest {
  category_id?: number;
  name?: string;
  description?: string;
  price?: number;
  unit?: string;
  is_active?: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface CheckoutFormData {
  customer_name: string;
  customer_phone: string;
  delivery_address: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  notes: string;
}
