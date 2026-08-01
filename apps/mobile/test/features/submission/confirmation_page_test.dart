import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:municipal_portal/features/submission/data/confirmation_repository.dart';
import 'package:municipal_portal/features/submission/presentation/confirmation_page.dart';
import 'package:municipal_portal/theme/broumy_theme.dart';

import '../../helpers/fake_confirmation_datasource.dart';

void main() {
  Future<ConfirmationRepository> repo() async {
    return ConfirmationRepository(
      datasource: FakeConfirmationDatasource(),
    );
  }

  Widget wrap(ConfirmationRepository repository) {
    return MaterialApp(
      theme: BroumyTheme.light,
      home: ConfirmationPage(
        trackingCode: 'TC-0001',
        repository: repository,
      ),
    );
  }

  testWidgets('renders tracking code, QR and submitted data', (tester) async {
    final repository = await repo();
    await tester.pumpWidget(wrap(repository));
    await tester.pumpAndSettle();

    expect(find.text('Podání bylo odesláno'), findsOneWidget);
    expect(find.text('Žádost o informace'), findsWidgets);
    expect(find.text('TC-0001'), findsWidgets);
    expect(find.text('Jméno a příjmení'), findsOneWidget);
    expect(find.text('Anna Nováková'), findsOneWidget);
    expect(find.text('Stáhnout PDF'), findsOneWidget);
    expect(find.text('Zobrazit PDF'), findsOneWidget);
  });

  testWidgets('copy button copies tracking code to clipboard', (tester) async {
    final repository = await repo();
    await tester.pumpWidget(wrap(repository));
    await tester.pumpAndSettle();

    final calls = <MethodCall>[];
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      (MethodCall call) async {
        calls.add(call);
        return null;
      },
    );

    await tester.tap(find.byTooltip('Zkopírovat sledovací kód'));
    await tester.pumpAndSettle();

    expect(
      find.text('Sledovací kód byl zkopírován'),
      findsOneWidget,
    );
    final setData = calls
        .where((c) => c.method == 'Clipboard.setData')
        .map((c) => c.arguments as Map)
        .toList();
    expect(setData, hasLength(1));
    expect((setData.single['text'] as String), 'TC-0001');
  });

  testWidgets('unknown tracking code shows error with retry', (tester) async {
    final datasource = FakeConfirmationDatasource();
    final repository = ConfirmationRepository(datasource: datasource);

    await tester.pumpWidget(MaterialApp(
      theme: BroumyTheme.light,
      home: ConfirmationPage(trackingCode: 'TC-9999', repository: repository),
    ));
    await tester.pumpAndSettle();

    expect(
      find.text('Potvrzení se nepodařilo načíst. Zkuste to znovu.'),
      findsOneWidget,
    );
    expect(find.text('Zkusit znovu'), findsOneWidget);
  });
}
