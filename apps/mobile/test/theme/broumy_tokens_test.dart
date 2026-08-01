import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:municipal_portal/theme/broumy_tokens.dart';

void main() {
  group('BroumyColors', () {
    test('uses official Broumy brand palette', () {
      expect(BroumyColors.primary, const Color(0xFF117B30));
      expect(BroumyColors.primaryHover, const Color(0xFF188739));
      expect(BroumyColors.secondary, const Color(0xFF184461));
      expect(BroumyColors.accent, const Color(0xFF36658A));
      expect(BroumyColors.textPrimary, const Color(0xFF3D3D3D));
      expect(BroumyColors.surfaceMuted, const Color(0xFFFBFBF8));
    });

    test('on-surface pairs meet WCAG 2.1 AA contrast (>= 4.5:1)', () {
      double contrast(Color a, Color b) {
        double luminance(Color c) {
          final r = c.r;
          final g = c.g;
          final b = c.b;
          double lin(double v) =>
              v <= 0.03928 ? v / 12.92 : math.pow((v + 0.055) / 1.055, 2.4).toDouble();
          return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
        }        final l1 = luminance(a);
        final l2 = luminance(b);
        final lighter = l1 > l2 ? l1 : l2;
        final darker = l1 > l2 ? l2 : l1;
        return (lighter + 0.05) / (darker + 0.05);
      }

      const pairs = <(Color, Color)>[
        (BroumyColors.textPrimary, BroumyColors.surface),
        (BroumyColors.textOnPrimary, BroumyColors.primary),
        (BroumyColors.textOnPrimary, BroumyColors.secondary),
        (BroumyColors.textOnPrimary, BroumyColors.error),
        (BroumyColors.textLink, BroumyColors.surface),
      ];
      for (final (fg, bg) in pairs) {
        expect(contrast(fg, bg), greaterThanOrEqualTo(4.5),
            reason: 'Pair $fg on $bg must meet AA contrast');
      }
    });

    test('semantic containers are distinct tokens', () {
      expect(BroumyColors.info, isNot(BroumyColors.warning));
      expect(BroumyColors.successContainer, isNot(BroumyColors.errorContainer));
    });
  });

  group('BroumySpacing', () {
    test('uses 4px base grid', () {
      expect(BroumySpacing.xs, 4);
      expect(BroumySpacing.sm, 8);
      expect(BroumySpacing.lg, 16);
      expect(BroumySpacing.page, 64);
    });
  });

  group('BroumyA11y', () {
    test('enforces minimum touch target and contrast', () {
      expect(BroumyA11y.minTouchTarget, 48);
      expect(BroumyA11y.focusThickness, 3);
      expect(BroumyA11y.minContrastRatio, 4.5);
    });
  });

  group('BroumyMotion', () {
    test('provides consistent duration ramp', () {
      expect(BroumyMotion.shortest, const Duration(milliseconds: 100));
      expect(BroumyMotion.medium, const Duration(milliseconds: 300));
      expect(BroumyMotion.long, const Duration(milliseconds: 500));
    });
  });
}
