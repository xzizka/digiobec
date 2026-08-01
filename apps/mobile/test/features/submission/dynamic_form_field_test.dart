import 'package:flutter_test/flutter_test.dart';
import 'package:municipal_portal/features/submission/domain/form_field.dart';
import 'package:municipal_portal/features/submission/data/submission_repository.dart';

import '../../helpers/fake_submission_datasource.dart';

void main() {
  late SubmissionRepository repository;

  setUp(() {
    repository = SubmissionRepository(
      datasource: FakeSubmissionDatasource(),
    );
  });

  FormDefinition buildDefinition() => FormDefinition(
        formKey: 'info-request',
        titleCs: 'Žádost o informace',
        titleEn: 'Freedom of Information Request',
        fields: const [
          FormFieldSpec(
            key: 'requesterName',
            label: 'Jméno a příjmení',
            type: FormFieldType.text,
            required: true,
            minLength: 2,
            maxLength: 120,
          ),
          FormFieldSpec(
            key: 'requestType',
            label: 'Typ žádosti',
            type: FormFieldType.select,
            required: true,
            options: ['info-document', 'info-reuse', 'other'],
          ),
          FormFieldSpec(
            key: 'dateNeeded',
            label: 'Požadované datum',
            type: FormFieldType.date,
            conditionField: 'requestType',
            conditionValue: 'info-document',
          ),
          FormFieldSpec(
            key: 'agreeTerms',
            label: 'Souhlas',
            type: FormFieldType.checkbox,
            required: true,
          ),
        ],
      );

  group('validateForm', () {
    test('returns no errors for a valid payload', () {
      final definition = buildDefinition();
      final errors = repository.validateForm(definition, {
        'requesterName': 'Anna Nováková',
        'requestType': 'info-document',
        'dateNeeded': '2026-09-01',
        'agreeTerms': true,
      });
      expect(errors, isEmpty);
    });

    test('flags missing required text field', () {
      final definition = buildDefinition();
      final errors = repository.validateForm(definition, {
        'requesterName': '',
        'requestType': 'info-document',
        'agreeTerms': true,
      });
      expect(errors.containsKey('requesterName'), isTrue);
    });

    test('enforces minLength', () {
      final definition = buildDefinition();
      final errors = repository.validateForm(definition, {
        'requesterName': 'A',
        'requestType': 'info-document',
        'agreeTerms': true,
      });
      expect(errors['requesterName'], contains('2'));
    });

    test('rejects out-of-enum select value', () {
      final definition = buildDefinition();
      final errors = repository.validateForm(definition, {
        'requesterName': 'Anna Nováková',
        'requestType': 'unknown',
        'agreeTerms': true,
      });
      expect(errors.containsKey('requestType'), isTrue);
    });

    test('conditional field is ignored when not visible', () {
      final definition = buildDefinition();
      final errors = repository.validateForm(definition, {
        'requesterName': 'Anna Nováková',
        'requestType': 'other',
        'dateNeeded': '',
        'agreeTerms': true,
      });
      expect(errors.containsKey('dateNeeded'), isFalse);
    });

    test('date field requires valid ISO date when visible', () {
      final definition = buildDefinition();
      final errors = repository.validateForm(definition, {
        'requesterName': 'Anna Nováková',
        'requestType': 'info-document',
        'dateNeeded': 'not-a-date',
        'agreeTerms': true,
      });
      expect(errors.containsKey('dateNeeded'), isTrue);
    });

    test('checkbox must be checked', () {
      final definition = buildDefinition();
      final errors = repository.validateForm(definition, {
        'requesterName': 'Anna Nováková',
        'requestType': 'info-document',
        'agreeTerms': false,
      });
      expect(errors.containsKey('agreeTerms'), isTrue);
    });
  });

  group('FormFieldSpec.isVisible', () {
    test('unconditional fields are always visible', () {
      const field = FormFieldSpec(
        key: 'a',
        label: 'A',
        type: FormFieldType.text,
      );
      expect(field.isVisible({}), isTrue);
    });

    test('conditional field visible when dependency matches', () {
      const field = FormFieldSpec(
        key: 'dateNeeded',
        label: 'Datum',
        type: FormFieldType.date,
        conditionField: 'requestType',
        conditionValue: 'info-document',
      );
      expect(
        field.isVisible({'requestType': 'info-document'}),
        isTrue,
      );
      expect(
        field.isVisible({'requestType': 'other'}),
        isFalse,
      );
    });
  });
}
