'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
  isNumeric?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

/**
 * Professional DataTable Component
 * Tailwind-only implementation based on DASHBOARD_DESIGN_SPEC.md
 */
export default function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
  className,
}: DataTableProps<T>) {
  const getCellValue = (row: T, accessor: Column<T>['accessor']): ReactNode => {
    if (typeof accessor === 'function') {
      return accessor(row);
    }
    return row[accessor] as ReactNode;
  };

  if (data.length === 0) {
    return (
      <div className={cn('card p-8 text-center', className)}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('card p-0 overflow-hidden', className)}>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={cn(
                    column.isNumeric && 'text-right',
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={row.id ?? rowIndex}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      column.isNumeric && 'numeric',
                      column.className
                    )}
                  >
                    {getCellValue(row, column.accessor)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Table Action Button - Appears on row hover
 */
interface TableActionProps {
  icon: ReactNode;
  onClick: () => void;
  label: string;
}

export function TableAction({ icon, onClick, label }: TableActionProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="actions p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
      aria-label={label}
    >
      {icon}
    </button>
  );
}

/**
 * Table Actions Container
 */
export function TableActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1 justify-end actions">
      {children}
    </div>
  );
}
