import { useQuery } from '@tanstack/react-query'
import { BroumyButton } from '../../../components/ui/BroumyButton'
import type { Submission } from '../types/submission'
import { getSubmission } from '../api/submissionsApi'

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

interface SubmissionFormProps {
  trackingCode: string
  onBack: () => void
}

/**
 * Read-only detail view of a single submission including its form data.
 */
export function SubmissionForm({ trackingCode, onBack }: SubmissionFormProps) {
  const { data, isLoading, isError, refetch } = useQuery<Submission>({
    queryKey: ['submission', trackingCode],
    queryFn: () => getSubmission(trackingCode),
  })

  if (isLoading) {
    return <p className="p-4">Načítám podání…</p>
  }

  if (isError || !data) {
    return (
      <div className="p-4">
        <p className="mb-2">Nepodařilo se načíst podání {trackingCode}.</p>
        <BroumyButton onClick={() => refetch()}>Zkusit znovu</BroumyButton>
      </div>
    )
  }

  return (
    <div>
      <BroumyButton variant="secondary" onClick={onBack}>
        ← Zpět na seznam
      </BroumyButton>

      <h1 className="mt-4 mb-2">Podání {data.trackingCode}</h1>

      <dl className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <dt className="font-medium">Formulář</dt>
          <dd>{data.formKey}</dd>
        </div>
        <div>
          <dt className="font-medium">Stav</dt>
          <dd>
            <span className={`badge badge-${data.status.toLowerCase()}`}>
              {data.status}
            </span>
          </dd>
        </div>
        <div>
          <dt className="font-medium">Odesláno</dt>
          <dd>{new Date(data.submittedAt).toLocaleString('cs-CZ')}</dd>
        </div>
        <div>
          <dt className="font-medium">Kontaktní e-mail</dt>
          <dd>{data.contactEmail ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium">Kontaktní telefon</dt>
          <dd>{data.contactPhone ?? '—'}</dd>
        </div>
      </dl>

      <h2 className="mb-2">Obsah podání</h2>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Pole</th>
              <th>Hodnota</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.formData ?? {}).map(([key, value]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>
                  <pre className="whitespace-pre-wrap">{formatValue(value)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
