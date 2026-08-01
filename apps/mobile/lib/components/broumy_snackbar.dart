/// Broumy snackbar.
///
/// Floating, high-contrast notification with optional action. All messages
/// are announced via live region semantics by the framework.
library;

import 'package:flutter/material.dart';

import '../theme/broumy_tokens.dart';

enum BroumySnackbarType { info, success, error }

class BroumySnackbar {
  const BroumySnackbar._();

  /// Shows a token-styled floating snackbar.
  static void show(
    BuildContext context,
    String message, {
    BroumySnackbarType type = BroumySnackbarType.info,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    final Color backgroundColor = switch (type) {
      BroumySnackbarType.info => BroumyColors.gray900,
      BroumySnackbarType.success => BroumyColors.secondary,
      BroumySnackbarType.error => BroumyColors.error,
    };

    final snackBar = SnackBar(
      backgroundColor: backgroundColor,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(BroumyRadii.md),
      ),
      content: Row(
        children: [
          Icon(
            switch (type) {
              BroumySnackbarType.info => Icons.info_outline,
              BroumySnackbarType.success => Icons.check_circle_outline,
              BroumySnackbarType.error => Icons.error_outline,
            },
            color: BroumyColors.textOnPrimary,
            size: 20,
          ),
          const SizedBox(width: BroumySpacing.md),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: BroumyColors.textOnPrimary,
                fontSize: BroumyType.sm,
              ),
            ),
          ),
        ],
      ),
      action: actionLabel == null
          ? null
          : SnackBarAction(
              label: actionLabel,
              textColor: BroumyColors.textOnPrimary,
              onPressed: onAction ?? () {},
            ),
    );

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(snackBar);
  }
}
