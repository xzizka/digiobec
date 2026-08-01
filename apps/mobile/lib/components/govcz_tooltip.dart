/// Accessible gov.cz tooltip.
///
/// Wraps a widget with a delay-activated tooltip. Includes an optional
/// explicit Semantics label so screen readers announce it independently of
/// the hover-only trigger.
library;

import 'package:flutter/material.dart';

import '../theme/govcz_tokens.dart';

class GovCzTooltip extends StatelessWidget {
  const GovCzTooltip({
    super.key,
    required this.message,
    required this.child,
    this.semanticLabel,
    this.waitDuration = GovCzMotion.short,
  });

  /// Tooltip text shown on long-press/hover.
  final String message;

  final Widget child;

  /// If provided, announced by screen readers directly.
  final String? semanticLabel;

  final Duration waitDuration;

  @override
  Widget build(BuildContext context) {
    final tooltip = Tooltip(
      message: message,
      waitDuration: waitDuration,
      decoration: BoxDecoration(
        color: GovCzColors.gray900,
        borderRadius: BorderRadius.circular(GovCzRadii.sm),
      ),
      textStyle: const TextStyle(
        color: GovCzColors.textOnPrimary,
        fontSize: GovCzType.sm,
      ),
      child: child,
    );

    if (semanticLabel == null) {
      return tooltip;
    }
    return Semantics(label: semanticLabel, child: tooltip);
  }
}
