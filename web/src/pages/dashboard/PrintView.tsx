import { useParams } from 'react-router-dom'
import { useDashboardOrder } from '../../hooks/useOrders'
import { Loading } from '../../components/Loading'
import { formatCurrency, formatDate, formatPhone } from '../../utils/format'
import { useEffect } from 'react'

export function PrintView() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading } = useDashboardOrder(id || '')

  useEffect(() => {
    if (order) {
      const timeout = setTimeout(() => window.print(), 500)
      return () => clearTimeout(timeout)
    }
  }, [order])

  if (isLoading || !order) return <Loading message="Loading order..." />

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white print:p-0">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-content, #print-content * { visibility: visible; }
          #print-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div id="print-content">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
          <p className="text-gray-500">{formatDate(order.created_at)}</p>
          <p className="text-sm mt-1">
            Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="font-semibold text-sm text-gray-500 uppercase mb-2">
              Customer
            </h2>
            <p className="font-medium">{order.customer_name}</p>
            <p className="text-sm">{formatPhone(order.customer_phone)}</p>
          </div>
          <div>
            <h2 className="font-semibold text-sm text-gray-500 uppercase mb-2">
              Delivery Address
            </h2>
            <p className="text-sm">{order.delivery_address.address}</p>
            <p className="text-sm">
              {order.delivery_address.city}, {order.delivery_address.state} -{' '}
              {order.delivery_address.pincode}
            </p>
          </div>
        </div>

        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 font-semibold">Item</th>
              <th className="text-center py-2 font-semibold">Qty</th>
              <th className="text-right py-2 font-semibold">Price</th>
              <th className="text-right py-2 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-2">{item.product_name}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="py-2 text-right">
                  {formatCurrency(item.total_price)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300">
              <td colSpan={3} className="py-3 font-bold text-right">
                Total
              </td>
              <td className="py-3 font-bold text-right">
                {formatCurrency(order.total_amount)}
              </td>
            </tr>
          </tfoot>
        </table>

        {order.notes && (
          <div className="mb-8">
            <h2 className="font-semibold text-sm text-gray-500 uppercase mb-2">
              Notes
            </h2>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
