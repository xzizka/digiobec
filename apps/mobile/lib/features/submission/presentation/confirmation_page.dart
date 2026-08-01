import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:printing/printing.dart';

import '../../../../components/broumy_app_bar.dart';
import '../../../../components/broumy_button.dart';
import '../../../../components/broumy_progress_indicator.dart';
import '../../../../theme/broumy_tokens.dart';
import '../data/confirmation_repository.dart';
import '../domain/confirmation.dart';
import 'widgets/confirmation_qr.dart';
import 'widgets/pdf_viewer.dart';

/// Confirmation page shown after a successful submission: tracking code, QR
/// code, submitted-data summary, and PDF preview/download actions.
class ConfirmationPage extends StatefulWidget {
  const ConfirmationPage({
    super.key,
    required this.trackingCode,
    this.repository,
  });

  final String trackingCode;
  final ConfirmationRepository? repository;

  @override
  State<ConfirmationPage> createState() => _ConfirmationPageState();
}

class _ConfirmationPageState extends State<ConfirmationPage> {
  late final ConfirmationRepository _repository;

  Confirmation? _confirmation;
  String? _error;
  var _downloading = false;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? ConfirmationRepository();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _error = null;
      _confirmation = null;
    });
    try {
      final confirmation = await _repository.fetchConfirmation(widget.trackingCode);
      if (!mounted) return;
      setState(() => _confirmation = confirmation);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Potvrzení se nepodařilo načíst. Zkuste to znovu.');
    }
  }

  Future<void> _downloadPdf() async {
    setState(() => _downloading = true);
    try {
      final bytes = await _repository.fetchConfirmationPdf(widget.trackingCode);
      if (!mounted) return;
      await Printing.sharePdf(
        bytes: bytes,
        filename: 'potvrzeni-${widget.trackingCode}.pdf',
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Stažení PDF se nezdařilo.')),
      );
    } finally {
      if (mounted) setState(() => _downloading = false);
    }
  }

  void _showPdfPreview() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => PdfViewer(
          loadPdf: () => _repository.fetchConfirmationPdf(widget.trackingCode),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: BroumyAppBar(title: 'Potvrzení o podání', showBackButton: true),
      body: _buildBody(context),
    );
  }

  Widget _buildBody(BuildContext context) {
    final confirmation = _confirmation;
    if (_error != null) {
      return _ErrorView(message: _error!, onRetry: _load);
    }
    if (confirmation == null) {
      return const Center(child: BroumyProgressIndicator(linear: false));
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.all(BroumySpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _Header(confirmation: confirmation),
          const SizedBox(height: BroumySpacing.lg),
          _TrackingCodeCard(confirmation: confirmation),
          const SizedBox(height: BroumySpacing.lg),
          ConfirmationQr(verificationUrl: confirmation.verificationUrl),
          const SizedBox(height: BroumySpacing.lg),
          _SummaryCard(confirmation: confirmation),
          const SizedBox(height: BroumySpacing.xl),
          BroumyButton(
            child: Text(_downloading ? 'Stahuji…' : 'Stáhnout PDF'),
            loading: _downloading,
            onPressed: _downloading ? null : _downloadPdf,
          ),
          const SizedBox(height: BroumySpacing.sm),
          BroumyButton(
            child: const Text('Zobrazit PDF'),
            variant: BroumyButtonVariant.secondary,
            onPressed: _showPdfPreview,
          ),
          const SizedBox(height: BroumySpacing.lg),
          Text(
            'Ověření pravosti: ${confirmation.verificationUrl}',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: BroumyColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.confirmation});

  final Confirmation confirmation;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Icon(Icons.check_circle, size: 72, color: BroumyColors.success),
        const SizedBox(height: BroumySpacing.md),
        Text(
          'Podání bylo odesláno',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: BroumyColors.textPrimary,
                fontWeight: BroumyType.bold,
              ),
        ),
        const SizedBox(height: BroumySpacing.xs),
        Text(
          confirmation.formTitle,
          style: const TextStyle(color: BroumyColors.textSecondary),
        ),
      ],
    );
  }
}

class _TrackingCodeCard extends StatelessWidget {
  const _TrackingCodeCard({required this.confirmation});

  final Confirmation confirmation;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(BroumySpacing.lg),
      decoration: BoxDecoration(
        color: BroumyColors.surfaceContainer,
        borderRadius: BorderRadius.circular(BroumyRadii.lg),
        border: Border.all(color: BroumyColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Sledovací kód',
            style: TextStyle(
              fontSize: 12,
              fontWeight: BroumyType.semibold,
              color: BroumyColors.textSecondary,
            ),
          ),
          const SizedBox(height: BroumySpacing.xs),
          Row(
            children: [
              Expanded(
                child: SelectableText(
                  confirmation.trackingCode,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: BroumyColors.primary,
                        fontWeight: BroumyType.bold,
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
                ),
              ),
              IconButton(
                tooltip: 'Zkopírovat sledovací kód',
                icon: const Icon(Icons.copy, color: BroumyColors.primary),
                onPressed: () {
                  Clipboard.setData(
                    ClipboardData(text: confirmation.trackingCode),
                  );
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Sledovací kód byl zkopírován'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: BroumySpacing.xs),
          Text(
            'Zapište si ho: slouží ke sledování stavu žádosti.',
            style: TextStyle(
              fontSize: 12,
              color: BroumyColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.confirmation});

  final Confirmation confirmation;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(BroumySpacing.lg),
      decoration: BoxDecoration(
        color: BroumyColors.surfaceMuted,
        borderRadius: BorderRadius.circular(BroumyRadii.lg),
        border: Border.all(color: BroumyColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Údaje z podání',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: BroumyColors.textPrimary,
                  fontWeight: BroumyType.semibold,
                ),
          ),
          const SizedBox(height: BroumySpacing.sm),
          Text(
            'Datum a čas podání: ${confirmation.submittedAt}',
            style: TextStyle(
              fontSize: 13,
              color: BroumyColors.textSecondary,
            ),
          ),
          const Divider(height: BroumySpacing.xl),
          for (final row in confirmation.rows)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: BroumySpacing.xs),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 140,
                    child: Text(
                      row.label,
                      style: const TextStyle(
                        fontWeight: BroumyType.semibold,
                      ),
                    ),
                  ),
                  Expanded(child: Text(row.value)),
                ],
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
        padding: const EdgeInsets.all(BroumySpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: BroumyColors.error),
            const SizedBox(height: BroumySpacing.lg),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: BroumySpacing.lg),
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
