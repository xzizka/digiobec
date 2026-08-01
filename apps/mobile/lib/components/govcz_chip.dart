/// gov.cz filter chip.
///
/// Selectable/removable chip with visible selected state, focus ring and
/// contrast-safe label colors from tokens.
library;

import 'package:flutter/material.dart';

import '../theme/govcz_tokens.dart';

class GovCzChip extends StatelessWidget {
  const GovCzChip({
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
      selectedColor: GovCzColors.primaryContainer,
      checkmarkColor: GovCzColors.primary,
      backgroundColor: GovCzColors.surfaceMuted,
      side: BorderSide(
        color: selected ? GovCzColors.primary : GovCzColors.border,
        width: selected ? 2 : 1,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(GovCzRadii.pill),
      ),
      labelStyle: TextStyle(
        color: selected ? GovCzColors.primary : GovCzColors.textPrimary,
        fontSize: GovCzType.sm,
        fontWeight: selected ? GovCzType.semibold : GovCzType.regular,
      ),
    );

    if (!interactive) {
      return chip;
    }
    return chip;
  }
}
