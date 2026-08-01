class AppConstants {
  static const String appName = 'Občanský portál obce';
  static const String appVersion = '1.0.0';

  // API Configuration
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8081',
  );

  // Health endpoint
  static const String healthEndpoint = '/api/health';

  // Form endpoints (Phase 1)
  static const String formsEndpoint = '/api/forms';
  static const String submissionsEndpoint = '/api/submissions';

  // RÚIAN autocomplete
  static const String ruaianAutocompleteEndpoint = '/api/addresses/autocomplete';

  // Czech POINT locator
  static const String czechPointLocatorEndpoint = '/api/czech-points/nearby';

  // PDF confirmation
  static const String pdfConfirmationEndpoint = '/api/submissions';

  // Storage keys
  static const String storageKeyDraftSubmissions = 'draft_submissions';
  static const String storageKeyUserPreferences = 'user_preferences';
}