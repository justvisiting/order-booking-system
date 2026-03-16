import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../stores/cartStore'
import { Input } from '../../components/Input'
import { Textarea } from '../../components/Textarea'
import { Button } from '../../components/Button'
import { formatCurrency } from '../../utils/format'
import type { OrderCustomer, OrderAddress } from '../../types'

interface FormErrors {
  name?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
}

export function OrderForm() {
  const items = useCartStore((s) => s.items)
  const getTotal = useCartStore((s) => s.getTotal)
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<OrderCustomer>({
    name: '',
    phone: '',
  })
  const [address, setAddress] = useState<OrderAddress>({
    address: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  if (items.length === 0) {
    navigate('/order')
    return null
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!customer.name.trim()) newErrors.name = 'Name is required'
    if (!customer.phone.trim()) {
      newErrors.phone = 'Phone is required'
    } else if (!/^\d{10}$/.test(customer.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit phone number'
    }
    if (!address.address.trim()) newErrors.address = 'Address is required'
    if (!address.city.trim()) newErrors.city = 'City is required'
    if (!address.state.trim()) newErrors.state = 'State is required'
    if (!address.pincode.trim()) {
      newErrors.pincode = 'Pincode is required'
    } else if (!/^\d{6}$/.test(address.pincode.trim())) {
      newErrors.pincode = 'Enter a valid 6-digit pincode'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      navigate('/order/review', {
        state: { customer, address, notes },
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Delivery Details</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Contact Information
          </h2>
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={customer.name}
              onChange={(e) =>
                setCustomer((c) => ({ ...c, name: e.target.value }))
              }
              error={errors.name}
              placeholder="Enter your name"
            />
            <Input
              label="Phone Number"
              value={customer.phone}
              onChange={(e) =>
                setCustomer((c) => ({ ...c, phone: e.target.value }))
              }
              error={errors.phone}
              placeholder="10-digit phone number"
              maxLength={10}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Delivery Address
          </h2>
          <div className="space-y-4">
            <Textarea
              label="Address"
              value={address.address}
              onChange={(e) =>
                setAddress((a) => ({ ...a, address: e.target.value }))
              }
              error={errors.address}
              placeholder="House/Flat number, Street, Area"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="City"
                value={address.city}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, city: e.target.value }))
                }
                error={errors.city}
                placeholder="City"
              />
              <Input
                label="State"
                value={address.state}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, state: e.target.value }))
                }
                error={errors.state}
                placeholder="State"
              />
            </div>
            <Input
              label="Pincode"
              value={address.pincode}
              onChange={(e) =>
                setAddress((a) => ({ ...a, pincode: e.target.value }))
              }
              error={errors.pincode}
              placeholder="6-digit pincode"
              maxLength={6}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Additional Notes
          </h2>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions..."
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              {items.length} item{items.length > 1 ? 's' : ''} in cart
            </span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(getTotal())}
            </span>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg">
          Review Order
        </Button>
      </form>
    </div>
  )
}
