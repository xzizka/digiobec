import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:municipal_portal/theme/govcz_tokens.dart';

void main() {
  group('GovCzColors', () {
    test('uses official gov.cz brand palette', () {
      expect(GovCzColors.primary, const Color(0xFF004B87));
      expect(GovCzColors.secondary, const Color(0xFF007B3D));
      expect(GovCzColors.error, const Color(0xFFD71920));
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
        (GovCzColors.textPrimary, GovCzColors.surface),
        (GovCzColors.textOnPrimary, GovCzColors.primary),
        (GovCzColors.textOnPrimary, GovCzColors.secondary),
        (GovCzColors.textOnPrimary, GovCzColors.error),
        (GovCzColors.textLink, GovCzColors.surface),
      ];
      for (final (fg, bg) in pairs) {
        expect(contrast(fg, bg), greaterThanOrEqualTo(4.5),
            reason: 'Pair $fg on $bg must meet AA contrast');
      }
    });

    test('semantic containers are distinct tokens', () {
      expect(GovCzColors.info, isNot(GovCzColors.warning));
      expect(GovCzColors.successContainer, isNot(GovCzColors.errorContainer));
    });
  });

  group('GovCzSpacing', () {
    test('uses 4px base grid', () {
      expect(GovCzSpacing.xs, 4);
      expect(GovCzSpacing.sm, 8);
      expect(GovCzSpacing.lg, 16);
      expect(GovCzSpacing.page, 64);
    });
  });

  group('GovCzA11y', () {
    test('enforces minimum touch target and contrast', () {
      expect(GovCzA11y.minTouchTarget, 48);
      expect(GovCzA11y.focusThickness, 3);
      expect(GovCzA11y.minContrastRatio, 4.5);
    });
  });

  group('GovCzMotion', () {
    test('provides consistent duration ramp', () {
      expect(GovCzMotion.shortest, const Duration(milliseconds: 100));
      expect(GovCzMotion.medium, const Duration(milliseconds: 300));
      expect(GovCzMotion.long, const Duration(milliseconds: 500));
    });
  });
}
