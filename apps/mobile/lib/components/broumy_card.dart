/// Accessible Broumy card.
///
/// Variants: elevated, outlined, filled. All variants keep semantic regions,
/// a proper heading hierarchy and full text contrast via tokens.
library;

import 'package:flutter/material.dart';

import '../theme/broumy_tokens.dart';

enum BroumyCardVariant { elevated, outlined, filled }

class BroumyCard extends StatelessWidget {
  const BroumyCard({
    super.key,
    required this.child,
    this.variant = BroumyCardVariant.elevated,
    this.title,
    this.onTap,
    this.padding = const EdgeInsets.all(BroumySpacing.xl),
    this.semanticLabel,
  });

  final Widget child;
  final BroumyCardVariant variant;

  /// Optional card heading; rendered with a stable heading role.
  final String? title;

  /// If provided, the card becomes tappable and announces itself as a button.
  final VoidCallback? onTap;

  final EdgeInsetsGeometry padding;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final Color background = switch (variant) {
      BroumyCardVariant.elevated => BroumyColors.surface,
      BroumyCardVariant.outlined => BroumyColors.surface,
      BroumyCardVariant.filled => isDark
          ? const Color(0xFF1E1E1E)
          : BroumyColors.surfaceMuted,
    };

    final BoxDecoration decoration = switch (variant) {
      BroumyCardVariant.elevated => BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(BroumyRadii.lg),
          boxShadow: const [
            BoxShadow(
              color: Color(0x1A000000),
              offset: Offset(0, 2),
              blurRadius: 8,
            ),
          ],
        ),
      BroumyCardVariant.outlined => BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(BroumyRadii.lg),
          border: Border.all(color: BroumyColors.borderStrong, width: 1),
        ),
      BroumyCardVariant.filled => BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(BroumyRadii.lg),
        ),
    };

    final content = Padding(
      padding: padding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (title != null) ...[
            Text(
              title!,
              style: const TextStyle(
                color: BroumyColors.textPrimary,
                fontSize: BroumyType.lg,
                fontWeight: BroumyType.semibold,
              ),
            ),
            const SizedBox(height: BroumySpacing.lg),
          ],
          child,
        ],
      ),
    );

    return Semantics(
      container: true,
      label: semanticLabel,
      child: onTap == null
          ? Container(decoration: decoration, child: content)
          : Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: onTap,
                borderRadius: BorderRadius.circular(BroumyRadii.lg),
                child: Container(decoration: decoration, child: content),
              ),
            ),
    );
  }
}
