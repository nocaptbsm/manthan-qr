import React from 'react';
import { FileQuestion } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({ data, columns, isLoading, emptyMessage = 'No data found' }: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto rounded-xl border border-[var(--border-color)]">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {columns.map((_, j) => (
                  <td key={j}>
                    <div className="h-4 w-3/4 skeleton"></div>
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
      <div className="empty-state border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)]">
        <FileQuestion />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Results</h3>
        <p className="mt-1">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[var(--border-color)]">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col, colIndex) => {
                const cellValue = col.cell 
                  ? col.cell(row) 
                  : (row as any)[col.accessorKey];
                  
                return <td key={colIndex}>{cellValue}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
