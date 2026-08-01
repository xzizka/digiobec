import 'package:flutter/material.dart';

import '../../../../components/broumy_app_bar.dart';
import '../../../../components/broumy_button.dart';
import '../../../../components/broumy_progress_indicator.dart';
import '../../../../theme/broumy_tokens.dart';
import '../data/submission_repository.dart';
import '../domain/submission.dart';
import 'confirmation_page.dart';
import 'submission_form_controller.dart';
import 'widgets/dynamic_form_field.dart';
import 'widgets/submission_progress_indicator.dart';

/// Dynamic form page: loads a form definition from `GET /api/forms/{key}`,
/// renders fields via the Broumy component library, validates locally, then
/// submits to `POST /api/submissions`.
class SubmissionFormPage extends StatefulWidget {
  const SubmissionFormPage({
    super.key,
    required this.formKey,
    this.repository,
  });

  final String formKey;
  final SubmissionRepository? repository;

  @override
  State<SubmissionFormPage> createState() => _SubmissionFormPageState();
}

class _SubmissionFormPageState extends State<SubmissionFormPage> {
  late final SubmissionFormController _controller;

  @override
  void initState() {
    super.initState();
    _controller = SubmissionFormController(
      repository: widget.repository ?? SubmissionRepository(),
    );
    _controller.load(widget.formKey);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Scaffold(
          appBar: BroumyAppBar(
            title: _controller.definition?.titleCs ?? 'Formulář',
            showBackButton: true,
          ),
          body: _buildBody(context),
        );
      },
    );
  }

  Widget _buildBody(BuildContext context) {
    switch (_controller.state) {
      case SubmissionFormState.loading:
        return const Center(
          child: BroumyProgressIndicator(linear: false),
        );
      case SubmissionFormState.error:
        return _ErrorView(
          message: _controller.submitError ?? 'Chyba',
          onRetry: () => _controller.load(widget.formKey),
        );
      case SubmissionFormState.success:
        return _SuccessView(result: _controller.result!);
      case SubmissionFormState.idle:
      case SubmissionFormState.submitting:
        return _buildForm(context);
    }
  }

  Widget _buildForm(BuildContext context) {
    final definition = _controller.definition!;
    final visibleFields = definition.fields
        .where((f) => f.isVisible(_controller.values))
        .toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: SubmissionProgressIndicator(
            step: _controller.isBusy ? 2 : 1,
          ),
        ),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  definition.titleCs,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: BroumyColors.textPrimary,
                        fontWeight: BroumyType.semibold,
                      ),
                ),
                if (_controller.submitError != null) ...[
                  const SizedBox(height: 12),
                  _InlineError(_controller.submitError!),
                ],
                const SizedBox(height: 16),
                for (final field in visibleFields) ...[
                  buildFieldWidget(
                    field: field,
                    value: _controller.values[field.key],
                    error: _controller.fieldErrors[field.key],
                    onChanged: (v) => _controller.setValue(field.key, v),
                  ),
                  const SizedBox(height: 16),
                ],
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: BroumyButton(
              child: Text(
                _controller.isBusy ? 'Odesílám…' : 'Odeslat žádost',
              ),
              loading: _controller.isBusy,
              onPressed: _controller.isBusy ? null : _controller.submit,
            ),
          ),
        ),
      ],
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError(this.message);

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: BroumyColors.errorContainer,
        borderRadius: BorderRadius.circular(BroumyRadii.md),
        border: Border.all(color: BroumyColors.error),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: BroumyColors.error),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: BroumyColors.error),
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: BroumyColors.error),
            const SizedBox(height: 16),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            BroumyButton(
              child: const Text('Zkusit znovu'),
              variant: BroumyButtonVariant.secondary,
              onPressed: onRetry,
            ),
          ],
        ),
      ),
    );
  }
}

class _SuccessView extends StatelessWidget {
  const _SuccessView({required this.result});

  final Submission result;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SubmissionProgressIndicator(step: 3),
            const SizedBox(height: 24),
            const Icon(Icons.check_circle, size: 72, color: BroumyColors.success),
            const SizedBox(height: 16),
            Text(
              'Podání bylo odesláno',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            const Text('Zapište si své číslo podání:'),
            const SizedBox(height: 8),
            SelectableText(
              result.trackingCode,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: BroumyColors.primary,
                    fontWeight: BroumyType.bold,
                  ),
            ),
            const SizedBox(height: 16),
            BroumyButton(
              child: const Text('Zobrazit potvrzení'),
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => ConfirmationPage(
                      trackingCode: result.trackingCode,
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 8),
            BroumyButton(
              child: const Text('Zpět na úvod'),
              variant: BroumyButtonVariant.secondary,
              onPressed: () => Navigator.of(context).pop(),
            ),
          ],
        ),
      ),
    );
  }
}
