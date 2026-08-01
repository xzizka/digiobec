import 'package:flutter/material.dart';

import '../../../../theme/broumy_tokens.dart';

class SubmissionProgressIndicator extends StatelessWidget {
  const SubmissionProgressIndicator({super.key, required this.step});

  final int step;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _Step(label: '1. Vyplnění', active: step >= 1),
        _connector(),
        _Step(label: '2. Odeslání', active: step >= 2),
        _connector(),
        _Step(label: '3. Potvrzení', active: step >= 3),
      ],
    );
  }

  Widget _connector() => Container(
        width: 24,
        height: 2,
        color: BroumyColors.border,
        margin: const EdgeInsets.symmetric(horizontal: 4),
      );
}

class _Step extends StatelessWidget {
  const _Step({required this.label, required this.active});

  final String label;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final color = active ? BroumyColors.primary : BroumyColors.border;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(shape: BoxShape.circle, color: color),
          child: active
              ? const Icon(Icons.check, size: 14, color: Colors.white)
              : null,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: active ? BroumyColors.textPrimary : BroumyColors.textSecondary,
              ),
        ),
      ],
    );
  }
}
