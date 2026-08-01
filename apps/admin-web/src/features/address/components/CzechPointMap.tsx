import type { CzechPoint } from '../types/address';

export interface CzechPointMapProps {
  /** Points to display; the first one is used as the map center. */
  points: CzechPoint[];
  /** Optional title above the map. */
  title?: string;
}

function formatDistance(meters: number | null): string {
  if (meters == null) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

/**
 * Dependency-free Czech POINT map for the admin web.
 *
 * Renders an embedded OpenStreetMap centred on the nearest point with one
 * marker per point, plus an accessible list of the same points (map alone is
 * not keyboard/screen-reader usable). No map library dependency is pulled in;
 * the iframe loads from `openstreetmap.org/export/embed.html`.
 */
export function CzechPointMap({ points, title }: CzechPointMapProps) {
  if (points.length === 0) {
    return (
      <div className="broumy-card broumy-card-outlined">
        <div className="broumy-card-body">
          <p>V okolí se nepodařilo najít žádné Czech POINT místo.</p>
        </div>
      </div>
    );
  }

  const center = points[0];
  const pad = 0.01;
  const bbox = points
    .reduce(
      (acc, p) => [
        Math.min(acc[0], p.lon - pad),
        Math.min(acc[1], p.lat - pad),
        Math.max(acc[2], p.lon + pad),
        Math.max(acc[3], p.lat + pad),
      ],
      [center.lon - pad, center.lat - pad, center.lon + pad, center.lat + pad] as number[],
    )
    .join(',');

  const embedUrl =
    `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
    `&layer=mapnik&marker=${center.lat.toFixed(5)},${center.lon.toFixed(5)}`;

  return (
    <div>
      {title && <h3 className="broumy-card-title">{title}</h3>}
      <div
        className="czechpoint-map"
        style={{ borderRadius: 12, overflow: 'hidden' }}
      >
        <iframe
          title={title ?? 'Mapa Czech POINT míst'}
          src={embedUrl}
          style={{ width: '100%', height: 360, border: 0 }}
          loading="lazy"
        />
      </div>
      <ul className="czechpoint-map-list">
        {points.map((point) => (
          <li key={point.id}>
            <strong>{point.name}</strong>
            <span>{point.address}</span>
            <span className="czechpoint-map-meta">
              {formatDistance(point.distanceMeters)}
              {point.walkingMinutes != null && ` · pěšky ${point.walkingMinutes} min`}
              {point.openingHours && ` · ${point.openingHours}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
