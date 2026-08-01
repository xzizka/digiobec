import 'dart:typed_data';

import 'package:municipal_portal/features/submission/data/confirmation_remote_datasource.dart';

/// Deterministic in-memory backend double for the confirmation feature.
class FakeConfirmationDatasource implements ConfirmationRemoteDatasource {
  final Map<String, Map<String, dynamic>> dataByCode;

  FakeConfirmationDatasource({
    Map<String, Map<String, dynamic>>? dataByCode,
  }) : dataByCode = dataByCode ??
            {
              'TC-0001': {
                'trackingCode': 'TC-0001',
                'formTitle': 'Žádost o informace',
                'submittedAt': '1. 8. 2026 14:32',
                'verificationUrl': 'https://obec.cz/overeni/TC-0001',
                'rows': [
                  {'label': 'Jméno a příjmení', 'value': 'Anna Nováková'},
                  {'label': 'Typ žádosti', 'value': 'Poskytnutí informace'},
                ],
              },
            };

  int dataCalls = 0;
  int htmlCalls = 0;
  int pdfCalls = 0;

  @override
  Future<Map<String, dynamic>> fetchConfirmationData(String trackingCode) async {
    dataCalls++;
    final data = dataByCode[trackingCode];
    if (data == null) {
      throw StateError('Unknown tracking code: $trackingCode');
    }
    return data;
  }

  @override
  Future<String> fetchConfirmationHtml(String trackingCode) async {
    htmlCalls++;
    return '<html><body>$trackingCode</body></html>';
  }

  @override
  Future<Uint8List> fetchConfirmationPdf(String trackingCode) async {
    pdfCalls++;
    return Uint8List.fromList([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
  }
}
