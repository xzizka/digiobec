import 'package:dio/dio.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/dio_client.dart';
import '../domain/address_suggestion.dart';
import '../domain/czech_point.dart';

/// Talks to the backend RÚIAN autocomplete + Czech POINT locator endpoints.
class AddressRemoteDatasource {
  AddressRemoteDatasource({Dio? dio}) : _dio = dio ?? DioClient().dio;

  final Dio _dio;

  Future<List<AddressSuggestion>> suggestAddresses(String query) async {
    if (query.trim().isEmpty) return const [];
    final response = await _dio.get<List<dynamic>>(
      AppConstants.ruaianAutocompleteEndpoint,
      queryParameters: {'q': query, 'limit': 10},
    );
    final data = response.data ?? const [];
    return data
        .map((e) => AddressSuggestion.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<List<CzechPoint>> nearbyCzechPoints({
    required double lat,
    required double lon,
    int radius = 5000,
    int limit = 10,
  }) async {
    final response = await _dio.get<List<dynamic>>(
      AppConstants.czechPointLocatorEndpoint,
      queryParameters: {
        'lat': lat,
        'lon': lon,
        'radius': radius,
        'limit': limit,
      },
    );
    final data = response.data ?? const [];
    return data
        .map((e) => CzechPoint.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }
}
