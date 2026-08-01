export interface AddressSuggestion {
  id: number | null
  label: string
  street: string | null
  number: string | null
  city: string
  postalCode: string | null
  district: string | null
  region: string | null
  lat: number | null
  lon: number | null
}

export interface CzechPoint {
  id: string
  name: string
  address: string
  lat: number
  lon: number
  distanceMeters: number | null
  walkingMinutes: number | null
  openingHours: string | null
  services: string[]
}

export interface NearbyCzechPointsParams {
  lat: number
  lon: number
  radius?: number
  limit?: number
}
