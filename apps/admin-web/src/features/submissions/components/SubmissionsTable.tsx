import { useMemo, useRef, type KeyboardEvent } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { AdminSubmissionListItem, SlaStatus, SubmissionStatus } from '../types/admin';

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  SUBMITTED: 'Přijato',
  PROCESSING: 'Zpracovává se',
  NEEDS_INFO: 'Čeká na doplnění',
  COMPLETED: 'Vyřízeno',
  REJECTED: 'Zamítnuto',
};

const STATUS_BADGE_CLASS: Record<SubmissionStatus, string> = {
  SUBMITTED: 'badge-info',
  PROCESSING: 'badge-primary',
  NEEDS_INFO: 'badge-warning',
  COMPLETED: 'badge-success',
  REJECTED: 'badge-error',
};

const SLA_LABEL: Record<SlaStatus, string> = {
  CLOSED: 'Uzavřeno',
  OK: 'V pořádku',
  DUE_THIS_WEEK: 'Termín tento týden',
  DUE_TODAY: 'Termín dnes',
  OVERDUE: 'Po termínu',
};

const SLA_BADGE_CLASS: Record<SlaStatus, string> = {
  CLOSED: 'badge-neutral',
  OK: 'badge-success',
  DUE_THIS_WEEK: 'badge-warning',
  DUE_TODAY: 'badge-warning',
  OVERDUE: 'badge-error',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' });
}

interface SubmissionsTableProps {
  rows: AdminSubmissionListItem[];
  formTitles: Record<string, string>;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  selectedId: string | null;
  onSelect: (row: AdminSubmissionListItem) => void;
}

/**
 * Accessible, server-side-sorted submissions table: sortable column headers
 * (button + aria-sort), row selection with visible focus + Enter/Space
 * activation, and a polite live region announcing the SLA risk summary as
 * the visible page changes (screen readers otherwise never learn there's a
 * new "overdue" row above the fold after a filter change).
 */
export function SubmissionsTable({
  rows,
  formTitles,
  sorting,
  onSortingChange,
  selectedId,
  onSelect,
}: SubmissionsTableProps) {
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  const columns = useMemo<ColumnDef<AdminSubmissionListItem>[]>(
    () => [
      {
        accessorKey: 'trackingCode',
        header: 'Číslo podání',
        enableSorting: true,
        cell: (info) => <span className="font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'formKey',
        header: 'Formulář',
        enableSorting: true,
        cell: (info) => {
          const key = info.getValue() as string;
          return formTitles[key] ?? key;
        },
      },
      {
        accessorKey: 'status',
        header: 'Stav',
        enableSorting: true,
        cell: (info) => {
          const value = info.getValue() as SubmissionStatus;
          return (
            <span className={`badge ${STATUS_BADGE_CLASS[value]}`}>{STATUS_LABEL[value]}</span>
          );
        },
      },
      {
        accessorKey: 'slaStatus',
        header: 'SLA',
        enableSorting: false,
        cell: (info) => {
          const value = info.getValue() as SlaStatus;
          return <span className={`badge ${SLA_BADGE_CLASS[value]}`}>{SLA_LABEL[value]}</span>;
        },
      },
      {
        accessorKey: 'submittedAt',
        header: 'Odesláno',
        enableSorting: true,
        cell: (info) => formatDate(info.getValue() as string),
      },
    ],
    [formTitles],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      onSortingChange(next);
    },
  });

  const overdueCount = rows.filter((r) => r.slaStatus === 'OVERDUE').length;
  const dueTodayCount = rows.filter((r) => r.slaStatus === 'DUE_TODAY').length;

  const handleRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, row: AdminSubmissionListItem) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(row);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const rowsEls = tbodyRef.current?.querySelectorAll<HTMLTableRowElement>('tr[tabindex]');
      if (!rowsEls) return;
      const idx = Array.from(rowsEls).indexOf(e.currentTarget);
      const nextIdx = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
      rowsEls[nextIdx]?.focus();
    }
  };

  return (
    <div>
      <div className="visually-hidden" role="status" aria-live="polite">
        {rows.length} podání na této stránce
        {overdueCount > 0 ? `, ${overdueCount} po termínu` : ''}
        {dueTodayCount > 0 ? `, ${dueTodayCount} s termínem dnes` : ''}.
      </div>
      <div className="table-responsive">
        <table className="table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      aria-sort={
                        sortDir === 'asc' ? 'ascending' : sortDir === 'desc' ? 'descending' : sortable ? 'none' : undefined
                      }
                    >
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          className="flex items-center gap-1 font-medium"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDir === 'asc' ? (
                            <ArrowUp size={14} aria-hidden="true" />
                          ) : sortDir === 'desc' ? (
                            <ArrowDown size={14} aria-hidden="true" />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-40" aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody ref={tbodyRef}>
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
                  tabIndex={0}
                  aria-current={selectedId === row.original.id ? 'true' : undefined}
                  onClick={() => onSelect(row.original)}
                  onKeyDown={(e) => handleRowKeyDown(e, row.original)}
                  className={`cursor-pointer ${selectedId === row.original.id ? 'bg-primary/10' : ''}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
