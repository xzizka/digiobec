import 'dart:convert';

/// Decodes a field that the backend serialises as a JSON-encoded **string**
/// rather than a nested object.
///
/// Several backend DTOs store JSON documents in `jsonb` columns and expose them
/// as `String`, not as a nested object:
///
/// * `GET /api/forms/{key}` → `schema`, `uiSchema`
///   (`FormController.form` returns `definition.schema`, declared
///   `val schema: String` in `FormDefinition.kt`)
/// * `GET /api/submissions/{trackingCode}` → `formData`
///   (`val formData: String` in `SubmissionResponseDto.kt`)
///
/// Casting those straight to `Map<String, dynamic>` throws a `TypeError` at
/// runtime — and a trailing `?? const {}` does **not** rescue it, because the
/// failed cast throws before the null-coalesce is ever reached. The web client
/// hits the same contract and handles it with `JSON.parse` (see
/// `apps/citizen-web/src/features/catalog/api/formsApi.ts`).
///
/// Accepts an already-decoded [Map] as well, so a backend that later switches
/// to emitting nested objects keeps working. Anything else — null, a malformed
/// string, a JSON scalar or list — yields an empty map, matching the tolerant
/// parsing style used across these `fromJson` factories.
Map<String, dynamic> decodeJsonMapField(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  if (value is String) {
    if (value.isEmpty) return const <String, dynamic>{};
    try {
      final decoded = jsonDecode(value);
      if (decoded is Map<String, dynamic>) return decoded;
      if (decoded is Map) return Map<String, dynamic>.from(decoded);
    } on FormatException {
      return const <String, dynamic>{};
    }
  }
  return const <String, dynamic>{};
}
