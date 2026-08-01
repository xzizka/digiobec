/// Accessible gov.cz modal dialog.
///
/// Non-dismissible dialog with focus trap semantics, a title with heading
/// role and action buttons. Use [GovCzDialog.show] to display it.
library;

import 'package:flutter/material.dart';

import '../theme/govcz_tokens.dart';

class GovCzDialog extends StatelessWidget {
  const GovCzDialog({
    super.key,
    required this.title,
    required this.content,
    this.actions,
    this.dismissible = false,
  });

  /// Dialog heading; announced first by screen readers.
  final String title;

  /// Main dialog body.
  final Widget content;

  /// Action buttons rendered in the bottom-right corner.
  final List<Widget>? actions;

  /// When false the dialog cannot be dismissed by tapping outside or back.
  final bool dismissible;

  /// Displays the dialog and resolves with the tapped action value.
  static Future<T?> show<T>(BuildContext context, {
    required String title,
    required Widget content,
    List<Widget>? actions,
    bool dismissible = false,
  }) {
    return showDialog<T>(
      context: context,
      barrierDismissible: dismissible,
      builder: (_) => GovCzDialog(
        title: title,
        content: content,
        actions: actions,
        dismissible: dismissible,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: dismissible,
      child: AlertDialog(
        backgroundColor: GovCzColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GovCzRadii.lg),
        ),
        title: Text(
          title,
          style: const TextStyle(
            color: GovCzColors.textPrimary,
            fontSize: GovCzType.xl,
            fontWeight: GovCzType.semibold,
          ),
        ),
        content: content,
        actions: actions,
        actionsAlignment: MainAxisAlignment.end,
      ),
    );
  }
}
