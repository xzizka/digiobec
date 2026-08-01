/// Broumy application bar.
///
/// Primary-colored header with title, optional back button and actions.
/// Keeps the brand identity and a high-contrast white on blue pairing.
library;

import 'package:flutter/material.dart';

import '../theme/broumy_tokens.dart';

class BroumyAppBar extends StatelessWidget implements PreferredSizeWidget {
  const BroumyAppBar({
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
      backgroundColor: BroumyColors.primary,
      foregroundColor: BroumyColors.textOnPrimary,
      elevation: elevated ? BroumyElevation.sm : BroumyElevation.none,
      title: Text(
        title,
        style: const TextStyle(
          fontSize: BroumyType.lg,
          fontWeight: BroumyType.semibold,
          color: BroumyColors.textOnPrimary,
        ),
      ),
      leading: showBackButton
          ? BackButton(onPressed: onBack)
          : null,
      actions: actions,
    );
  }
}
