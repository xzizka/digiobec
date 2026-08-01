import 'dart:convert';

import '../domain/form_field.dart';
import '../domain/submission.dart';
import 'submission_remote_datasource.dart';

class SubmissionRepository {
  SubmissionRepository({SubmissionRemoteDatasource? datasource})
      : _datasource = datasource ?? SubmissionRemoteDatasource();

  final SubmissionRemoteDatasource _datasource;

  Future<List<FormCatalogEntry>> fetchCatalog() async {
    final raw = await _datasource.fetchFormCatalog();
    return raw.map(FormCatalogEntry.fromJson).toList();
  }

  Future<FormDefinition> fetchForm(String formKey) async {
    final raw = await _datasource.fetchFormSchema(formKey);
    return FormDefinition.fromJson(raw);
  }

  Future<Submission> submit({
    required String formKey,
    required Map<String, dynamic> formData,
    String? contactEmail,
    String? contactPhone,
  }) async {
    final raw = await _datasource.submit(
      formKey: formKey,
      formData: formData,
      contactEmail: contactEmail,
      contactPhone: contactPhone,
    );
    return Submission.fromJson(raw);
  }

  /// Validates locally (client-side, instant feedback). Mirrors server rules:
  /// required, min/max length, enum membership, date format, checkbox const.
  Map<String, String> validateForm(
    FormDefinition definition,
    Map<String, dynamic> values,
  ) {
    final errors = <String, String>{};
    for (final field in definition.fields) {
      if (!field.isVisible(values)) continue;
      final value = values[field.key];

      if (field.required && (value == null || value.toString().isEmpty)) {
        errors[field.key] = 'Toto pole je povinné.';
        continue;
      }
      if (value == null || value.toString().isEmpty) continue;

      switch (field.type) {
        case FormFieldType.text:
        case FormFieldType.textarea:
          final text = value.toString();
          if (field.minLength != null && text.length < field.minLength!) {
            errors[field.key] =
                'Minimální délka je ${field.minLength} znaků.';
          }
          if (field.maxLength != null && text.length > field.maxLength!) {
            errors[field.key] =
                'Maximální délka je ${field.maxLength} znaků.';
          }
          break;
        case FormFieldType.select:
          if (field.options.isNotEmpty &&
              !field.options.contains(value.toString())) {
            errors[field.key] = 'Není platná volba.';
          }
          break;
        case FormFieldType.date:
          final parsed = DateTime.tryParse(value.toString());
          if (parsed == null) {
            errors[field.key] = 'Zadejte platné datum (RRRR-MM-DD).';
          }
          break;
        case FormFieldType.checkbox:
          if (value != true) {
            errors[field.key] = 'Pole musí být zaškrtnuté.';
          }
          break;
      }
    }
    return errors;
  }

  String encodeFormData(Map<String, dynamic> values) =>
      jsonEncode(values);
}
