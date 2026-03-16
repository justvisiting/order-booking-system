import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from './components/Toast'
import { CustomerLayout } from './components/CustomerLayout'
import { DashboardLayout } from './components/DashboardLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ProductCatalog } from './pages/customer/ProductCatalog'
import { OrderForm } from './pages/customer/OrderForm'
import { OrderReview } from './pages/customer/OrderReview'
import { OrderConfirmation } from './pages/customer/OrderConfirmation'
import { OrderTrack } from './pages/customer/OrderTrack'
import { Login } from './pages/dashboard/Login'
import { OrderList } from './pages/dashboard/OrderList'
import { OrderDetail } from './pages/dashboard/OrderDetail'
import { PrintView } from './pages/dashboard/PrintView'
import { ProductManager } from './pages/admin/ProductManager'
import { CategoryManager } from './pages/admin/CategoryManager'
import { UserManager } from './pages/admin/UserManager'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/order" replace />} />

          {/* Customer routes */}
          <Route path="/order" element={<CustomerLayout />}>
            <Route index element={<ProductCatalog />} />
            <Route path="checkout" element={<OrderForm />} />
            <Route path="review" element={<OrderReview />} />
            <Route path="confirmation" element={<OrderConfirmation />} />
            <Route path="track" element={<OrderTrack />} />
          </Route>

          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OrderList />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="orders/:id/print" element={<PrintView />} />
          </Route>

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="products" element={<ProductManager />} />
            <Route path="categories" element={<CategoryManager />} />
            <Route path="users" element={<UserManager />} />
          </Route>

          <Route path="*" element={<Navigate to="/order" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
