import '../domain/address_suggestion.dart';
import '../domain/czech_point.dart';
import 'address_remote_datasource.dart';

/// Repository over the RÚIAN / Czech POINT remote datasource.
///
/// Keeps a small in-memory cache of the last typed queries (per the
/// offline "last 50 searches" goal; a Drift-backed cache is a follow-up).
class AddressRepository {
  AddressRepository({AddressRemoteDatasource? remote})
      : _remote = remote ?? AddressRemoteDatasource();

  final AddressRemoteDatasource _remote;

  static const int _maxCachedQueries = 50;

  final Map<String, List<AddressSuggestion>> _suggestionCache = {};

  /// Suggest addresses; results are cached per normalized query.
  Future<List<AddressSuggestion>> suggest(String query) async {
    final key = query.trim().toLowerCase();
    if (key.isEmpty) return const [];
    final cached = _suggestionCache[key];
    if (cached != null) return cached;

    final results = await _remote.suggestAddresses(query);
    if (results.isNotEmpty) {
      _suggestionCache[key] = results;
      if (_suggestionCache.length > _maxCachedQueries) {
        _suggestionCache.remove(_suggestionCache.keys.first);
      }
    }
    return results;
  }

  Future<List<CzechPoint>> nearbyCzechPoints({
    required double lat,
    required double lon,
    int radius = 5000,
  }) {
    return _remote.nearbyCzechPoints(lat: lat, lon: lon, radius: radius);
  }
}
