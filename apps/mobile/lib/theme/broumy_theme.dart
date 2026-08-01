/// ThemeData factories for the Broumy design system.
///
/// Light and dark Material 3 themes are derived exclusively from the tokens
/// in [BroumyTokens]/`broumy_tokens.dart`; components must not hardcode values.
library;

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'broumy_tokens.dart';

/// Builds the [ThemeData] for the Broumy design system.
///
/// The same factory powers both light and dark mode; the color scheme is
/// switched via [Brightness] so components can depend on the single code path.
class BroumyTheme {
  const BroumyTheme._();

  static ThemeData get light => _build(Brightness.light);

  static ThemeData get dark => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isLight = brightness == Brightness.light;
    final scheme = ColorScheme.fromSeed(
      seedColor: BroumyColors.primary,
      brightness: brightness,
      primary: BroumyColors.primary,
      secondary: BroumyColors.secondary,
      error: BroumyColors.error,
      surface: BroumyColors.surface,
      onSurface: BroumyColors.textPrimary,
    );

    final base = ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      fontFamily: BroumyType.fontFamily,
      scaffoldBackgroundColor:
          isLight ? BroumyColors.surface : const Color(0xFF141414),
    );

    final focusColor = BroumyColors.focus;

    return base.copyWith(
      splashFactory: InkSparkle.splashFactory,
      appBarTheme: const AppBarTheme(
        backgroundColor: BroumyColors.primary,
        foregroundColor: BroumyColors.textOnPrimary,
        elevation: BroumyElevation.none,
        centerTitle: false,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: BroumyColors.primary,
          foregroundColor: BroumyColors.textOnPrimary,
          minimumSize: const Size(64, BroumyA11y.minTouchTarget),
          padding: const EdgeInsets.symmetric(
            horizontal: BroumySpacing.xl,
            vertical: BroumySpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(BroumyRadii.md),
          ),
          elevation: BroumyElevation.sm,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: BroumyColors.primary,
          minimumSize: const Size(64, BroumyA11y.minTouchTarget),
          padding: const EdgeInsets.symmetric(
            horizontal: BroumySpacing.xl,
            vertical: BroumySpacing.md,
          ),
          side: const BorderSide(color: BroumyColors.primary, width: 2),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(BroumyRadii.md),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: BroumyColors.primary,
          minimumSize: const Size(64, BroumyA11y.minTouchTarget),
          padding: const EdgeInsets.symmetric(
            horizontal: BroumySpacing.lg,
            vertical: BroumySpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(BroumyRadii.md),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: BroumyColors.surfaceMuted,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(BroumyRadii.md),
          borderSide: const BorderSide(color: BroumyColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(BroumyRadii.md),
          borderSide: const BorderSide(color: BroumyColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(BroumyRadii.md),
          borderSide: const BorderSide(color: BroumyColors.focus, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(BroumyRadii.md),
          borderSide: const BorderSide(color: BroumyColors.error, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: BroumySpacing.lg,
          vertical: BroumySpacing.lg,
        ),
      ),
      cardTheme: CardThemeData(
        color: BroumyColors.surface,
        elevation: BroumyElevation.sm,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(BroumyRadii.lg),
          side: const BorderSide(color: BroumyColors.border),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: BroumyColors.surfaceMuted,
        selectedColor: BroumyColors.primaryContainer,
        labelStyle: const TextStyle(
          color: BroumyColors.textPrimary,
          fontSize: BroumyType.sm,
          fontWeight: BroumyType.medium,
        ),
        side: const BorderSide(color: BroumyColors.border),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(BroumyRadii.pill),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: BroumyColors.gray900,
        contentTextStyle: const TextStyle(
          color: BroumyColors.textOnPrimary,
          fontSize: BroumyType.sm,
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(BroumyRadii.md),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: BroumyColors.surface,
        elevation: BroumyElevation.lg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(BroumyRadii.lg),
        ),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: BroumyColors.primary,
        linearTrackColor: BroumyColors.gray200,
        circularTrackColor: BroumyColors.gray200,
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: BroumyColors.gray900,
          borderRadius: BorderRadius.circular(BroumyRadii.sm),
        ),
        textStyle: const TextStyle(
          color: BroumyColors.textOnPrimary,
          fontSize: BroumyType.sm,
        ),
        waitDuration: BroumyMotion.short,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: BroumyColors.surface,
        indicatorColor: BroumyColors.primaryContainer,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: BroumyType.xs,
            fontWeight: states.contains(WidgetState.selected)
                ? BroumyType.semibold
                : BroumyType.regular,
          ),
        ),
      ),
      // Accessibility: visible focus ring on every interactive element.
      focusColor: focusColor,
      pageTransitionsTheme: PageTransitionsTheme(builders: {
        TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
      }),
    );
  }
}
