/// gov.cz progress indicators.
///
/// Linear and circular loaders themed with the primary token. Deterministic
/// variants expose progress values for accessibility.
library;

import 'package:flutter/material.dart';

import '../theme/govcz_tokens.dart';

class GovCzProgressIndicator extends StatelessWidget {
  const GovCzProgressIndicator({
    super.key,
    this.linear = true,
    this.value,
    this.label,
    this.color = GovCzColors.primary,
    this.strokeWidth,
  });

  /// If true renders a linear bar, otherwise a circular spinner.
  final bool linear;

  /// Deterministic progress 0..1; `null` renders an indeterminate spinner.
  final double? value;

  /// Accessible label announced while the indicator is visible.
  final String? label;

  final Color color;
  final double? strokeWidth;

  @override
  Widget build(BuildContext context) {
    final semantics = Semantics(
      label: label,
      liveRegion: true,
      child: linear
          ? LinearProgressIndicator(
              value: value,
              color: color,
              backgroundColor: GovCzColors.gray200,
              minHeight: strokeWidth ?? 6,
            )
          : SizedBox.square(
              dimension: 24,
              child: CircularProgressIndicator(
                value: value,
                color: color,
                strokeWidth: strokeWidth ?? 3,
              ),
            ),
    );
    return semantics;
  }
}
