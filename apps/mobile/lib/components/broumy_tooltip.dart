/// Accessible Broumy tooltip.
///
/// Wraps a widget with a delay-activated tooltip. Includes an optional
/// explicit Semantics label so screen readers announce it independently of
/// the hover-only trigger.
library;

import 'package:flutter/material.dart';

import '../theme/broumy_tokens.dart';

class BroumyTooltip extends StatelessWidget {
  const BroumyTooltip({
    super.key,
    required this.message,
    required this.child,
    this.semanticLabel,
    this.waitDuration = BroumyMotion.short,
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
        color: BroumyColors.gray900,
        borderRadius: BorderRadius.circular(BroumyRadii.sm),
      ),
      textStyle: const TextStyle(
        color: BroumyColors.textOnPrimary,
        fontSize: BroumyType.sm,
      ),
      child: child,
    );

    if (semanticLabel == null) {
      return tooltip;
    }
    return Semantics(label: semanticLabel, child: tooltip);
  }
}
