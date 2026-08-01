import { useState } from 'react';
import { Download } from 'lucide-react';
import { BroumyAlert, BroumyButton } from '../../../components/ui';
import { downloadAdminSubmissionsCsv } from '../api/adminSubmissionsApi';
import type { AdminSubmissionFilters } from '../types/admin';

interface CsvExportButtonProps {
  /** Same filters as the currently displayed table, so the export matches what's on screen. */
  filters: AdminSubmissionFilters;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Triggers the streaming CSV export (`GET /api/admin/submissions/export`)
 * and saves it as `submissions-YYYY-MM-DD.csv`. Uses a blob download (via
 * the shared axios client, so the bearer token is attached) rather than a
 * plain link - the endpoint requires ROLE_CLERK.
 */
export function CsvExportButton({ filters }: CsvExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await downloadAdminSubmissionsCsv(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `submissions-${todayIso()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Export CSV se nezdařil.');
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
        onClick={handleExport}
      >
        Export CSV
      </BroumyButton>
      {error && (
        <div className="mt-2">
          <BroumyAlert variant="error">{error}</BroumyAlert>
        </div>
      )}
    </div>
  );
}
