import 'package:flutter/foundation.dart';

/// Confirmation summary returned by `GET /api/submissions/{code}/confirmation`
/// (JSON variant). Drives the mobile confirmation page without parsing HTML.
@immutable
class Confirmation {
  const Confirmation({
    required this.trackingCode,
    required this.formTitle,
    required this.submittedAt,
    required this.verificationUrl,
    required this.rows,
  });

  final String trackingCode;
  final String formTitle;
  final String submittedAt;
  final String verificationUrl;
  final List<ConfirmationRow> rows;

  factory Confirmation.fromJson(Map<String, dynamic> json) {
    return Confirmation(
      trackingCode: json['trackingCode'] as String? ?? '',
      formTitle: json['formTitle'] as String? ?? '',
      submittedAt: json['submittedAt'] as String? ?? '',
      verificationUrl: json['verificationUrl'] as String? ?? '',
      rows: ((json['rows'] as List<dynamic>?) ?? const [])
          .map((e) => ConfirmationRow.fromJson((e as Map).cast<String, dynamic>()))
          .toList(),
    );
  }
}

@immutable
class ConfirmationRow {
  const ConfirmationRow({required this.label, required this.value});

  final String label;
  final String value;

  factory ConfirmationRow.fromJson(Map<String, dynamic> json) {
    return ConfirmationRow(
      label: json['label'] as String? ?? '',
      value: json['value'] as String? ?? '',
    );
  }
}
