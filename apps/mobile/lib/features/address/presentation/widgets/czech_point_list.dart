import 'package:flutter/material.dart';

import '../../../../components/broumy_card.dart';
import '../../../../theme/broumy_tokens.dart';
import '../../domain/czech_point.dart';

/// Accessible list alternative to the Czech POINT map.
///
/// One card per point with distance, walking time, opening hours and a
/// navigation action. Keyboard/focus navigation works out of the box via
/// Material list focus.
class CzechPointList extends StatelessWidget {
  const CzechPointList({
    super.key,
    required this.points,
    this.onNavigate,
  });

  final List<CzechPoint> points;

  /// Called when the user chooses to navigate to a point.
  final ValueChanged<CzechPoint>? onNavigate;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Text(
          'V okolí se nepodařilo najít žádné Czech POINT místo.',
          style: TextStyle(color: BroumyColors.textSecondary),
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: points.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final point = points[index];
        return BroumyCard(
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 4,
            ),
            title: Text(point.name, maxLines: 1, overflow: TextOverflow.ellipsis),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text(point.address, maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Text(
                  '${point.distanceLabel} · pěšky ${point.walkingLabel}',
                  style: const TextStyle(
                    color: BroumyColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (point.openingHours != null)
                  Text(
                    'Otevírací doba: ${point.openingHours}',
                    style: const TextStyle(color: BroumyColors.textSecondary),
                  ),
                if (point.services.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Wrap(
                      spacing: 4,
                      runSpacing: 4,
                      children: point.services
                          .take(3)
                          .map(
                            (service) => Chip(
                              label: Text(
                                service,
                                style: const TextStyle(fontSize: 11),
                              ),
                              visualDensity: VisualDensity.compact,
                              materialTapTargetSize:
                                  MaterialTapTargetSize.shrinkWrap,
                            ),
                          )
                          .toList(),
                    ),
                  ),
              ],
            ),
            trailing: onNavigate == null
                ? null
                : IconButton(
                    icon: const Icon(Icons.directions_walk),
                    tooltip: 'Navigovat k místu',
                    onPressed: () => onNavigate!(point),
                  ),
            isThreeLine: true,
          ),
        );
      },
    );
  }
}
