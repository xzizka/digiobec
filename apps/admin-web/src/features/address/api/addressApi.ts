import api from '../../../api/client';
import type {
  AddressSuggestion,
  CzechPoint,
  NearbyCzechPointsParams,
} from '../types/address';

/** `GET /api/addresses/suggest?q={query}` — RÚIAN autocomplete proxy. */
export async function suggestAddresses(
  q: string,
  limit = 10,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const { data } = await api.get<AddressSuggestion[]>('/api/addresses/suggest', {
    params: { q, limit },
    signal,
  });
  return data;
}

/** `GET /api/czech-points/nearby?lat={lat}&lon={lon}` — nearest assisted points. */
export async function nearbyCzechPoints(
  params: NearbyCzechPointsParams,
): Promise<CzechPoint[]> {
  const { data } = await api.get<CzechPoint[]>('/api/czech-points/nearby', {
    params: { ...params, radius: params.radius ?? 5000, limit: params.limit ?? 10 },
  });
  return data;
}
