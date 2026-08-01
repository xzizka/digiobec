import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:municipal_portal/components/broumy_button.dart';
import 'package:municipal_portal/theme/broumy_tokens.dart';
import 'package:municipal_portal/theme/broumy_theme.dart';

double contrast(Color a, Color b) {
  double luminance(Color c) {
    double lin(double v) =>
        v <= 0.03928 ? v / 12.92 : math.pow((v + 0.055) / 1.055, 2.4).toDouble();
    return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  }

  final l1 = luminance(a);
  final l2 = luminance(b);
  final lighter = math.max(l1, l2);
  final darker = math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

void main() {
  Widget wrap(Widget child) => MaterialApp(
        theme: BroumyTheme.light,
        home: Scaffold(body: Center(child: child)),
      );

  group('BroumyButton', () {
    testWidgets('renders label and fires onPressed', (tester) async {
      var tapped = 0;
      await tester.pumpWidget(wrap(BroumyButton(
        child: const Text('Odeslat'),
        onPressed: () => tapped++,
      )));

      expect(find.text('Odeslat'), findsOneWidget);
      await tester.tap(find.byType(BroumyButton));
      await tester.pump();
      expect(tapped, 1);
    });

    testWidgets('disabled when onPressed is null', (tester) async {
      await tester.pumpWidget(wrap(BroumyButton(
        child: const Text('Neaktivní'),
        onPressed: null,
      )));

      final button = tester.widget<BroumyButton>(find.byType(BroumyButton));
      expect(button.onPressed, isNull);
    });

    testWidgets('primary variant meets 4.5:1 contrast on surface',
        (tester) async {
      await tester.pumpWidget(wrap(BroumyButton(
        child: const Text('Odeslat'),
        onPressed: () {},
      )));

      final ratio = contrast(BroumyColors.primary, BroumyColors.surface);
      expect(ratio, greaterThanOrEqualTo(BroumyA11y.minContrastRatio));
    });

    testWidgets('white label on primary meets 4.5:1 contrast', (tester) async {
      await tester.pumpWidget(wrap(BroumyButton(
        child: const Text('Odeslat'),
        onPressed: () {},
      )));

      final ratio = contrast(BroumyColors.textOnPrimary, BroumyColors.primary);
      expect(ratio, greaterThanOrEqualTo(BroumyA11y.minContrastRatio));
    });

    testWidgets('exposes button role and optional semantic label',
        (tester) async {
      await tester.pumpWidget(wrap(BroumyButton(
        child: const Text('Další'),
        semanticLabel: 'Přejít na další krok',
        onPressed: () {},
      )));

      final semantics = tester.getSemantics(find.byType(BroumyButton));
      expect(semantics.flagsCollection.isButton, isTrue);
      expect(semantics.label, contains('Přejít na další krok'));
    });

    testWidgets('touch target is at least 48px tall', (tester) async {
      await tester.pumpWidget(wrap(BroumyButton(
        child: const Text('Odeslat'),
        onPressed: () {},
      )));

      final button = tester.getSize(find.byType(BroumyButton));
      expect(button.height, greaterThanOrEqualTo(BroumyA11y.minTouchTarget));
    });

    testWidgets('renders each variant without error', (tester) async {
      for (final variant in BroumyButtonVariant.values) {
        await tester.pumpWidget(wrap(BroumyButton(
          child: const Text('Tlačítko'),
          variant: variant,
          onPressed: () {},
        )));
        expect(find.byType(BroumyButton), findsOneWidget);
      }
    });

    testWidgets('loading state replaces label with spinner', (tester) async {
      await tester.pumpWidget(wrap(BroumyButton(
        child: const Text('Ukládám'),
        loading: true,
        onPressed: () {},
      )));

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Ukládám'), findsNothing);
    });
  });
}
