/// Broumy filter chip.
///
/// Selectable/removable chip with visible selected state, focus ring and
/// contrast-safe label colors from tokens.
library;

import 'package:flutter/material.dart';

import '../theme/broumy_tokens.dart';

class BroumyChip extends StatelessWidget {
  const BroumyChip({
    super.key,
    required this.label,
    this.selected = false,
    this.onSelected,
    this.icon,
    this.showCheckmark = true,
  });

  final String label;
  final bool selected;
  final ValueChanged<bool>? onSelected;
  final IconData? icon;
  final bool showCheckmark;

  @override
  Widget build(BuildContext context) {
    final interactive = onSelected != null;
    final Widget chip = FilterChip(
      label: Text(label),
      avatar: icon == null ? null : Icon(icon, size: 18),
      selected: selected,
      onSelected: interactive ? onSelected : null,
      showCheckmark: showCheckmark,
      selectedColor: BroumyColors.primaryContainer,
      checkmarkColor: BroumyColors.primary,
      backgroundColor: BroumyColors.surfaceMuted,
      side: BorderSide(
        color: selected ? BroumyColors.primary : BroumyColors.border,
        width: selected ? 2 : 1,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(BroumyRadii.pill),
      ),
      labelStyle: TextStyle(
        color: selected ? BroumyColors.primary : BroumyColors.textPrimary,
        fontSize: BroumyType.sm,
        fontWeight: selected ? BroumyType.semibold : BroumyType.regular,
      ),
    );

    if (!interactive) {
      return chip;
    }
    return chip;
  }
}
