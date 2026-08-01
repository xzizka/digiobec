import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:printing/printing.dart';

import '../../../../../theme/broumy_tokens.dart';

/// In-app preview of the backend-generated PDF/A-1b confirmation using the
/// `printing` package's rasterizer. Errors fall back to a friendly message.
class PdfViewer extends StatelessWidget {
  const PdfViewer({super.key, required this.loadPdf});

  /// Loads the PDF bytes (e.g. from the confirmation datasource).
  final Future<Uint8List> Function() loadPdf;

  @override
  Widget build(BuildContext context) {
    return PdfPreview(
      build: (_) => loadPdf(),
      allowPrinting: true,
      allowSharing: true,
      canChangeOrientation: false,
      canChangePageFormat: false,
      canDebug: false,
      onError: (context, error) => Center(
        child: Padding(
          padding: const EdgeInsets.all(BroumySpacing.xl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.picture_as_pdf, size: 64, color: BroumyColors.error),
              const SizedBox(height: BroumySpacing.lg),
              const Text('Potvrzení se nepodařilo zobrazit.'),
              const SizedBox(height: BroumySpacing.sm),
              Text(
                'Stáhněte si PDF pro zobrazení v jiné aplikaci.',
                style: TextStyle(color: BroumyColors.textSecondary),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
