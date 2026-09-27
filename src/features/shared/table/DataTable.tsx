/* eslint-disable indent */
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/features/shared/components/ui/table';
import { cn } from '@/features/shared/utils/css';
import { flexRender, Table as ReactTable } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

interface DataTableProps<T> {
  table: ReactTable<T>;
  className?: string;
}

export function DataTable<T>({ table, className }: DataTableProps<T>) {
  const t = useTranslations();
  const rows = table.getRowModel().rows;
  const headers = table.getHeaderGroups()[0]?.headers ?? [];

  return (
    <div className={cn('w-full bg-zinc-800', className)}>
      <div className='hidden md:block'>
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
            {rows.length ? (
              rows.map((row) => (
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
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

      <div className='space-y-3 p-3 md:hidden'>
        {rows.length ? (
          rows.map((row) => (
            <article
              key={row.id}
              data-state={row.getIsSelected() ? 'selected' : ''}
              className={cn(
                'rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-zinc-100',
                row.getIsSelected() && 'border-zinc-500 bg-zinc-700',
              )}
            >
              <dl className='space-y-3'>
                {row.getVisibleCells().map((cell) => {
                  const header = headers.find(
                    (candidate) => candidate.column.id === cell.column.id,
                  );

                  return (
                    <div
                      key={cell.id}
                      className='flex min-w-0 items-start justify-between gap-4'
                    >
                      <dt className='shrink-0 text-sm text-zinc-400'>
                        {header && !header.isPlaceholder
                          ? flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )
                          : null}
                      </dt>
                      <dd className='min-w-0 text-right'>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </article>
          ))
        ) : (
          <div className='py-10 text-center text-zinc-400'>
            {t('common.no-results')}
          </div>
        )}
      </div>
    </div>
  );
}
