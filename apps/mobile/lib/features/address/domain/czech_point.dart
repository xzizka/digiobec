/// A Czech POINT assisted service point as returned by the locator API.
class CzechPoint {
  const CzechPoint({
    required this.id,
    required this.name,
    required this.address,
    required this.lat,
    required this.lon,
    this.distanceMeters,
    this.walkingMinutes,
    this.openingHours,
    this.services = const [],
  });

  final String id;
  final String name;
  final String address;
  final double lat;
  final double lon;
  final double? distanceMeters;
  final int? walkingMinutes;
  final String? openingHours;
  final List<String> services;

  factory CzechPoint.fromJson(Map<String, dynamic> json) {
    return CzechPoint(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      address: json['address'] as String? ?? '',
      lat: (json['lat'] as num?)?.toDouble() ?? 0,
      lon: (json['lon'] as num?)?.toDouble() ?? 0,
      distanceMeters: (json['distanceMeters'] as num?)?.toDouble(),
      walkingMinutes: (json['walkingMinutes'] as num?)?.toInt(),
      openingHours: json['openingHours'] as String?,
      services: (json['services'] as List?)?.cast<String>() ?? const [],
    );
  }

  /// Human-readable distance, e.g. "850 m" or "1,2 km".
  String get distanceLabel {
    final meters = distanceMeters;
    if (meters == null) return '—';
    if (meters < 1000) return '${meters.round()} m';
    final km = (meters / 1000).toStringAsFixed(1).replaceAll('.', ',');
    return '$km km';
  }

  /// Human-readable walking time, e.g. "10 min".
  String get walkingLabel =>
      walkingMinutes == null ? '—' : '$walkingMinutes min';
}
