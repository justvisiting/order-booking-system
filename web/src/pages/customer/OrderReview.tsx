import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useCartStore } from '../../stores/cartStore'
import { useCreateOrder } from '../../hooks/useOrders'
import { formatCurrency } from '../../utils/format'
import { Button } from '../../components/Button'
import { toast } from '../../components/Toast'
import type { OrderCustomer, OrderAddress } from '../../types'

interface LocationState {
  customer: OrderCustomer
  address: OrderAddress
  notes: string
}

export function OrderReview() {
  const location = useLocation()
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const getTotal = useCartStore((s) => s.getTotal)
  const clearCart = useCartStore((s) => s.clearCart)
  const createOrder = useCreateOrder()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const state = location.state as LocationState | undefined

  if (!state || (items.length === 0 && !isSubmitting)) {
    return <Navigate to="/order" replace />
  }

  const { customer, address, notes } = state

  const handleSubmit = () => {
    setIsSubmitting(true)
    createOrder.mutate(
      {
        customer_name: customer.name,
        customer_phone: customer.phone,
        delivery_address: address,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        notes: notes || undefined,
      },
      {
        onSuccess: (order) => {
          clearCart()
          navigate('/order/confirmation', {
            state: { orderNumber: order.order_number, orderId: order.id },
            replace: true,
          })
        },
        onError: (error) => {
          toast('error', error.message || 'Failed to place order. Please try again.')
        },
      }
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Review Your Order</h1>

      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Contact Details
          </h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium text-gray-900">Name:</span> {customer.name}</p>
            <p><span className="font-medium text-gray-900">Phone:</span> {customer.phone}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Delivery Address
          </h2>
          <div className="text-sm text-gray-600">
            <p>{address.address}</p>
            <p>{address.city}, {address.state} - {address.pincode}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h2>
          <div className="divide-y">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.product.name}</p>
                  <p className="text-sm text-gray-500">
                    {item.quantity} x {formatCurrency(item.product.price)}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(item.product.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(getTotal())}
            </span>
          </div>
        </div>

        {notes && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
            <p className="text-sm text-gray-600">{notes}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button
            size="lg"
            className="flex-1"
            onClick={handleSubmit}
            loading={createOrder.isPending}
          >
            Place Order
          </Button>
        </div>
      </div>
    </div>
  )
}
