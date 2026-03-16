import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => apiClient.getProduct(id),
    enabled: !!id,
  })
}
