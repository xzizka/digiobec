/// gov.cz snackbar.
///
/// Floating, high-contrast notification with optional action. All messages
/// are announced via live region semantics by the framework.
library;

import 'package:flutter/material.dart';

import '../theme/govcz_tokens.dart';

enum GovCzSnackbarType { info, success, error }

class GovCzSnackbar {
  const GovCzSnackbar._();

  /// Shows a token-styled floating snackbar.
  static void show(
    BuildContext context,
    String message, {
    GovCzSnackbarType type = GovCzSnackbarType.info,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    final Color backgroundColor = switch (type) {
      GovCzSnackbarType.info => GovCzColors.gray900,
      GovCzSnackbarType.success => GovCzColors.secondary,
      GovCzSnackbarType.error => GovCzColors.error,
    };

    final snackBar = SnackBar(
      backgroundColor: backgroundColor,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(GovCzRadii.md),
      ),
      content: Row(
        children: [
          Icon(
            switch (type) {
              GovCzSnackbarType.info => Icons.info_outline,
              GovCzSnackbarType.success => Icons.check_circle_outline,
              GovCzSnackbarType.error => Icons.error_outline,
            },
            color: GovCzColors.textOnPrimary,
            size: 20,
          ),
          const SizedBox(width: GovCzSpacing.md),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: GovCzColors.textOnPrimary,
                fontSize: GovCzType.sm,
              ),
            ),
          ),
        ],
      ),
      action: actionLabel == null
          ? null
          : SnackBarAction(
              label: actionLabel,
              textColor: GovCzColors.textOnPrimary,
              onPressed: onAction ?? () {},
            ),
    );

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(snackBar);
  }
}
