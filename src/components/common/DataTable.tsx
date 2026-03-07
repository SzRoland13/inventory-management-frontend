/* eslint-disable indent */
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils/css';
import { flexRender, Table as ReactTable } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

interface DataTableProps<T> {
  table: ReactTable<T>;
  className?: string;
}

export function DataTable<T>({ table, className }: DataTableProps<T>) {
  const t = useTranslations();
  return (
    <div className={cn('w-full bg-zinc-800', className)}>
      <Table className='w-full'>
        <TableHeader className='bg-gradient-to-b from-zinc-600 to-zinc-600/80 text-zinc-100'>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id} className='text-zinc-100'>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : ''}
                className={cn(
                  'data-[state=selected]:bg-zinc-750',
                  'hover:bg-zinc-700/60 cursor-pointer transition-colors',
                  row.getIsSelected() && 'bg-zinc-700',
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className='h-24 text-center text-zinc-400'
              >
                {t('common.no-results')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
