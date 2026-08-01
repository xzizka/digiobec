/// Accessible Broumy button with variants and full state coverage.
///
/// Variants: primary (default), secondary, outline, ghost, destructive.
/// All variants keep a 48px minimum touch target, visible focus ring and
/// correct semantics for screen readers. Values come exclusively from the
/// tokens in `broumy_tokens.dart`.
library;

import 'package:flutter/material.dart';

import '../theme/broumy_tokens.dart';

enum BroumyButtonVariant { primary, secondary, outline, ghost, destructive }

/// Size variants controlling height; touch target never drops below 48px.
enum BroumyButtonSize { md, lg }

class BroumyButton extends StatelessWidget {
  const BroumyButton({
    super.key,
    required this.child,
    required this.onPressed,
    this.variant = BroumyButtonVariant.primary,
    this.size = BroumyButtonSize.md,
    this.loading = false,
    this.icon,
    this.semanticLabel,
    this.fullWidth = false,
  });

  /// Button label (or arbitrary widget tree). Semantics are derived from it.
  final Widget child;

  /// Invoked when the button is pressed. `null` disables the button.
  final VoidCallback? onPressed;

  final BroumyButtonVariant variant;
  final BroumyButtonSize size;
  final bool loading;

  /// Optional leading icon (e.g. `Icons.arrow_forward`).
  final IconData? icon;

  /// Overrides the accessibility name; otherwise derived from [child].
  final String? semanticLabel;

  /// If true, expands to fill the parent width (common for CTA rows).
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    final interactive = onPressed != null && !loading;
    final height = size == BroumyButtonSize.lg ? 56.0 : 48.0;

    final Widget button = _buildButton(
      context,
      interactive: interactive,
      height: height,
    );

    // Provide an explicit semantics label and confirm the role.
    return Semantics(
      button: true,
      enabled: interactive,
      label: semanticLabel,
      child: button,
    );
  }

  Widget _buildButton(BuildContext context, {
    required bool interactive,
    required double height,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final label = loading
        ? SizedBox.square(
            dimension: size == BroumyButtonSize.lg ? 24 : 20,
            child: const CircularProgressIndicator(
              strokeWidth: 2.4,
              color: Colors.white,
            ),
          )
        : (icon != null
            ? Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 20),
                  const SizedBox(width: BroumySpacing.sm),
                  child,
                ],
              )
            : child);

    switch (variant) {
      case BroumyButtonVariant.primary:
        return _styled(
          context,
          interactive: interactive,
          height: height,
          background: BroumyColors.primary,
          foreground: BroumyColors.textOnPrimary,
          hoverBackground: BroumyColors.primaryHover,
          borderColor: null,
          child: label,
        );
      case BroumyButtonVariant.secondary:
        return _styled(
          context,
          interactive: interactive,
          height: height,
          background: BroumyColors.secondary,
          foreground: BroumyColors.textOnSecondary,
          hoverBackground: BroumyColors.secondaryHover,
          borderColor: null,
          child: label,
        );
      case BroumyButtonVariant.outline:
        return _styled(
          context,
          interactive: interactive,
          height: height,
          background: Colors.transparent,
          foreground: BroumyColors.primary,
          hoverBackground: isDark
              ? const Color(0x1F004B87)
              : BroumyColors.primaryContainer,
          borderColor: BroumyColors.primary,
          child: label,
        );
      case BroumyButtonVariant.ghost:
        return _styled(
          context,
          interactive: interactive,
          height: height,
          background: Colors.transparent,
          foreground: BroumyColors.primary,
          hoverBackground: isDark
              ? const Color(0x1F004B87)
              : BroumyColors.primaryContainer,
          borderColor: null,
          child: label,
        );
      case BroumyButtonVariant.destructive:
        return _styled(
          context,
          interactive: interactive,
          height: height,
          background: BroumyColors.error,
          foreground: BroumyColors.textOnPrimary,
          hoverBackground: const Color(0xFFB01018),
          borderColor: null,
          child: label,
        );
    }
  }

  Widget _styled(
    BuildContext context, {
    required bool interactive,
    required double height,
    required Color background,
    required Color foreground,
    required Color hoverBackground,
    required Color? borderColor,
    required Widget child,
  }) {
    return MouseRegion(
      cursor: interactive ? SystemMouseCursors.click : SystemMouseCursors.basic,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(BroumyRadii.md),
          border: borderColor == null
              ? null
              : Border.all(color: borderColor, width: 2),
          boxShadow: interactive
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    offset: const Offset(0, 2),
                    blurRadius: 4,
                  ),
                ]
              : null,
        ),
        child: _FocusableButton(
          enabled: interactive,
          height: height,
          foreground: foreground,
          hoverBackground: hoverBackground,
          background: background,
          onPressed: onPressed,
          onLongPress: null,
          child: child,
        ),
      ),
    );
  }
}

class _FocusableButton extends StatefulWidget {
  const _FocusableButton({
    required this.enabled,
    required this.height,
    required this.background,
    required this.foreground,
    required this.hoverBackground,
    required this.onPressed,
    required this.onLongPress,
    required this.child,
  });

  final bool enabled;
  final double height;
  final Color background;
  final Color foreground;
  final Color hoverBackground;
  final VoidCallback? onPressed;
  final VoidCallback? onLongPress;
  final Widget child;

  @override
  State<_FocusableButton> createState() => _FocusableButtonState();
}

class _FocusableButtonState extends State<_FocusableButton> {
  bool _hovered = false;
  bool _pressed = false;
  bool _focused = false;

  @override
  Widget build(BuildContext context) {
    final showFocus = _focused;
    Color bg = widget.background;
    if (_pressed && widget.enabled) {
      bg = Color.lerp(bg, Colors.black, 0.12)!;
    } else if (_hovered && widget.enabled) {
      bg = widget.hoverBackground;
    }

    return FocusableActionDetector(
      onFocusChange: (v) => setState(() => _focused = v),
      onShowHoverHighlight: (v) => setState(() => _hovered = v),
      onShowFocusHighlight: (v) => setState(() => _focused = v),
      actions: {
        if (widget.enabled)
          ActivateIntent: CallbackAction<ActivateIntent>(
            onInvoke: (_) {
              widget.onPressed?.call();
              return null;
            },
          ),
      },
      child: InkWell(
        onTap: widget.enabled ? widget.onPressed : null,
        onHighlightChanged: (v) => setState(() => _pressed = v),
        focusNode: null,
        borderRadius: BorderRadius.circular(BroumyRadii.md),
        child: Container(
          height: widget.height,
          width: double.infinity,
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(BroumyRadii.md),
            border: showFocus
                ? Border.all(
                    color: BroumyColors.focusRing,
                    width: BroumyA11y.focusThickness,
                  )
                : null,
          ),
          padding: const EdgeInsets.symmetric(horizontal: BroumySpacing.xl),
          child: Center(
            child: DefaultTextStyle.merge(
              style: TextStyle(
                color: widget.foreground,
                fontSize: BroumyType.base,
                fontWeight: BroumyType.semibold,
              ),
              child: widget.child,
            ),
          ),
        ),
      ),
    );
  }
}
