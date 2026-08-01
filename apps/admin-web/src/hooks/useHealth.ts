import { useQuery } from '@tanstack/react-query'
import api from '../api/client'

export interface HealthResponse {
  status: string
  version: string
  timestamp: string
  database: string
  keycloak: string
}

export function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get<HealthResponse>('/api/health')
      return response.data
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  })
}