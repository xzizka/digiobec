import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../components/broumy_text_field.dart';
import '../../../../theme/broumy_tokens.dart';
import '../../domain/address_suggestion.dart';

/// Typeahead address field backed by the RÚIAN autocomplete proxy.
///
/// Debounces typing (300 ms), renders a focus-driven dropdown of suggestions
/// and reports the chosen [AddressSuggestion] via [onSelected] so the caller
/// can prefill street / number / city / postal code form fields.
class AddressAutocompleteField extends StatefulWidget {
  const AddressAutocompleteField({
    super.key,
    required this.label,
    required this.repository,
    required this.onSelected,
    this.initialValue,
    this.errorText,
    this.hintText,
  });

  final String label;
  final dynamic repository;
  final ValueChanged<AddressSuggestion> onSelected;
  final String? initialValue;
  final String? errorText;
  final String? hintText;

  @override
  State<AddressAutocompleteField> createState() =>
      _AddressAutocompleteFieldState();
}

class _AddressAutocompleteFieldState extends State<AddressAutocompleteField> {
  static const _debounceDuration = Duration(milliseconds: 300);

  late final TextEditingController _controller;
  final FocusNode _focusNode = FocusNode();

  Timer? _debounce;
  List<AddressSuggestion> _suggestions = const [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialValue);
    _focusNode.addListener(_onFocusChanged);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _focusNode
      ..removeListener(_onFocusChanged)
      ..dispose();
    _controller.dispose();
    super.dispose();
  }

  void _onFocusChanged() {
    if (!_focusNode.hasFocus) {
      setState(() => _suggestions = const []);
    }
  }

  Future<void> _loadSuggestions(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _suggestions = const [];
        _loading = false;
      });
      return;
    }
    setState(() => _loading = true);
    final suggestions = await widget.repository.suggest(query);
    if (!mounted) return;
    setState(() {
      _suggestions = suggestions;
      _loading = false;
    });
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(_debounceDuration, () => _loadSuggestions(value));
  }

  void _onSuggestionTapped(AddressSuggestion suggestion) {
    _debounce?.cancel();
    _controller.text = suggestion.label;
    _controller.selection = TextSelection.collapsed(
      offset: _controller.text.length,
    );
    setState(() => _suggestions = const []);
    _focusNode.unfocus();
    widget.onSelected(suggestion);
  }

  @override
  Widget build(BuildContext context) {
    final showDropdown = _focusNode.hasFocus && _suggestions.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BroumyTextField(
          label: widget.label,
          controller: _controller,
          focusNode: _focusNode,
          hintText: widget.hintText,
          errorText: widget.errorText,
          onChanged: _onChanged,
          textInputAction: TextInputAction.search,
          suffixIcon: _loading
              ? const Padding(
                  padding: EdgeInsets.all(12),
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                )
              : _suggestions.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.close),
                      tooltip: 'Vymazat',
                      onPressed: () {
                        _controller.clear();
                        _onChanged('');
                      },
                    )
                  : null,
        ),
        if (showDropdown) ...[
          const SizedBox(height: 4),
          Material(
            elevation: 4,
            color: BroumyColors.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
              side: const BorderSide(color: BroumyColors.border),
            ),
            clipBehavior: Clip.antiAlias,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 240),
              child: ListView.separated(
                shrinkWrap: true,
                padding: EdgeInsets.zero,
                itemCount: _suggestions.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final suggestion = _suggestions[index];
                  return Semantics(
                    button: true,
                    label: suggestion.label,
                    child: ListTile(
                      dense: true,
                      title: Text(
                        suggestion.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: suggestion.district == null
                          ? null
                          : Text(
                              [suggestion.district, suggestion.region]
                                  .whereType<String>()
                                  .join(', '),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                      onTap: () => _onSuggestionTapped(suggestion),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ],
    );
  }
}
