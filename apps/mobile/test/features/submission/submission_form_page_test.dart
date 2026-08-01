import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:municipal_portal/features/submission/data/submission_repository.dart';
import 'package:municipal_portal/features/submission/presentation/submission_form_page.dart';
import 'package:municipal_portal/theme/broumy_theme.dart';

import '../../helpers/fake_submission_datasource.dart';

void main() {
  Future<SubmissionRepository> repo() async {
    return SubmissionRepository(datasource: FakeSubmissionDatasource());
  }

  Widget wrap(SubmissionRepository repository, String formKey) {
    return MaterialApp(
      theme: BroumyTheme.light,
      home: SubmissionFormPage(
        formKey: formKey,
        repository: repository,
      ),
    );
  }

  testWidgets('renders fields from schema', (tester) async {
    final repository = await repo();
    await tester.pumpWidget(wrap(repository, 'info-request'));
    await tester.pumpAndSettle();

    expect(find.text('Žádost o informace'), findsWidgets);
    expect(find.text('Jméno a příjmení'), findsOneWidget);
    expect(find.text('Kontakt'), findsOneWidget);
    expect(find.textContaining('Typ žádosti'), findsOneWidget);
    expect(find.text('Souhlas'), findsOneWidget);
  });

  testWidgets('conditional field hidden by default and shown on select',
      (tester) async {
    final repository = await repo();
    await tester.pumpWidget(wrap(repository, 'info-request'));
    await tester.pumpAndSettle();

    expect(find.text('Požadované datum'), findsNothing);

    await tester.tap(find.text('info-document'));
    await tester.pumpAndSettle();

    expect(find.text('Požadované datum'), findsOneWidget);
  });

  testWidgets('local validation blocks submit and shows errors',
      (tester) async {
    final repository = await repo();
    await tester.pumpWidget(wrap(repository, 'info-request'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Odeslat žádost'));
    await tester.pumpAndSettle();

    expect(find.text('Toto pole je povinné.'), findsWidgets);
  });

  testWidgets('successful submit shows tracking code', (tester) async {
    final repository = await repo();
    await tester.pumpWidget(wrap(repository, 'info-request'));
    await tester.pumpAndSettle();

    await tester.ensureVisible(
      find.widgetWithText(TextField, 'Jméno a příjmení'),
    );
    await tester.enterText(
      find.widgetWithText(TextField, 'Jméno a příjmení'),
      'Anna Nováková',
    );
    await tester.enterText(
      find.widgetWithText(TextField, 'Kontakt'),
      'anna@example.cz',
    );
    await tester.ensureVisible(
      find.widgetWithText(TextField, 'Žádané informace'),
    );
    await tester.enterText(
      find.widgetWithText(TextField, 'Žádané informace'),
      'Žádám o kopii územního rozhodnutí.',
    );

    final infoDocument = find.widgetWithText(FilterChip, 'info-document');
    await tester.ensureVisible(infoDocument);
    await tester.pumpAndSettle();
    await tester.tap(infoDocument);
    await tester.pumpAndSettle();

    final email = find.widgetWithText(FilterChip, 'email');
    await tester.ensureVisible(email);
    await tester.pumpAndSettle();
    await tester.tap(email);
    await tester.pumpAndSettle();

    final agree = find.widgetWithText(CheckboxListTile, 'Souhlas');
    await tester.ensureVisible(agree);
    await tester.pumpAndSettle();
    await tester.tap(agree);
    await tester.pumpAndSettle();

    final submit = find.text('Odeslat žádost');
    await tester.ensureVisible(submit);
    await tester.tap(submit);
    await tester.pumpAndSettle();

    expect(find.text('Podání bylo odesláno'), findsOneWidget);
    expect(find.textContaining('TC-0001'), findsOneWidget);
  });
}
