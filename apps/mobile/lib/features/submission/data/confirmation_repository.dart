import 'dart:typed_data';

import 'confirmation_remote_datasource.dart';
import '../domain/confirmation.dart';

class ConfirmationRepository {
  ConfirmationRepository({ConfirmationRemoteDatasource? datasource})
      : _datasource = datasource ?? ConfirmationRemoteDatasource();

  final ConfirmationRemoteDatasource _datasource;

  Future<Confirmation> fetchConfirmation(String trackingCode) async {
    final raw = await _datasource.fetchConfirmationData(trackingCode);
    return Confirmation.fromJson(raw);
  }

  Future<String> fetchConfirmationHtml(String trackingCode) =>
      _datasource.fetchConfirmationHtml(trackingCode);

  Future<Uint8List> fetchConfirmationPdf(String trackingCode) =>
      _datasource.fetchConfirmationPdf(trackingCode);
}
