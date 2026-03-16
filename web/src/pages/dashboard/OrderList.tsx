import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardOrders } from '../../hooks/useOrders'
import { Badge } from '../../components/Badge'
import { Loading } from '../../components/Loading'
import { EmptyState } from '../../components/EmptyState'
import { Input } from '../../components/Input'
import { Select } from '../../components/Select'
import { formatCurrency, formatDate } from '../../utils/format'
import type { OrderStatus, DashboardOrderFilters } from '../../types'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function OrderList() {
  const [filters, setFilters] = useState<DashboardOrderFilters>({
    page: 1,
    per_page: 20,
  })

  const { data, isLoading, error } = useDashboardOrders(filters)

  const updateFilter = (key: keyof DashboardOrderFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: key !== 'page' ? 1 : prev.page,
    }))
  }

  if (isLoading) return <Loading message="Loading orders..." />
  if (error) {
    return (
      <EmptyState
        title="Failed to load orders"
        description="Please try again later."
      />
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by order number, customer..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={statusOptions}
            value={filters.status || ''}
            onChange={(e) =>
              updateFilter('status', e.target.value as OrderStatus | '')
            }
          />
        </div>
        <Input
          type="date"
          value={filters.date_from || ''}
          onChange={(e) => updateFilter('date_from', e.target.value)}
          className="w-full sm:w-40"
        />
        <Input
          type="date"
          value={filters.date_to || ''}
          onChange={(e) => updateFilter('date_to', e.target.value)}
          className="w-full sm:w-40"
        />
      </div>

      {!data || data.data.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="Adjust your filters or wait for new orders."
        />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Order #
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Customer
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                      Phone
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">
                      Amount
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.data.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/dashboard/orders/${order.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {order.customer_name}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                        {order.customer_phone}
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data.total > (filters.per_page || 20) && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {data.data.length} of {data.total} orders
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))
                  }
                  disabled={(filters.page || 1) <= 1}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))
                  }
                  disabled={
                    data.data.length < (filters.per_page || 20)
                  }
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
