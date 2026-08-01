/// Broumy bottom navigation bar.
///
/// Material 3 NavigationBar wired to the token palette with a primary
/// indicator, 48px targets and selected-state labels for screen readers.
library;

import 'package:flutter/material.dart';

import '../theme/broumy_tokens.dart';

class BroumyBottomNavItem {
  const BroumyBottomNavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
  });

  final IconData icon;
  final IconData selectedIcon;
  final String label;
}

class BroumyBottomNav extends StatelessWidget {
  const BroumyBottomNav({
    super.key,
    required this.items,
    required this.selectedIndex,
    required this.onDestinationSelected,
  });

  final List<BroumyBottomNavItem> items;
  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;

  @override
  Widget build(BuildContext context) {
    return NavigationBar(
      selectedIndex: selectedIndex,
      onDestinationSelected: onDestinationSelected,
      backgroundColor: BroumyColors.surface,
      indicatorColor: BroumyColors.primaryContainer,
      height: 68,
      destinations: [
        for (final item in items)
          NavigationDestination(
            icon: Icon(item.icon),
            selectedIcon: Icon(item.selectedIcon),
            label: item.label,
            tooltip: item.label,
          ),
      ],
    );
  }
}
