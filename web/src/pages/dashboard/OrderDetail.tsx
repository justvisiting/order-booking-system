import { useParams, Link } from 'react-router-dom'
import { useDashboardOrder, useUpdateOrderStatus } from '../../hooks/useOrders'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Loading } from '../../components/Loading'
import { EmptyState } from '../../components/EmptyState'
import { toast } from '../../components/Toast'
import { formatCurrency, formatDate, formatPhone } from '../../utils/format'
import type { OrderStatus } from '../../types'

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: [],
  cancelled: [],
}

const statusButtonStyles: Record<string, string> = {
  confirmed: 'bg-blue-600 text-white hover:bg-blue-700',
  dispatched: 'bg-purple-600 text-white hover:bg-purple-700',
  delivered: 'bg-green-600 text-white hover:bg-green-700',
  cancelled: 'bg-red-600 text-white hover:bg-red-700',
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, error } = useDashboardOrder(id || '')
  const updateStatus = useUpdateOrderStatus()

  const handleStatusUpdate = (newStatus: OrderStatus) => {
    if (!id) return
    updateStatus.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          toast('success', `Order status updated to ${newStatus}`)
        },
        onError: (err) => {
          toast('error', err.message || 'Failed to update status')
        },
      }
    )
  }

  if (isLoading) return <Loading message="Loading order..." />
  if (error || !order) {
    return (
      <EmptyState
        title="Order not found"
        description="The order you're looking for doesn't exist."
        action={
          <Link to="/dashboard">
            <Button variant="secondary">Back to Orders</Button>
          </Link>
        }
      />
    )
  }

  const nextStatuses = statusTransitions[order.status] || []

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-800 mb-1 inline-block"
          >
            &larr; Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.order_number}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={order.status} />
          <Link to={`/dashboard/orders/${order.id}/print`}>
            <Button variant="ghost" size="sm">
              Print
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {nextStatuses.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Update Status
            </h2>
            <div className="flex gap-2 flex-wrap">
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updateStatus.isPending}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${statusButtonStyles[status]}`}
                >
                  Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">
                {formatPhone(order.customer_phone)}
              </p>
            </div>
          </div>
        </div>

        {order.delivery_address && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Delivery Address
            </h2>
            <div className="text-sm text-gray-600">
              <p>{order.delivery_address.address}</p>
              <p>
                {order.delivery_address.city}, {order.delivery_address.state} -{' '}
                {order.delivery_address.pincode}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Items
          </h2>
          <div className="divide-y">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{item.product_name}</p>
                  <p className="text-gray-500">
                    {item.quantity} x {formatCurrency(item.unit_price)}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(item.total_price)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 mt-1 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
        </div>

        {order.notes && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex justify-between">
              <span>Created</span>
              <span>{formatDate(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated</span>
              <span>{formatDate(order.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
