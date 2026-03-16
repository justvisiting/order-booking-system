import { Link, Outlet } from 'react-router-dom'
import { useCartStore } from '../stores/cartStore'
import { useState } from 'react'
import { Cart } from '../pages/customer/Cart'

export function CustomerLayout() {
  const [cartOpen, setCartOpen] = useState(false)
  const itemCount = useCartStore((s) => s.getItemCount())

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/order" className="text-xl font-bold text-gray-900">
              Order System
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/order/track"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Track Order
              </Link>
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <Cart open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}
