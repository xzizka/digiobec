/// gov.cz design system tokens — single source of truth for the Flutter app.
///
/// The React admin app mirrors these values in
/// `admin-web/src/theme/govcz-tokens.css`; a CI job verifies that the two
/// stay in sync (see `.github/workflows/a11y.yml`).
///
/// Palette follows the official gov.cz design system:
///   * primary   #004B87  (gov.cz blue)
///   * secondary #007B3D  (positive / success green)
///   * semantic  red, orange, sky blue
library;

import 'package:flutter/material.dart';

/// Semantic color roles for gov.cz UI.
class GovCzColors {
  const GovCzColors._();

  // Brand
  static const Color primary = Color(0xFF004B87);
  static const Color primaryHover = Color(0xFF003D7A);
  static const Color primaryContainer = Color(0xFFE5F0F8);
  static const Color onPrimary = Color(0xFFFFFFFF);

  static const Color secondary = Color(0xFF007B3D);
  static const Color secondaryHover = Color(0xFF00622F);
  static const Color secondaryContainer = Color(0xFFE3F4EA);
  static const Color onSecondary = Color(0xFFFFFFFF);

  // Semantics
  static const Color info = Color(0xFF00A5D7);
  static const Color infoContainer = Color(0xFFE5F7FC);
  static const Color onInfo = Color(0xFFFFFFFF);

  static const Color success = Color(0xFF007B3D);
  static const Color successContainer = Color(0xFFE3F4EA);
  static const Color onSuccess = Color(0xFFFFFFFF);

  static const Color warning = Color(0xFFEB3D00);
  static const Color warningContainer = Color(0xFFFDEDE6);
  static const Color onWarning = Color(0xFFFFFFFF);

  static const Color error = Color(0xFFD71920);
  static const Color errorContainer = Color(0xFFFBE9EA);
  static const Color onError = Color(0xFFFFFFFF);

  // Surfaces
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceMuted = Color(0xFFF7F8FA);
  static const Color surfaceContainer = Color(0xFFF0F2F4);
  static const Color onSurface = Color(0xFF222222);

  // Text
  static const Color textPrimary = Color(0xFF222222);
  static const Color textSecondary = Color(0xFF7E7E7E);
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  static const Color textLink = Color(0xFF004B87);

  // Borders & focus
  static const Color border = Color(0xFFB9BEC4);
  static const Color borderStrong = Color(0xFF8A9098);
  static const Color focus = Color(0xFF003D7A);
  static const Color focusRing = Color(0xFF004B87);

  // Grayscale
  static const Color gray50 = Color(0xFFF7F8FA);
  static const Color gray100 = Color(0xFFF0F2F4);
  static const Color gray200 = Color(0xFFE1E4E8);
  static const Color gray300 = Color(0xFFC9CED4);
  static const Color gray400 = Color(0xFF8A9098);
  static const Color gray500 = Color(0xFF7E7E7E);
  static const Color gray700 = Color(0xFF3A3D42);
  static const Color gray900 = Color(0xFF222222);
}

/// Spacing scale (4px base grid).
class GovCzSpacing {
  const GovCzSpacing._();

  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;
  static const double section = 48;
  static const double page = 64;
}

/// Corner radii.
class GovCzRadii {
  const GovCzRadii._();

  static const double sm = 4;
  static const double md = 8;
  static const double lg = 12;
  static const double xl = 16;
  static const double pill = 999;
}

/// Typography scale using the gov.cz type ramp (Inter-ish metric).
class GovCzType {
  const GovCzType._();

  static const String fontFamily = 'Roboto';

  static const double xs = 12;
  static const double sm = 14;
  static const double base = 16;
  static const double lg = 18;
  static const double xl = 22;
  static const double xxl = 28;
  static const double display = 34;

  static const FontWeight regular = FontWeight.w400;
  static const FontWeight medium = FontWeight.w500;
  static const FontWeight semibold = FontWeight.w600;
  static const FontWeight bold = FontWeight.w700;
}

/// Elevation / shadow tokens (Material 3 baseline levels).
class GovCzElevation {
  const GovCzElevation._();

  static const double none = 0;
  static const double xs = 1;
  static const double sm = 2;
  static const double md = 4;
  static const double lg = 8;
  static const double xl = 16;
}

/// Motion durations (ms) aligned with Material motion guidance.
class GovCzMotion {
  const GovCzMotion._();

  static const Duration shortest = Duration(milliseconds: 100);
  static const Duration short = Duration(milliseconds: 200);
  static const Duration medium = Duration(milliseconds: 300);
  static const Duration long = Duration(milliseconds: 500);

  static const Curve standard = Curves.easeInOut;
  static const Curve emphasized = Curves.easeOut;
}

/// Accessibility constants shared across components.
class GovCzA11y {
  const GovCzA11y._();

  /// Minimum touch target size per WCAG 2.5.8 / Material guidance.
  static const double minTouchTarget = 48;

  /// Focus ring thickness used by all interactive components.
  static const double focusThickness = 3;

  /// Minimum contrast ratio required (WCAG 2.1 AA).
  static const double minContrastRatio = 4.5;
}
