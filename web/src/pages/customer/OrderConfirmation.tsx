import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Button } from '../../components/Button'

interface LocationState {
  orderNumber: string
  orderId: string
}

export function OrderConfirmation() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | undefined

  if (!state) {
    return <Navigate to="/order" replace />
  }

  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-8 h-8 text-success-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-neutral-900 mb-2">
        Order Placed Successfully!
      </h1>
      <p className="text-neutral-600 mb-6">
        Your order has been received and is being processed.
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8">
        <p className="text-sm text-neutral-500 mb-1">Order Number</p>
        <p className="text-2xl font-bold text-neutral-900">{state.orderNumber}</p>
        <p className="text-sm text-neutral-500 mt-3">
          Save this number to track your order.
        </p>
      </div>

      <div className="space-y-3">
        <Button className="w-full" onClick={() => navigate('/order/track')}>
          Track Order
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => navigate('/order')}>
          Continue Shopping
        </Button>
      </div>
    </div>
  )
}
