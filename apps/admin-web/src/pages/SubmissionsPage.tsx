import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { SortingState } from '@tanstack/react-table'
import { RefreshCw } from 'lucide-react'
import { BroumyInput, BroumySelect, type BroumySelectOption } from '../components/ui'
import { getFormCatalog } from '../features/submissions/api/submissionsApi'
import { CsvExportButton } from '../features/submissions/components/CsvExportButton'
import { SubmissionDetailPanel } from '../features/submissions/components/SubmissionDetailPanel'
import { SubmissionsTable } from '../features/submissions/components/SubmissionsTable'
import { useAdminSubmissions } from '../features/submissions/hooks/useSubmissions'
import type { AdminSubmissionFilters, SubmissionStatus } from '../features/submissions/types/admin'

const STATUS_OPTIONS: { value: SubmissionStatus; label: string }[] = [
  { value: 'SUBMITTED', label: 'Přijato' },
  { value: 'PROCESSING', label: 'Zpracovává se' },
  { value: 'NEEDS_INFO', label: 'Čeká na doplnění' },
  { value: 'COMPLETED', label: 'Vyřízeno' },
  { value: 'REJECTED', label: 'Zamítnuto' },
]

const PAGE_SIZE = 20

function toIsoOrUndefined(dateInput: string, endOfDay = false): string | undefined {
  if (!dateInput) return undefined
  const date = new Date(`${dateInput}T${endOfDay ? '23:59:59' : '00:00:00'}`)
  return date.toISOString()
}

/**
 * Admin submissions dashboard: server-side paginated/filtered/sorted table
 * with SLA risk badges, a slide-over detail panel, clerk-driven state
 * changes with mandatory audit comment, and streaming CSV export.
 */
export function SubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus[]>([])
  const [formKey, setFormKey] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'submittedAt', desc: true }])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const { data: forms = [] } = useQuery({
    queryKey: ['forms-catalog'],
    queryFn: getFormCatalog,
  })
  const formTitles = useMemo(
    () => Object.fromEntries(forms.map((f) => [f.formKey, f.title.cs ?? f.formKey])),
    [forms],
  )
  const formOptions: BroumySelectOption[] = [
    { value: '', label: 'Všechny formuláře' },
    ...forms.map((f) => ({ value: f.formKey, label: f.title.cs ?? f.formKey })),
  ]

  const sortColumn = sorting[0]
  const filters: AdminSubmissionFilters = {
    status: statusFilter.length > 0 ? statusFilter : undefined,
    formKey: formKey || undefined,
    from: toIsoOrUndefined(from),
    to: toIsoOrUndefined(to, true),
    q: q || undefined,
    page,
    size: PAGE_SIZE,
    sort: sortColumn ? (sortColumn.id === 'submittedAt' ? 'createdAt' : sortColumn.id) : 'createdAt',
    direction: sortColumn?.desc === false ? 'asc' : 'desc',
  }

  const { data, isLoading, isError, refetch } = useAdminSubmissions(filters)

  const toggleStatus = (status: SubmissionStatus) => {
    setPage(0)
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1>Podání</h1>
        <CsvExportButton filters={filters} />
      </div>

      <div role="status" aria-live="polite" className="visually-hidden">
        {announcement}
      </div>

      <fieldset className="mb-4 border border-border rounded-md p-4">
        <legend className="px-1 font-medium">Filtrovat podle stavu</legend>
        <div className="flex gap-4 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={statusFilter.includes(opt.value)}
                onChange={() => toggleStatus(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-4 mb-4 flex-wrap items-end">
        <div className="w-64">
          <BroumySelect
            label="Formulář"
            value={formKey}
            options={formOptions}
            onChange={(e) => {
              setPage(0)
              setFormKey(e.target.value)
            }}
          />
        </div>
        <div className="w-44">
          <BroumyInput
            label="Odesláno od"
            type="date"
            value={from}
            onChange={(e) => {
              setPage(0)
              setFrom(e.target.value)
            }}
          />
        </div>
        <div className="w-44">
          <BroumyInput
            label="Odesláno do"
            type="date"
            value={to}
            onChange={(e) => {
              setPage(0)
              setTo(e.target.value)
            }}
          />
        </div>
        <div className="w-64">
          <BroumyInput
            label="Hledat (číslo podání, e-mail)"
            value={q}
            onChange={(e) => {
              setPage(0)
              setQ(e.target.value)
            }}
            placeholder="0000018b66a2..."
          />
        </div>
      </div>

      {isLoading && <p>Načítám podání…</p>}

      {isError && (
        <div>
          <p className="mb-2">Nepodařilo se načíst seznam podání.</p>
          <button type="button" className="btn btn-secondary" onClick={() => refetch()}>
            <RefreshCw size={16} className="btn-icon" aria-hidden="true" />
            Zkusit znovu
          </button>
        </div>
      )}

      {data && (
        <>
          <SubmissionsTable
            rows={data.content}
            formTitles={formTitles}
            sorting={sorting}
            onSortingChange={setSorting}
            selectedId={selectedId}
            onSelect={(row) => setSelectedId(row.id)}
          />

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm">{data.totalElements} podání celkem</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Předchozí
              </button>
              <span className="text-sm px-2 py-1">
                Stránka {page + 1} z {Math.max(1, data.totalPages)}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={page + 1 >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Další
              </button>
            </div>
          </div>
        </>
      )}

      {selectedId && (
        <SubmissionDetailPanel
          submissionId={selectedId}
          onClose={() => setSelectedId(null)}
          onAnnounce={setAnnouncement}
        />
      )}
    </div>
  )
}
