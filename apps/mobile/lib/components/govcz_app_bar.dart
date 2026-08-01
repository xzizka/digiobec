/// gov.cz application bar.
///
/// Primary-colored header with title, optional back button and actions.
/// Keeps the brand identity and a high-contrast white on blue pairing.
library;

import 'package:flutter/material.dart';

import '../theme/govcz_tokens.dart';

class GovCzAppBar extends StatelessWidget implements PreferredSizeWidget {
  const GovCzAppBar({
    super.key,
    required this.title,
    this.actions,
    this.showBackButton = false,
    this.onBack,
    this.elevated = false,
  });

  final String title;
  final List<Widget>? actions;
  final bool showBackButton;
  final VoidCallback? onBack;
  final bool elevated;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: GovCzColors.primary,
      foregroundColor: GovCzColors.textOnPrimary,
      elevation: elevated ? GovCzElevation.sm : GovCzElevation.none,
      title: Text(
        title,
        style: const TextStyle(
          fontSize: GovCzType.lg,
          fontWeight: GovCzType.semibold,
          color: GovCzColors.textOnPrimary,
        ),
      ),
      leading: showBackButton
          ? BackButton(onPressed: onBack)
          : null,
      actions: actions,
    );
  }
}
