import 'dart:convert';

import 'package:municipal_portal/features/submission/data/submission_remote_datasource.dart';
import 'package:municipal_portal/features/submission/domain/submission.dart';

/// Deterministic in-memory backend double used across submission feature tests.
///
/// The payload shapes here mirror the **real** backend wire contract. In
/// particular `schema`, `uiSchema` and `formData` are JSON-encoded strings, not
/// nested objects, because that is what `FormController.form` and
/// `SubmissionResponseDto` actually emit. An earlier version of this fake
/// returned them as maps, which made the whole mobile suite pass against a
/// shape the backend never sends and hid a runtime `TypeError` in
/// `FormDefinition.fromJson` / `Submission.fromJson`.
class FakeSubmissionDatasource implements SubmissionRemoteDatasource {
  int catalogCalls = 0;
  int submitCalls = 0;
  int nextTrackingCode = 1;

  @override
  Future<List<Map<String, dynamic>>> fetchFormCatalog() async {
    catalogCalls++;
    return [
      {
        'formKey': 'info-request',
        'title': {
          'cs': 'Žádost o informace',
          'en': 'Freedom of Information Request',
        },
        'description': {'cs': 'InfZ', 'en': 'InfZ'},
        'department': 'Podatelna',
      },
    ];
  }

  @override
  Future<Map<String, dynamic>> fetchFormSchema(String formKey) async {
    return {
      'formKey': formKey,
      'title': {'cs': 'Žádost o informace', 'en': 'Freedom of Information Request'},
      'description': {'cs': '', 'en': ''},
      'schema': jsonEncode({
        'type': 'object',
        'required': [
          'requesterName',
          'requesterContact',
          'requestType',
          'description',
          'deliveryMethod',
          'agreeTerms',
        ],
        'properties': {
          'requesterName': {
            'type': 'string',
            'title': 'Jméno a příjmení',
            'minLength': 2,
            'maxLength': 120,
          },
          'requesterContact': {
            'type': 'string',
            'title': 'Kontakt',
            'minLength': 5,
          },
          'requestType': {
            'type': 'string',
            'title': 'Typ žádosti',
            'enum': ['info-document', 'info-reuse', 'other'],
          },
          'description': {
            'type': 'string',
            'title': 'Žádané informace',
            'minLength': 10,
            'maxLength': 5000,
          },
          'deliveryMethod': {
            'type': 'string',
            'title': 'Způsob doručení',
            'enum': ['email', 'isds', 'mail'],
          },
          'dateNeeded': {
            'type': 'string',
            'format': 'date',
            'title': 'Požadované datum',
          },
          'agreeTerms': {
            'type': 'boolean',
            'title': 'Souhlas',
            'const': true,
          },
        },
      }),
      'uiSchema': jsonEncode({
        'requesterName': {'ui:widget': 'text'},
        'requesterContact': {'ui:widget': 'text'},
        'requestType': {'ui:widget': 'select'},
        'description': {'ui:widget': 'textarea'},
        'deliveryMethod': {'ui:widget': 'select'},
        'dateNeeded': {
          'ui:widget': 'date',
          'ui:condition': {'field': 'requestType', 'value': 'info-document'},
        },
        'agreeTerms': {'ui:widget': 'checkbox'},
      }),
    };
  }

  @override
  Future<Map<String, dynamic>> submit({
    required String formKey,
    required Map<String, dynamic> formData,
    String? contactEmail,
    String? contactPhone,
  }) async {
    submitCalls++;
    final code = 'TC-${(nextTrackingCode++).toString().padLeft(4, '0')}';
    return {
      'id': 'id-$code',
      'trackingCode': code,
      'formKey': formKey,
      'formData': jsonEncode(formData),
      'status': 'SUBMITTED',
      'contactEmail': contactEmail,
      'contactPhone': contactPhone,
      'submittedAt': '2026-08-01T10:00:00Z',
    };
  }
}

/// Convenience matcher helpers shared by feature tests.
Submission submissionFrom(Map<String, dynamic> json) =>
    Submission.fromJson(json);
