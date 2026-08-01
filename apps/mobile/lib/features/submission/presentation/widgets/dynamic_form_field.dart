import 'package:flutter/material.dart';

import '../../../../components/broumy_text_field.dart';
import '../../../../components/broumy_chip.dart';
import '../../../../theme/broumy_tokens.dart';
import '../../domain/form_field.dart';

/// Builds the widget for one schema field using the Broumy component library.
Widget buildFieldWidget({
  required FormFieldSpec field,
  required dynamic value,
  String? error,
  ValueChanged<dynamic>? onChanged,
}) {
  switch (field.type) {
    case FormFieldType.textarea:
      return BroumyTextField(
        key: ValueKey(field.key),
        label: field.label,
        hintText: field.placeholder,
        errorText: error,
        minLines: 3,
        maxLines: 6,
        maxLength: field.maxLength,
        initialValue: value?.toString(),
        onChanged: (v) => onChanged?.call(v),
      );
    case FormFieldType.select:
      return _SelectField(
        key: ValueKey(field.key),
        field: field,
        value: value?.toString(),
        error: error,
        onChanged: onChanged,
      );
    case FormFieldType.date:
      return _DateField(
        key: ValueKey(field.key),
        field: field,
        value: value?.toString(),
        error: error,
        onChanged: onChanged,
      );
    case FormFieldType.checkbox:
      return _CheckboxField(
        key: ValueKey(field.key),
        field: field,
        value: value == true,
        error: error,
        onChanged: onChanged,
      );
    case FormFieldType.text:
      return BroumyTextField(
        key: ValueKey(field.key),
        label: field.label,
        hintText: field.placeholder,
        errorText: error,
        maxLength: field.maxLength,
        initialValue: value?.toString(),
        onChanged: (v) => onChanged?.call(v),
      );
  }
}

class _SelectField extends StatefulWidget {
  const _SelectField({
    super.key,
    required this.field,
    this.value,
    this.error,
    this.onChanged,
  });

  final FormFieldSpec field;
  final String? value;
  final String? error;
  final ValueChanged<dynamic>? onChanged;

  @override
  State<_SelectField> createState() => _SelectFieldState();
}

class _SelectFieldState extends State<_SelectField> {
  String? _selected;

  @override
  void initState() {
    super.initState();
    _selected = widget.value;
  }

  @override
  void didUpdateWidget(covariant _SelectField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) _selected = widget.value;
  }

  @override
  Widget build(BuildContext context) {
    final options = widget.field.options;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${widget.field.label}${widget.field.required ? ' *' : ''}',
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: BroumyColors.textPrimary,
                fontWeight: BroumyType.medium,
              ),
        ),
        const SizedBox(height: 4),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: [
            for (final option in options)
              BroumyChip(
                label: option,
                selected: _selected == option,
                onSelected: (sel) {
                  setState(() => _selected = sel ? option : null);
                  widget.onChanged?.call(sel ? option : null);
                },
              ),
          ],
        ),
        if (widget.error != null) ...[
          const SizedBox(height: 4),
          Text(
            widget.error!,
            style: const TextStyle(color: BroumyColors.error),
          ),
        ],
      ],
    );
  }
}

class _DateField extends StatefulWidget {
  const _DateField({
    super.key,
    required this.field,
    this.value,
    this.error,
    this.onChanged,
  });

  final FormFieldSpec field;
  final String? value;
  final String? error;
  final ValueChanged<dynamic>? onChanged;

  @override
  State<_DateField> createState() => _DateFieldState();
}

class _DateFieldState extends State<_DateField> {
  String? _date;

  @override
  void initState() {
    super.initState();
    _date = widget.value;
  }

  @override
  void didUpdateWidget(covariant _DateField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) _date = widget.value;
  }

  @override
  Widget build(BuildContext context) {
    return BroumyTextField(
      label: widget.field.label,
      hintText: 'RRRR-MM-DD',
      errorText: widget.error,
      initialValue: _date,
      suffixIcon: IconButton(
        icon: const Icon(Icons.calendar_today),
        tooltip: 'Vybrat datum',
        onPressed: () async {
          final picked = await showDatePicker(
            context: context,
            initialDate: DateTime.tryParse(_date ?? '') ?? DateTime.now(),
            firstDate: DateTime(1900),
            lastDate: DateTime(2100),
          );
          if (picked != null) {
            final formatted = '${picked.year.toString().padLeft(4, '0')}-'
                '${picked.month.toString().padLeft(2, '0')}-'
                '${picked.day.toString().padLeft(2, '0')}';
            setState(() => _date = formatted);
            widget.onChanged?.call(formatted);
          }
        },
      ),
      onChanged: (v) {
        setState(() => _date = v);
        widget.onChanged?.call(v);
      },
    );
  }
}

class _CheckboxField extends StatelessWidget {
  const _CheckboxField({
    super.key,
    required this.field,
    required this.value,
    this.error,
    this.onChanged,
  });

  final FormFieldSpec field;
  final bool value;
  final String? error;
  final ValueChanged<dynamic>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CheckboxListTile(
          value: value,
          onChanged: (v) => onChanged?.call(v ?? false),
          title: Text(field.label),
          contentPadding: EdgeInsets.zero,
          controlAffinity: ListTileControlAffinity.leading,
        ),
        if (error != null)
          Padding(
            padding: const EdgeInsets.only(left: 12),
            child: Text(
              error!,
              style: const TextStyle(color: BroumyColors.error),
            ),
          ),
      ],
    );
  }
}
