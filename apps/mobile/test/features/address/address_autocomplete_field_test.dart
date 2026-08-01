import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:municipal_portal/features/address/domain/address_suggestion.dart';
import 'package:municipal_portal/features/address/presentation/widgets/address_autocomplete_field.dart';

class _FakeAddressRepo {
  final List<String> queries = [];
  final Map<String, List<AddressSuggestion>> responses = {};

  Future<List<AddressSuggestion>> suggest(String query) async {
    queries.add(query);
    return responses[query.trim().toLowerCase()] ?? const [];
  }
}

void main() {
  late _FakeAddressRepo repo;

  setUp(() {
    repo = _FakeAddressRepo();
  });

  const suggestion = AddressSuggestion(
    id: 1,
    label: 'Broumská 2, Broumy 267 42',
    street: 'Broumská',
    number: '2',
    city: 'Broumy',
    postalCode: '267 42',
    district: 'Beroun',
    region: 'Středočeský kraj',
    lat: 49.9462,
    lon: 13.8591,
  );

  Widget wrap(Widget child) => MaterialApp(
        home: Scaffold(body: Padding(padding: EdgeInsets.all(16), child: child)),
      );

  testWidgets('shows suggestions after debounce on typing', (tester) async {
    repo.responses['broumska'] = [suggestion];

    await tester.pumpWidget(wrap(AddressAutocompleteField(
      label: 'Adresa',
      repository: repo,
      onSelected: (_) {},
    )));

    await tester.enterText(find.byType(TextField), 'Broumska');
    // Debounce is 300ms; advance past it.
    await tester.pump(const Duration(milliseconds: 350));
    await tester.pumpAndSettle();

    expect(repo.queries, contains('Broumska'));
    expect(find.text(suggestion.label), findsOneWidget);
  });

  testWidgets('no dropdown for blank input', (tester) async {
    await tester.pumpWidget(wrap(AddressAutocompleteField(
      label: 'Adresa',
      repository: repo,
      onSelected: (_) {},
    )));

    await tester.enterText(find.byType(TextField), '   ');
    await tester.pump(const Duration(milliseconds: 350));
    await tester.pumpAndSettle();

    expect(repo.queries, isEmpty);
    expect(find.byType(ListTile), findsNothing);
  });

  testWidgets('tapping a suggestion reports it and fills the field',
      (tester) async {
    repo.responses['broumska'] = [suggestion];
    AddressSuggestion? selected;
    repo.responses['broumska'] = [suggestion];

    await tester.pumpWidget(wrap(AddressAutocompleteField(
      label: 'Adresa',
      repository: repo,
      onSelected: (s) => selected = s,
    )));

    await tester.enterText(find.byType(TextField), 'Broumska');
    await tester.pump(const Duration(milliseconds: 350));
    await tester.pumpAndSettle();

    await tester.tap(find.text(suggestion.label));
    await tester.pumpAndSettle();

    expect(selected, suggestion);
    expect(
      tester.widget<TextField>(find.byType(TextField)).controller!.text,
      suggestion.label,
    );
    // Dropdown closes after selection.
    expect(find.byType(ListTile), findsNothing);
  });
}
