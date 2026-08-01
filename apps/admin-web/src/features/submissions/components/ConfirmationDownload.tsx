import { useState } from 'react';
import { Download } from 'lucide-react';
import { BroumyAlert, BroumyButton } from '../../../components/ui';
import { downloadConfirmationPdf } from '../api/confirmationsApi';

interface ConfirmationDownloadProps {
  trackingCode: string;
}

/**
 * Downloads the backend PDF/A-1b confirmation for a submission and triggers a
 * browser save with a descriptive filename.
 */
export function ConfirmationDownload({ trackingCode }: ConfirmationDownloadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await downloadConfirmationPdf(trackingCode);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `potvrzeni-${trackingCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Stažení PDF se nezdařilo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <BroumyButton
        variant="secondary"
        icon={<Download size={16} />}
        loading={loading}
        onClick={handleDownload}
      >
        Stáhnout PDF
      </BroumyButton>
      {error && (
        <div className="mt-2">
          <BroumyAlert variant="error">{error}</BroumyAlert>
        </div>
      )}
    </div>
  );
}
