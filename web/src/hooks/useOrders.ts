import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type { CreateOrderRequest, DashboardOrderFilters, OrderStatus } from '../types'

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (order: CreateOrderRequest) => apiClient.createOrder(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useOrder(id: string, phone: string) {
  return useQuery({
    queryKey: ['orders', id, phone],
    queryFn: () => apiClient.getOrder(id, phone),
    enabled: !!id && !!phone,
  })
}

export function useCustomerOrders(phone: string) {
  return useQuery({
    queryKey: ['customerOrders', phone],
    queryFn: () => apiClient.getCustomerOrders(phone),
    enabled: !!phone,
  })
}

export function useDashboardOrders(filters?: DashboardOrderFilters) {
  return useQuery({
    queryKey: ['dashboardOrders', filters],
    queryFn: () => apiClient.getDashboardOrders(filters),
    refetchInterval: 30000,
  })
}

export function useDashboardOrder(id: string) {
  return useQuery({
    queryKey: ['dashboardOrders', id],
    queryFn: () => apiClient.getDashboardOrder(id),
    enabled: !!id,
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      apiClient.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardOrders'] })
    },
  })
}
