import { useRef } from 'react';
import { Printer } from 'lucide-react';
import { BroumyButton, BroumyModal } from '../../../components/ui';
import { confirmationHtmlUrl } from '../api/confirmationsApi';

interface ConfirmationPreviewProps {
  trackingCode: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Modal previewing the backend-rendered confirmation HTML in an iframe, with a
 * print button that triggers the browser's print-to-PDF dialog on the frame.
 */
export function ConfirmationPreview({
  trackingCode,
  open,
  onClose,
}: ConfirmationPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <BroumyModal
      open={open}
      onClose={onClose}
      title={`Náhled potvrzení ${trackingCode}`}
      className="confirmation-preview-modal"
      footer={
        <BroumyButton
          icon={<Printer size={16} />}
          onClick={() => iframeRef.current?.contentWindow?.print()}
        >
          Tisknout / uložit jako PDF
        </BroumyButton>
      }
    >
      <iframe
        ref={iframeRef}
        title={`Náhled potvrzení ${trackingCode}`}
        src={confirmationHtmlUrl(trackingCode)}
        className="confirmation-preview-iframe"
      />
    </BroumyModal>
  );
}
