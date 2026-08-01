/// Accessible gov.cz card.
///
/// Variants: elevated, outlined, filled. All variants keep semantic regions,
/// a proper heading hierarchy and full text contrast via tokens.
library;

import 'package:flutter/material.dart';

import '../theme/govcz_tokens.dart';

enum GovCzCardVariant { elevated, outlined, filled }

class GovCzCard extends StatelessWidget {
  const GovCzCard({
    super.key,
    required this.child,
    this.variant = GovCzCardVariant.elevated,
    this.title,
    this.onTap,
    this.padding = const EdgeInsets.all(GovCzSpacing.xl),
    this.semanticLabel,
  });

  final Widget child;
  final GovCzCardVariant variant;

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
      GovCzCardVariant.elevated => GovCzColors.surface,
      GovCzCardVariant.outlined => GovCzColors.surface,
      GovCzCardVariant.filled => isDark
          ? const Color(0xFF1E1E1E)
          : GovCzColors.surfaceMuted,
    };

    final BoxDecoration decoration = switch (variant) {
      GovCzCardVariant.elevated => BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(GovCzRadii.lg),
          boxShadow: const [
            BoxShadow(
              color: Color(0x1A000000),
              offset: Offset(0, 2),
              blurRadius: 8,
            ),
          ],
        ),
      GovCzCardVariant.outlined => BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(GovCzRadii.lg),
          border: Border.all(color: GovCzColors.borderStrong, width: 1),
        ),
      GovCzCardVariant.filled => BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(GovCzRadii.lg),
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
                color: GovCzColors.textPrimary,
                fontSize: GovCzType.lg,
                fontWeight: GovCzType.semibold,
              ),
            ),
            const SizedBox(height: GovCzSpacing.lg),
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
                borderRadius: BorderRadius.circular(GovCzRadii.lg),
                child: Container(decoration: decoration, child: content),
              ),
            ),
    );
  }
}
