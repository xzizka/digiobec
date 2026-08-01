import 'package:flutter/material.dart';

import '../../../../components/broumy_app_bar.dart';
import '../../../../theme/broumy_tokens.dart';
import '../data/address_repository.dart';
import '../domain/address_suggestion.dart';
import '../domain/czech_point.dart';
import 'widgets/address_autocomplete_field.dart';
import 'widgets/czech_point_list.dart';
import 'widgets/czech_point_map.dart';

/// Address picker: search an address (RÚIAN autocomplete) and locate the
/// nearest Czech POINT service points on a map or accessible list.
class AddressSelectorPage extends StatefulWidget {
  const AddressSelectorPage({super.key, this.repository});

  final AddressRepository? repository;

  @override
  State<AddressSelectorPage> createState() => _AddressSelectorPageState();
}

class _AddressSelectorPageState extends State<AddressSelectorPage> {
  late final AddressRepository _repository;
  late final AddressSuggestion _selected;

  List<CzechPoint> _points = const [];
  bool _loadingPoints = false;
  String? _error;
  bool _showList = true;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? AddressRepository();
    _selected = AddressSuggestion(city: 'Broumy', label: 'Broumy');
  }

  Future<void> _onAddressSelected(AddressSuggestion suggestion) async {
    final lat = suggestion.lat;
    final lon = suggestion.lon;
    if (lat == null || lon == null) {
      setState(() {
        _error = 'Pro vybranou adresu nejsou k dispozici souřadnice.';
        _points = const [];
      });
      return;
    }
    setState(() {
      _selected = suggestion;
      _loadingPoints = true;
      _error = null;
    });
    try {
      final points = await _repository.nearbyCzechPoints(lat: lat, lon: lon);
      if (!mounted) return;
      setState(() {
        _points = points;
        _loadingPoints = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingPoints = false;
        _error = 'Nepodařilo se najít Czech POINT místa. Zkuste to prosím znovu.';
      });
    }
  }

  /// Map center derived from the currently selected address suggestion.
  CzechPoint get _center => CzechPoint(
        id: 'center',
        name: _selected.label,
        address: _selected.label,
        lat: _selected.lat ?? 49.9455,
        lon: _selected.lon ?? 13.8586,
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const BroumyAppBar(title: 'Nejbližší Czech POINT'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(BroumySpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Najděte nejbližší místo s podporou Czech POINT služeb.',
              style: TextStyle(color: BroumyColors.textSecondary),
            ),
            const SizedBox(height: 16),
            AddressAutocompleteField(
              label: 'Adresa',
              hintText: 'Napište ulici, číslo a město…',
              repository: _repository,
              onSelected: _onAddressSelected,
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: const TextStyle(color: BroumyColors.error),
              ),
            ],
            if (_loadingPoints)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (!_loadingPoints && _points.isNotEmpty) ...[
              const SizedBox(height: 16),
              SegmentedButton<bool>(
                segments: const [
                  ButtonSegment(
                    value: true,
                    label: Text('Seznam'),
                    icon: Icon(Icons.list),
                  ),
                  ButtonSegment(
                    value: false,
                    label: Text('Mapa'),
                    icon: Icon(Icons.map),
                  ),
                ],
                selected: {_showList},
                onSelectionChanged: (selection) =>
                    setState(() => _showList = selection.first),
              ),
              const SizedBox(height: 16),
              if (_showList)
                CzechPointList(points: _points)
              else
                SizedBox(
                  height: 360,
                  child: CzechPointMap(points: _points, center: _center),
                ),
            ],
          ],
        ),
      ),
    );
  }
}
