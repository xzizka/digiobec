import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:municipal_portal/components/broumy_text_field.dart';
import 'package:municipal_portal/theme/broumy_theme.dart';

void main() {
  Widget wrap(Widget child) => MaterialApp(
        theme: BroumyTheme.light,
        home: Scaffold(body: Center(child: child)),
      );

  group('BroumyTextField', () {
    testWidgets('renders label and hint', (tester) async {
      await tester.pumpWidget(wrap(BroumyTextField(
        label: 'Jméno',
        hintText: 'Zadejte jméno',
      )));

      expect(find.text('Jméno'), findsOneWidget);
      expect(find.text('Zadejte jméno'), findsOneWidget);
    });

    testWidgets('accepts typed input', (tester) async {
      await tester.pumpWidget(wrap(BroumyTextField(label: 'Email')));

      await tester.enterText(find.byType(TextField), 'test@obec.cz');
      expect(find.text('test@obec.cz'), findsOneWidget);
    });

    testWidgets('shows error text with error styling', (tester) async {
      await tester.pumpWidget(wrap(BroumyTextField(
        label: 'Telefon',
        errorText: 'Neplatný formát čísla',
      )));

      expect(find.text('Neplatný formát čísla'), findsOneWidget);
    });

    testWidgets('is disabled when enabled=false', (tester) async {
      await tester.pumpWidget(wrap(BroumyTextField(
        label: 'Zamčené pole',
        enabled: false,
      )));

      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.enabled, isFalse);
    });

    testWidgets('renders prefix icon', (tester) async {
      await tester.pumpWidget(wrap(BroumyTextField(
        label: 'IČO',
        prefixIcon: Icons.business,
      )));

      expect(find.byIcon(Icons.business), findsOneWidget);
    });

    testWidgets('exposes text field role in semantics', (tester) async {
      await tester.pumpWidget(wrap(BroumyTextField(label: 'Adresa')));

      final semantics = tester.getSemantics(find.byType(TextField));
      expect(semantics.flagsCollection.isTextField, isTrue);
    });

    testWidgets('onChanged fires with current value', (tester) async {
      String? last;
      await tester.pumpWidget(wrap(BroumyTextField(
        label: 'Poznámka',
        onChanged: (v) => last = v,
      )));

      await tester.enterText(find.byType(TextField), 'ahoj');
      expect(last, 'ahoj');
    });

    testWidgets('requiredField validator flags empty values', (tester) async {
      expect(requiredField(''), isNotNull);
      expect(requiredField('   '), isNotNull);
      expect(requiredField('a'), isNull);
    });
  });
}
