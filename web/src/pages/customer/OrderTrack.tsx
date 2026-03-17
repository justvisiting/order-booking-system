import { useState } from 'react'
import { useCustomerOrders } from '../../hooks/useOrders'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
import { Badge } from '../../components/Badge'
import { Loading } from '../../components/Loading'
import { EmptyState } from '../../components/EmptyState'
import { formatCurrency, formatDate } from '../../utils/format'

export function OrderTrack() {
  const [phone, setPhone] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const { data: orders, isLoading, error } = useCustomerOrders(searchPhone)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) {
      setPhoneError('Phone number is required')
      return
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setPhoneError('Enter a valid 10-digit phone number')
      return
    }
    setPhoneError('')
    setSearchPhone(phone.trim())
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Track Your Orders</h1>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="flex-1">
          <Input
            placeholder="Enter your 10-digit phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={phoneError}
            maxLength={10}
          />
        </div>
        <Button type="submit" className="self-start">
          Search
        </Button>
      </form>

      {searchPhone && isLoading && <Loading message="Looking up orders..." />}

      {searchPhone && error && (
        <EmptyState
          title="Failed to look up orders"
          description="Please check the phone number and try again."
        />
      )}

      {searchPhone && orders && orders.length === 0 && (
        <EmptyState
          title="No orders found"
          description="No orders were found for this phone number."
        />
      )}

      {orders && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    Order #{order.order_number}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <Badge status={order.status} />
              </div>
              <div className="border-t pt-3">
                {order.items && order.items.length > 0 && (
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-600">
                          {item.product_name} x {item.quantity}
                        </span>
                        <span className="text-gray-900">
                          {formatCurrency(item.total_price || (item as any).subtotal || item.unit_price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className={`${order.items && order.items.length > 0 ? 'border-t mt-2 pt-2' : ''} flex justify-between font-semibold`}>
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
