import 'package:flutter/foundation.dart';

import 'package:municipal_portal/core/json/json_field.dart';

enum FormFieldType { text, textarea, select, date, checkbox }

extension FormFieldTypeX on FormFieldType {
  String get wire => name;

  static FormFieldType fromWire(String value) {
    switch (value) {
      case 'textarea':
        return FormFieldType.textarea;
      case 'select':
        return FormFieldType.select;
      case 'date':
        return FormFieldType.date;
      case 'checkbox':
        return FormFieldType.checkbox;
      default:
        return FormFieldType.text;
    }
  }
}

@immutable
class FormFieldSpec {
  const FormFieldSpec({
    required this.key,
    required this.label,
    required this.type,
    this.required = false,
    this.options = const [],
    this.minLength,
    this.maxLength,
    this.placeholder,
    this.conditionField,
    this.conditionValue,
  });

  final String key;
  final String label;
  final FormFieldType type;
  final bool required;
  final List<String> options;
  final int? minLength;
  final int? maxLength;
  final String? placeholder;
  final String? conditionField;
  final String? conditionValue;

  bool get isConditional => conditionField != null;

  bool isVisible(Map<String, dynamic> values) {
    if (!isConditional) return true;
    final actual = values[conditionField];
    return actual?.toString() == conditionValue;
  }
}

@immutable
class FormDefinition {
  const FormDefinition({
    required this.formKey,
    required this.titleCs,
    required this.titleEn,
    required this.fields,
  });

  final String formKey;
  final String titleCs;
  final String titleEn;
  final List<FormFieldSpec> fields;

  factory FormDefinition.fromJson(Map<String, dynamic> json) {
    // `schema`/`uiSchema` arrive JSON-encoded as strings, not as objects.
    final schema = decodeJsonMapField(json['schema']);
    final uiSchema = decodeJsonMapField(json['uiSchema']);
    final properties =
        (schema['properties'] as Map<String, dynamic>? ?? const {});
    final required =
        (schema['required'] as List<dynamic>? ?? const []).cast<String>();

    final title = (json['title'] as Map<String, dynamic>? ?? const {});
    final fields = properties.entries.map((entry) {
      final key = entry.key;
      final prop = entry.value as Map<String, dynamic>? ?? const {};
      final ui = uiSchema[key] as Map<String, dynamic>? ?? const {};
      final widget = (ui['ui:widget'] as String?) ?? 'text';

      final condition = ui['ui:condition'] as Map<String, dynamic>?;
      final enumValues = (prop['enum'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const <String>[];

      return FormFieldSpec(
        key: key,
        label: prop['title'] as String? ?? key,
        type: FormFieldTypeX.fromWire(widget),
        required: required.contains(key),
        options: enumValues,
        minLength: prop['minLength'] as int?,
        maxLength: prop['maxLength'] as int?,
        placeholder: (ui['ui:placeholder'] as String?) ?? '',
        conditionField: condition?['field'] as String?,
        conditionValue: condition?['value']?.toString(),
      );
    }).toList();

    return FormDefinition(
      formKey: json['formKey'] as String? ?? '',
      titleCs: title['cs'] as String? ?? '',
      titleEn: title['en'] as String? ?? '',
      fields: fields,
    );
  }
}
