import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { BroumySelect, type BroumySelectOption } from '../../../components/ui/BroumySelect'
import type { Submission, SubmissionStatus } from '../types/submission'
import { getFormCatalog, getSubmissions } from '../api/submissionsApi'

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' })
}

function statusLabel(status: SubmissionStatus): string {
  switch (status) {
    case 'SUBMITTED':
      return 'Přijato'
    case 'IN_PROGRESS':
      return 'Vyřizuje se'
    case 'APPROVED':
      return 'Vyřízeno'
    case 'REJECTED':
      return 'Zamítnuto'
    default:
      return status
  }
}

interface SubmissionListProps {
  onSelect?: (submission: Submission) => void
}

/**
 * Server-side paginated submission list with status/formKey filtering.
 */
export function SubmissionList({ onSelect }: SubmissionListProps) {
  const [status, setStatus] = useState<string>('')
  const [formKey, setFormKey] = useState<string>('')

  const { data: forms = [] } = useQuery({
    queryKey: ['forms-catalog'],
    queryFn: getFormCatalog,
  })

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['submissions', status, formKey],
    queryFn: () =>
      getSubmissions({
        status: status || undefined,
        formKey: formKey || undefined,
        page: 0,
        size: 20,
      }),
  })

  const columns = useMemo<ColumnDef<Submission>[]>(
    () => [
      {
        accessorKey: 'trackingCode',
        header: 'Číslo podání',
        cell: (info) => (
          <span className="font-medium">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'formKey',
        header: 'Formulář',
        cell: (info) => {
          const key = info.getValue() as string
          const entry = forms.find((f) => f.formKey === key)
          return entry?.title.cs ?? key
        },
      },
      {
        accessorKey: 'status',
        header: 'Stav',
        cell: (info) => {
          const value = info.getValue() as SubmissionStatus
          return (
            <span className={`badge badge-${value.toLowerCase()}`}>
              {statusLabel(value)}
            </span>
          )
        },
      },
      {
        accessorKey: 'submittedAt',
        header: 'Odesláno',
        cell: (info) => formatDate(info.getValue() as string),
      },
    ],
    [forms],
  )

  const table = useReactTable({
    data: data?.content ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: data?.totalElements ?? 0,
  })

  const statusOptions: BroumySelectOption[] = [
    { value: '', label: 'Všechny stavy' },
    ...(['SUBMITTED', 'IN_PROGRESS', 'APPROVED', 'REJECTED'] as const).map(
      (s) => ({ value: s, label: statusLabel(s) }),
    ),
  ]

  const formOptions: BroumySelectOption[] = [
    { value: '', label: 'Všechny formuláře' },
    ...forms.map((f) => ({ value: f.formKey, label: f.title.cs })),
  ]

  if (isLoading) {
    return <p className="p-4">Načítám podání…</p>
  }

  if (isError) {
    return (
      <div className="p-4">
        <p className="mb-2">Nepodařilo se načíst seznam podání.</p>
        <button type="button" className="btn btn-primary" onClick={() => refetch()}>
          Zkusit znovu
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <div className="w-48">
          <BroumySelect
            label="Stav"
            value={status}
            options={statusOptions}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>
        <div className="w-64">
          <BroumySelect
            label="Formulář"
            value={formKey}
            options={formOptions}
            onChange={(e) => setFormKey(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center">
                  Žádná podání.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onSelect?.(row.original)}
                  className={onSelect ? 'cursor-pointer' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {data && <p className="mt-2 text-sm">{data.totalElements} podání celkem</p>}
    </div>
  )
}
