import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../../../theme/broumy_tokens.dart';
import '../../domain/czech_point.dart';

/// Interactive OpenStreetMap view of nearby Czech POINT locations.
///
/// Renders a marker per point and opens a bottom sheet with the point's
/// distance, walking time and opening hours when a marker is tapped. An
/// accessible list alternative lives in [CzechPointList].
class CzechPointMap extends StatelessWidget {
  const CzechPointMap({
    super.key,
    required this.points,
    required this.center,
    this.onPointTap,
  });

  final List<CzechPoint> points;
  final CzechPoint center;

  /// Called when the user taps a point (e.g. to open navigation).
  final ValueChanged<CzechPoint>? onPointTap;

  void _openDetails(BuildContext context, CzechPoint point) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                point.name,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 4),
              Text(point.address),
              const SizedBox(height: 8),
              Text('Vzdálenost: ${point.distanceLabel}'),
              Text('Pěšky: ${point.walkingLabel}'),
              if (point.openingHours != null) ...[
                const SizedBox(height: 4),
                Text('Otevírací doba: ${point.openingHours}'),
              ],
              const SizedBox(height: 16),
              if (onPointTap != null)
                FilledButton.icon(
                  icon: const Icon(Icons.directions_walk),
                  label: const Text('Navigovat'),
                  onPressed: () {
                    Navigator.of(context).pop();
                    onPointTap!(point);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: FlutterMap(
        options: MapOptions(
          initialCenter: LatLng(center.lat, center.lon),
          initialZoom: 13,
          minZoom: 3,
          maxZoom: 18,
        ),
        children: [
          TileLayer(
            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            userAgentPackageName: 'cz.obec.portal.app',
          ),
          MarkerLayer(
            markers: [
              Marker(
                point: LatLng(center.lat, center.lon),
                width: 36,
                height: 36,
                child: const Icon(
                  Icons.home,
                  color: BroumyColors.primary,
                  size: 32,
                ),
              ),
              ...points.map(
                (point) => Marker(
                  point: LatLng(point.lat, point.lon),
                  width: 40,
                  height: 40,
                  child: Semantics(
                    button: true,
                    label: point.name,
                    child: GestureDetector(
                      onTap: () => _openDetails(context, point),
                      child: const Icon(
                        Icons.location_on,
                        color: BroumyColors.accent,
                        size: 36,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
