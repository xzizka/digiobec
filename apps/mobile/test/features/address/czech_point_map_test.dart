import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:municipal_portal/features/address/domain/czech_point.dart';
import 'package:municipal_portal/features/address/presentation/widgets/czech_point_map.dart';
import 'package:municipal_portal/features/address/presentation/widgets/czech_point_list.dart';

const _center = CzechPoint(
  id: 'center',
  name: 'Můj domov',
  address: 'Broumy 1',
  lat: 49.9455,
  lon: 13.8586,
);

final _points = [
  CzechPoint(
    id: 'cp-1',
    name: 'Czech POINT Obecní úřad Broumy',
    address: 'Náměstí 1, Broumy',
    lat: 49.9460,
    lon: 13.8590,
    distanceMeters: 180,
    walkingMinutes: 2,
    openingHours: 'Po-Pá 8:00-16:00',
    services: const ['vypis-z-verejnych-registru', 'podatelna'],
  ),
  CzechPoint(
    id: 'cp-2',
    name: 'Czech POINT Beroun',
    address: 'Husovo náměstí 1, Beroun',
    lat: 49.9500,
    lon: 13.8600,
    distanceMeters: 18500,
    walkingMinutes: 232,
    openingHours: 'Po-Pá 7:30-17:00',
    services: const ['vypis-z-verejnych-registru'],
  ),
];

void main() {
  testWidgets('map renders one marker per point plus the home marker',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: SizedBox(
          height: 400,
          child: CzechPointMap(points: _points, center: _center),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // 2 points + 1 home marker = 3 location icons.
    expect(find.byIcon(Icons.location_on), findsNWidgets(2));
    expect(find.byIcon(Icons.home), findsOneWidget);
  });

  testWidgets('tapping a marker opens a bottom sheet with details',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: SizedBox(
          height: 400,
          child: CzechPointMap(points: _points, center: _center),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.location_on).first);
    await tester.pumpAndSettle();

    expect(find.text('Czech POINT Obecní úřad Broumy'), findsOneWidget);
    expect(find.textContaining('Otevírací doba'), findsOneWidget);
  });

  testWidgets('list shows distance, walking time, hours and services',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: CzechPointList(points: _points)),
      ),
    );

    expect(find.text('Czech POINT Obecní úřad Broumy'), findsOneWidget);
    expect(find.textContaining('180 m · pěšky 2 min'), findsOneWidget);
    expect(find.textContaining('18,5 km · pěšky 232 min'), findsOneWidget);
    expect(find.textContaining('Otevírací doba: Po-Pá 8:00-16:00'), findsOneWidget);
    expect(find.byType(Chip), findsNWidgets(3));
  });

  testWidgets('list shows empty state when there are no points',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: CzechPointList(points: const [])),
      ),
    );

    expect(find.textContaining('nepodařilo najít žádné Czech POINT'), findsOneWidget);
  });
}
