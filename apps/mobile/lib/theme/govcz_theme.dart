/// ThemeData factories for the gov.cz design system.
///
/// Light and dark Material 3 themes are derived exclusively from the tokens
/// in [GovCzTokens]/`govcz_tokens.dart`; components must not hardcode values.
library;

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'govcz_tokens.dart';

/// Builds the [ThemeData] for the gov.cz design system.
///
/// The same factory powers both light and dark mode; the color scheme is
/// switched via [Brightness] so components can depend on the single code path.
class GovCzTheme {
  const GovCzTheme._();

  static ThemeData get light => _build(Brightness.light);

  static ThemeData get dark => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isLight = brightness == Brightness.light;
    final scheme = ColorScheme.fromSeed(
      seedColor: GovCzColors.primary,
      brightness: brightness,
      primary: GovCzColors.primary,
      secondary: GovCzColors.secondary,
      error: GovCzColors.error,
      surface: GovCzColors.surface,
      onSurface: GovCzColors.textPrimary,
    );

    final base = ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      fontFamily: GovCzType.fontFamily,
      scaffoldBackgroundColor:
          isLight ? GovCzColors.surface : const Color(0xFF141414),
    );

    final focusColor = GovCzColors.focus;

    return base.copyWith(
      splashFactory: InkSparkle.splashFactory,
      appBarTheme: const AppBarTheme(
        backgroundColor: GovCzColors.primary,
        foregroundColor: GovCzColors.textOnPrimary,
        elevation: GovCzElevation.none,
        centerTitle: false,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: GovCzColors.primary,
          foregroundColor: GovCzColors.textOnPrimary,
          minimumSize: const Size(64, GovCzA11y.minTouchTarget),
          padding: const EdgeInsets.symmetric(
            horizontal: GovCzSpacing.xl,
            vertical: GovCzSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(GovCzRadii.md),
          ),
          elevation: GovCzElevation.sm,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: GovCzColors.primary,
          minimumSize: const Size(64, GovCzA11y.minTouchTarget),
          padding: const EdgeInsets.symmetric(
            horizontal: GovCzSpacing.xl,
            vertical: GovCzSpacing.md,
          ),
          side: const BorderSide(color: GovCzColors.primary, width: 2),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(GovCzRadii.md),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: GovCzColors.primary,
          minimumSize: const Size(64, GovCzA11y.minTouchTarget),
          padding: const EdgeInsets.symmetric(
            horizontal: GovCzSpacing.lg,
            vertical: GovCzSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(GovCzRadii.md),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: GovCzColors.surfaceMuted,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(GovCzRadii.md),
          borderSide: const BorderSide(color: GovCzColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(GovCzRadii.md),
          borderSide: const BorderSide(color: GovCzColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(GovCzRadii.md),
          borderSide: const BorderSide(color: GovCzColors.focus, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(GovCzRadii.md),
          borderSide: const BorderSide(color: GovCzColors.error, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: GovCzSpacing.lg,
          vertical: GovCzSpacing.lg,
        ),
      ),
      cardTheme: CardThemeData(
        color: GovCzColors.surface,
        elevation: GovCzElevation.sm,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GovCzRadii.lg),
          side: const BorderSide(color: GovCzColors.border),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: GovCzColors.surfaceMuted,
        selectedColor: GovCzColors.primaryContainer,
        labelStyle: const TextStyle(
          color: GovCzColors.textPrimary,
          fontSize: GovCzType.sm,
          fontWeight: GovCzType.medium,
        ),
        side: const BorderSide(color: GovCzColors.border),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GovCzRadii.pill),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: GovCzColors.gray900,
        contentTextStyle: const TextStyle(
          color: GovCzColors.textOnPrimary,
          fontSize: GovCzType.sm,
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GovCzRadii.md),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: GovCzColors.surface,
        elevation: GovCzElevation.lg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GovCzRadii.lg),
        ),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: GovCzColors.primary,
        linearTrackColor: GovCzColors.gray200,
        circularTrackColor: GovCzColors.gray200,
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: GovCzColors.gray900,
          borderRadius: BorderRadius.circular(GovCzRadii.sm),
        ),
        textStyle: const TextStyle(
          color: GovCzColors.textOnPrimary,
          fontSize: GovCzType.sm,
        ),
        waitDuration: GovCzMotion.short,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: GovCzColors.surface,
        indicatorColor: GovCzColors.primaryContainer,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: GovCzType.xs,
            fontWeight: states.contains(WidgetState.selected)
                ? GovCzType.semibold
                : GovCzType.regular,
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
