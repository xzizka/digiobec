import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:municipal_portal/core/json/json_field.dart';
import 'package:municipal_portal/features/submission/domain/form_field.dart';
import 'package:municipal_portal/features/submission/domain/submission.dart';

/// Contract tests pinning the mobile parsers to the shapes the backend really
/// emits.
///
/// These exist because the mobile suite previously passed against a test double
/// that returned `schema`/`uiSchema`/`formData` as nested objects, while
/// `FormController.form` and `SubmissionResponseDto` emit them as JSON-encoded
/// strings. Every parse of a real response threw a `TypeError`, and no test
/// could see it. The payloads below are written the way the Kotlin DTOs
/// serialise them — if the backend contract changes, these fail first.
void main() {
  group('backend wire contract', () {
    test('FormDefinition parses schema/uiSchema delivered as JSON strings', () {
      // Shape of GET /api/forms/{key}: FormController.form emits `schema` and
      // `uiSchema` from FormDefinition.kt, both declared `val ...: String`.
      final response = <String, dynamic>{
        'formKey': 'info-request',
        'title': {'cs': 'Žádost o informace', 'en': 'FOI Request'},
        'description': {'cs': '', 'en': ''},
        'schema': jsonEncode({
          'type': 'object',
          'required': ['requesterName'],
          'properties': {
            'requesterName': {
              'type': 'string',
              'title': 'Jméno a příjmení',
              'minLength': 2,
            },
            'note': {'type': 'string', 'title': 'Poznámka'},
          },
        }),
        'uiSchema': jsonEncode({
          'requesterName': {'ui:widget': 'text', 'ui:placeholder': 'Jan Novák'},
          'note': {'ui:widget': 'textarea'},
        }),
      };

      final definition = FormDefinition.fromJson(response);

      expect(definition.formKey, 'info-request');
      expect(definition.titleCs, 'Žádost o informace');
      expect(definition.fields, hasLength(2));

      final name =
          definition.fields.firstWhere((f) => f.key == 'requesterName');
      expect(name.label, 'Jméno a příjmení');
      expect(name.required, isTrue);
      expect(name.minLength, 2);
      expect(name.placeholder, 'Jan Novák');
      expect(name.type, FormFieldType.text);

      final note = definition.fields.firstWhere((f) => f.key == 'note');
      expect(note.required, isFalse);
      expect(note.type, FormFieldType.textarea);
    });

    test('Submission parses formData delivered as a JSON string', () {
      // Shape of GET /api/submissions/{trackingCode}: SubmissionResponseDto
      // declares `val formData: String`.
      final submission = Submission.fromJson(<String, dynamic>{
        'id': 'a1b2',
        'trackingCode': 'TC-0001',
        'formKey': 'info-request',
        'formData': jsonEncode({'requesterName': 'Jan Novák', 'agreeTerms': true}),
        'status': 'SUBMITTED',
        'contactEmail': 'jan@example.cz',
        'submittedAt': '2026-08-01T10:00:00Z',
      });

      expect(submission.trackingCode, 'TC-0001');
      expect(submission.formData['requesterName'], 'Jan Novák');
      expect(submission.formData['agreeTerms'], isTrue);
      expect(submission.contactEmail, 'jan@example.cz');
      expect(submission.submittedAt.toUtc().year, 2026);
    });
  });

  group('decodeJsonMapField', () {
    test('decodes a JSON object string', () {
      expect(decodeJsonMapField('{"a":1}'), {'a': 1});
    });

    test('passes an already-decoded map through unchanged', () {
      // Forward-compatible: a backend that later emits nested objects still works.
      expect(decodeJsonMapField({'a': 1}), {'a': 1});
    });

    test('yields an empty map for null, blank, malformed and non-object JSON',
        () {
      expect(decodeJsonMapField(null), isEmpty);
      expect(decodeJsonMapField(''), isEmpty);
      expect(decodeJsonMapField('not json'), isEmpty);
      expect(decodeJsonMapField('[1,2,3]'), isEmpty);
      expect(decodeJsonMapField('42'), isEmpty);
      expect(decodeJsonMapField(42), isEmpty);
    });
  });
}
