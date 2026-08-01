/// Accessible Broumy text field.
///
/// Provides label, hint, helper/error text, character counter and optional
/// prefix/suffix icons with full semantics wiring: the input is labelled via
/// `Semantics(label:)`, error text is announced, and focus gets a visible ring.
library;

import 'package:flutter/material.dart';

import '../theme/broumy_tokens.dart';

class BroumyTextField extends StatefulWidget {
  const BroumyTextField({
    super.key,
    required this.label,
    this.controller,
    this.focusNode,
    this.hintText,
    this.helperText,
    this.errorText,
    this.prefixIcon,
    this.suffixIcon,
    this.obscureText = false,
    this.enabled = true,
    this.maxLength,
    this.textInputAction,
    this.keyboardType,
    this.validator,
    this.onChanged,
    this.autofillHints,
    this.initialValue,
    this.minLines,
    this.maxLines,
  }) : assert(controller == null || initialValue == null,
            'Provide either controller or initialValue, not both');

  /// Accessible label rendered above the input.
  final String label;

  final TextEditingController? controller;
  final FocusNode? focusNode;
  final String? hintText;

  /// Helper text shown below the field (persistent).
  final String? helperText;

  /// Error text; when non-null the field switches to error styling.
  final String? errorText;

  final IconData? prefixIcon;
  final Widget? suffixIcon;
  final bool obscureText;
  final bool enabled;
  final int? maxLength;
  final TextInputAction? textInputAction;
  final TextInputType? keyboardType;
  final FormFieldValidator<String>? validator;
  final ValueChanged<String>? onChanged;
  final Iterable<String>? autofillHints;
  final String? initialValue;
  final int? minLines;
  final int? maxLines;

  @override
  State<BroumyTextField> createState() => _BroumyTextFieldState();
}

class _BroumyTextFieldState extends State<BroumyTextField> {
  late final TextEditingController _internalController;
  late final bool _usesExternalController;

  @override
  void initState() {
    super.initState();
    _usesExternalController = widget.controller != null;
    _internalController =
        widget.controller ?? TextEditingController(text: widget.initialValue);
  }

  @override
  void dispose() {
    if (!_usesExternalController) {
      _internalController.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Wire a11y: the input is labelled via InputDecoration.labelText and
    // helper/error text is announced by the platform.
    return Semantics(
      label: widget.label,
      textField: true,
      enabled: widget.enabled,
      child: TextField(
        controller: _internalController,
        focusNode: widget.focusNode,
        enabled: widget.enabled,
        obscureText: widget.obscureText,
        maxLength: widget.maxLength,
        minLines: widget.minLines,
        maxLines: widget.maxLines ?? 1,
        textInputAction: widget.textInputAction,
        keyboardType: widget.keyboardType,
        autofillHints: widget.autofillHints,
        onChanged: widget.onChanged,
        decoration: InputDecoration(
          labelText: widget.label,
          labelStyle: const TextStyle(
            color: BroumyColors.textPrimary,
            fontWeight: BroumyType.medium,
          ),
          hintText: widget.hintText,
          helperText: widget.helperText,
          errorText: widget.errorText,
          errorStyle: const TextStyle(
            color: BroumyColors.error,
            fontWeight: BroumyType.medium,
          ),
          prefixIcon: widget.prefixIcon == null
              ? null
              : Icon(widget.prefixIcon, size: 20),
          suffixIcon: widget.suffixIcon,
          counterText: widget.maxLength == null ? '' : null,
        ),
      ),
    );
  }
}

/// Convenience for a required-field validation rule used by [validator].
String? requiredField(String? value) {
  if (value == null || value.trim().isEmpty) {
    return 'Toto pole je povinné.';
  }
  return null;
}
