import React from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  emptyMessage = 'Nessun dato trovato',
  loading = false,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="w-full overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-background border-b border-border">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={cn("px-4 py-3 font-medium text-text-secondary", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {columns.map((col, j) => (
                  <td key={j} className={cn("px-4 py-4", col.className)}>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full rounded-lg border border-border bg-surface shadow-sm flex flex-col items-center justify-center p-12 text-center">
        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Inbox className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-text-primary mb-1">Nessun risultato</h3>
        <p className="text-sm text-text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-background border-b border-border">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className={cn("px-4 py-3 font-medium text-text-secondary", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              {columns.map((col, i) => (
                <td key={i} className={cn("px-4 py-3 text-text-primary", col.className)}>
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
