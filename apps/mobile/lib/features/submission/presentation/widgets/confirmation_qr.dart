import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../../theme/broumy_tokens.dart';

/// Gov.cz-styled QR code for the verification URL. Tapping the QR copies the
/// verification link to the clipboard (the offline fallback to scanning).
class ConfirmationQr extends StatelessWidget {
  const ConfirmationQr({
    super.key,
    required this.verificationUrl,
    this.size = 176,
  });

  final String verificationUrl;
  final double size;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        Clipboard.setData(ClipboardData(text: verificationUrl));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Odkaz pro ověření byl zkopírován'),
            duration: Duration(seconds: 2),
          ),
        );
      },
      borderRadius: BorderRadius.circular(BroumyRadii.md),
      child: Padding(
        padding: const EdgeInsets.all(BroumySpacing.sm),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(BroumySpacing.md),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(BroumyRadii.md),
                border: Border.all(color: BroumyColors.border),
              ),
              child: QrImageView(
                data: verificationUrl,
                version: QrVersions.auto,
                size: size,
                backgroundColor: Colors.white,
                eyeStyle: const QrEyeStyle(
                  eyeShape: QrEyeShape.square,
                  color: Color(0xFF000000),
                ),
                dataModuleStyle: const QrDataModuleStyle(
                  dataModuleShape: QrDataModuleShape.square,
                  color: Color(0xFF000000),
                ),
              ),
            ),
            const SizedBox(height: BroumySpacing.sm),
            Text(
              'Klepnutím zkopírujete odkaz pro ověření',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: BroumyColors.textLink,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
