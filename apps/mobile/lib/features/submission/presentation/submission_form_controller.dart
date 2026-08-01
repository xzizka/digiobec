import 'package:flutter/foundation.dart';

import '../data/submission_repository.dart';
import '../domain/form_field.dart';
import '../domain/submission.dart';

enum SubmissionFormState { idle, loading, submitting, success, error }

class SubmissionFormController extends ChangeNotifier {
  SubmissionFormController({required SubmissionRepository repository})
      : _repository = repository;

  final SubmissionRepository _repository;

  FormDefinition? _definition;
  Map<String, dynamic> _values = {};
  Map<String, String> _fieldErrors = {};
  String? _submitError;
  Submission? _result;
  SubmissionFormState _state = SubmissionFormState.idle;

  FormDefinition? get definition => _definition;
  Map<String, dynamic> get values => _values;
  Map<String, String> get fieldErrors => _fieldErrors;
  String? get submitError => _submitError;
  Submission? get result => _result;
  SubmissionFormState get state => _state;
  bool get isBusy =>
      _state == SubmissionFormState.loading ||
      _state == SubmissionFormState.submitting;

  /// Loads the schema from the backend and prepares the form.
  Future<void> load(String formKey) async {
    _state = SubmissionFormState.loading;
    notifyListeners();
    try {
      _definition = await _repository.fetchForm(formKey);
      _values = {};
      _fieldErrors = {};
      _state = SubmissionFormState.idle;
    } catch (e) {
      _submitError = 'Nepodařilo se načíst formulář: $e';
      _state = SubmissionFormState.error;
    }
    notifyListeners();
  }

  void setValue(String key, dynamic value) {
    _values[key] = value;
    if (_fieldErrors.containsKey(key)) {
      _fieldErrors.remove(key);
    }
    notifyListeners();
  }

  /// Runs local validation and, when valid, submits to the backend.
  Future<void> submit() async {
    final definition = _definition;
    if (definition == null) return;

    _fieldErrors = _repository.validateForm(definition, _values);
    if (_fieldErrors.isNotEmpty) {
      notifyListeners();
      return;
    }

    _state = SubmissionFormState.submitting;
    _submitError = null;
    notifyListeners();

    try {
      _result = await _repository.submit(
        formKey: definition.formKey,
        formData: _values,
        contactEmail: _values['requesterContact']?.toString(),
      );
      _state = SubmissionFormState.success;
    } catch (e) {
      _submitError = 'Odeslání se nezdařilo: $e';
      _state = SubmissionFormState.error;
    }
    notifyListeners();
  }
}
