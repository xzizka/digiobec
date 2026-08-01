/// Broumy design system tokens — single source of truth for the Flutter app.
///
/// Palette extracted from the official site broumy.cz (Galileo/LEGO skin
/// `broumy.cz_lego2`):
///   * primary green      #117B30  (links, item names, primary buttons, footer)
///   * primary hover      #188739  (menu hover / focus-within)
///   * nav teal           #184461  (menu wrapper background)
///   * accent blue        #36658A  (btn-primary border/text)
///   * text brown-gray    #4A4740  (secondary text, descriptions)
///   * body text          #3D3D3D
///   * body background    #FBFBF8  (cream)
///   * panel background   #F2EFF6  (highlight widgets)
///
/// The React admin app mirrors these values in
/// `admin-web/src/theme/broumy-tokens.css`; a CI job verifies that the two
/// stay in sync (see `.github/workflows/a11y.yml`).
library;

import 'package:flutter/material.dart';

/// Semantic color roles for the Broumy design system.
class BroumyColors {
  const BroumyColors._();

  // Brand
  static const Color primary = Color(0xFF117B30);
  static const Color primaryHover = Color(0xFF188739);
  static const Color primaryDark = Color(0xFF0E5E24);
  static const Color primaryContainer = Color(0xFFE3F0E6);
  static const Color onPrimary = Color(0xFFFFFFFF);

  static const Color secondary = Color(0xFF184461);
  static const Color secondaryHover = Color(0xFF36658A);
  static const Color secondaryContainer = Color(0xFFE1ECF4);
  static const Color onSecondary = Color(0xFFFFFFFF);

  /// Accent used for outline/ghost buttons and focus rings.
  static const Color accent = Color(0xFF36658A);

  // Semantics
  static const Color info = Color(0xFF17A2B8);
  static const Color infoContainer = Color(0xFFE0F4F7);
  static const Color onInfo = Color(0xFFFFFFFF);

  static const Color success = Color(0xFF28A745);
  static const Color successContainer = Color(0xFFDFF3E3);
  static const Color onSuccess = Color(0xFFFFFFFF);

  static const Color warning = Color(0xFFB8860B);
  static const Color warningContainer = Color(0xFFFFF3CD);
  static const Color onWarning = Color(0xFFFFFFFF);

  static const Color error = Color(0xFFDC3545);
  static const Color errorContainer = Color(0xFFF8D7DA);
  static const Color onError = Color(0xFFFFFFFF);

  // Surfaces
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceMuted = Color(0xFFFBFBF8);
  static const Color surfaceContainer = Color(0xFFF2EFF6);
  static const Color onSurface = Color(0xFF3D3D3D);

  // Text
  static const Color textPrimary = Color(0xFF3D3D3D);
  static const Color textSecondary = Color(0xFF4A4740);
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  static const Color textOnSecondary = Color(0xFFFFFFFF);
  static const Color textLink = Color(0xFF117B30);

  // Borders & focus
  static const Color border = Color(0xFFC9C5BD);
  static const Color borderStrong = Color(0xFF4A4740);
  static const Color focus = Color(0xFF36658A);
  static const Color focusRing = Color(0xFF36658A);

  // Grayscale
  static const Color gray50 = Color(0xFFFBFBF8);
  static const Color gray100 = Color(0xFFF2EFF6);
  static const Color gray200 = Color(0xFFEBEAE1);
  static const Color gray300 = Color(0xFFD7D4DB);
  static const Color gray400 = Color(0xFFC9C5BD);
  static const Color gray500 = Color(0xFF818182);
  static const Color gray700 = Color(0xFF4A4740);
  static const Color gray900 = Color(0xFF3D3D3D);
}

/// Spacing scale (4px base grid).
class BroumySpacing {
  const BroumySpacing._();

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
class BroumyRadii {
  const BroumyRadii._();

  static const double sm = 4;
  static const double md = 8;
  static const double lg = 12;
  static const double xl = 16;
  static const double pill = 999;
}

/// Typography scale. The official site uses the Fira Sans typeface.
class BroumyType {
  const BroumyType._();

  static const String fontFamily = 'Fira Sans';

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
class BroumyElevation {
  const BroumyElevation._();

  static const double none = 0;
  static const double xs = 1;
  static const double sm = 2;
  static const double md = 4;
  static const double lg = 8;
  static const double xl = 16;
}

/// Motion durations (ms) aligned with Material motion guidance.
class BroumyMotion {
  const BroumyMotion._();

  static const Duration shortest = Duration(milliseconds: 100);
  static const Duration short = Duration(milliseconds: 200);
  static const Duration medium = Duration(milliseconds: 300);
  static const Duration long = Duration(milliseconds: 500);

  static const Curve standard = Curves.easeInOut;
  static const Curve emphasized = Curves.easeOut;
}

/// Accessibility constants shared across components.
class BroumyA11y {
  const BroumyA11y._();

  /// Minimum touch target size per WCAG 2.5.8 / Material guidance.
  static const double minTouchTarget = 48;

  /// Focus ring thickness used by all interactive components.
  static const double focusThickness = 3;

  /// Minimum contrast ratio required (WCAG 2.1 AA).
  static const double minContrastRatio = 4.5;
}
