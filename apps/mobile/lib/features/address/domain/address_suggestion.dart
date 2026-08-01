/// A single address suggestion returned by the RÚIAN autocomplete proxy.
class AddressSuggestion {
  const AddressSuggestion({
    this.id,
    required this.label,
    this.street,
    this.number,
    required this.city,
    this.postalCode,
    this.district,
    this.region,
    this.lat,
    this.lon,
  });

  final int? id;
  final String label;
  final String? street;
  final String? number;
  final String city;
  final String? postalCode;
  final String? district;
  final String? region;
  final double? lat;
  final double? lon;

  factory AddressSuggestion.fromJson(Map<String, dynamic> json) {
    return AddressSuggestion(
      id: (json['id'] as num?)?.toInt(),
      label: json['label'] as String? ?? '',
      street: json['street'] as String?,
      number: json['number'] as String?,
      city: json['city'] as String? ?? '',
      postalCode: json['postalCode'] as String?,
      district: json['district'] as String?,
      region: json['region'] as String?,
      lat: (json['lat'] as num?)?.toDouble(),
      lon: (json['lon'] as num?)?.toDouble(),
    );
  }

  /// Single-line query-friendly form of the address.
  String get query => label.isNotEmpty ? label : city;
}
