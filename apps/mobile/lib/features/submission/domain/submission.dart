import 'package:flutter/foundation.dart';

import 'package:municipal_portal/core/json/json_field.dart';

@immutable
class Submission {
  const Submission({
    required this.id,
    required this.trackingCode,
    required this.formKey,
    required this.formData,
    required this.status,
    this.contactEmail,
    this.contactPhone,
    required this.submittedAt,
  });

  final String id;
  final String trackingCode;
  final String formKey;
  final Map<String, dynamic> formData;
  final String status;
  final String? contactEmail;
  final String? contactPhone;
  final DateTime submittedAt;

  factory Submission.fromJson(Map<String, dynamic> json) {
    return Submission(
      id: json['id'] as String? ?? '',
      trackingCode: json['trackingCode'] as String? ?? '',
      formKey: json['formKey'] as String? ?? '',
      // `formData` arrives JSON-encoded as a string, not as an object.
      formData: decodeJsonMapField(json['formData']),
      status: json['status'] as String? ?? 'SUBMITTED',
      contactEmail: json['contactEmail'] as String?,
      contactPhone: json['contactPhone'] as String?,
      submittedAt: DateTime.tryParse(json['submittedAt'] as String? ?? '') ??
          DateTime.now(),
    );
  }
}

@immutable
class FormCatalogEntry {
  const FormCatalogEntry({
    required this.formKey,
    required this.title,
    required this.description,
    required this.department,
  });

  final String formKey;
  final Map<String, String> title;
  final Map<String, String> description;
  final String department;

  String titleFor(String locale) => title[locale] ?? title['cs'] ?? formKey;

  factory FormCatalogEntry.fromJson(Map<String, dynamic> json) {
    return FormCatalogEntry(
      formKey: json['formKey'] as String? ?? '',
      title: (json['title'] as Map<String, dynamic>? ?? const {})
          .map((k, v) => MapEntry(k, v.toString())),
      description: (json['description'] as Map<String, dynamic>? ?? const {})
          .map((k, v) => MapEntry(k, v.toString())),
      department: json['department'] as String? ?? '',
    );
  }
}
