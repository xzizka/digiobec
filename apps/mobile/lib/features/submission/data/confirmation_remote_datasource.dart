import 'dart:typed_data';

import 'package:dio/dio.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/dio_client.dart';

/// Fetches the confirmation resources (HTML page, PDF/A-1b binary, JSON data)
/// for a submission, keyed by the unguessable tracking code.
class ConfirmationRemoteDatasource {
  ConfirmationRemoteDatasource({Dio? dio}) : _dio = dio ?? DioClient().dio;

  final Dio _dio;

  String _confirmationUrl(String trackingCode) =>
      '${AppConstants.pdfConfirmationEndpoint}/$trackingCode/confirmation';

  Future<Map<String, dynamic>> fetchConfirmationData(String trackingCode) async {
    final response = await _dio.get<Map<String, dynamic>>(
      _confirmationUrl(trackingCode),
      options: Options(headers: {'Accept': 'application/json'}),
    );
    return response.data ?? const {};
  }

  Future<String> fetchConfirmationHtml(String trackingCode) async {
    final response = await _dio.get<String>(
      _confirmationUrl(trackingCode),
      options: Options(
        headers: {'Accept': 'text/html'},
        responseType: ResponseType.plain,
      ),
    );
    return response.data ?? '';
  }

  Future<Uint8List> fetchConfirmationPdf(String trackingCode) async {
    final response = await _dio.get<List<int>>(
      '${AppConstants.pdfConfirmationEndpoint}/$trackingCode/pdf',
      options: Options(
        headers: {'Accept': 'application/pdf'},
        responseType: ResponseType.bytes,
      ),
    );
    final data = response.data;
    if (data == null) {
      throw StateError('Prázdná odpověď PDF pro $trackingCode');
    }
    return Uint8List.fromList(data);
  }
}
