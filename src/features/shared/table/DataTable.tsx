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
  horizontalScroll?: boolean;
  stickyColumnId?: string;
}

export function DataTable<T>({
  table,
  className,
  horizontalScroll = false,
  stickyColumnId,
}: DataTableProps<T>) {
  const t = useTranslations();
  const rows = table.getRowModel().rows;
  const headers = table.getHeaderGroups()[0]?.headers ?? [];

  return (
    <div className={cn('w-full bg-zinc-800', className)}>
      <div className='hidden md:block'>
        <Table className={cn('w-full', horizontalScroll && 'min-w-max')}>
          <TableHeader className='bg-gradient-to-b from-zinc-600 to-zinc-600/80 text-zinc-100'>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className='hover:bg-transparent'>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'text-zinc-100',
                      stickyColumnId === header.column.id &&
                        'sticky left-0 z-20 bg-zinc-600 shadow-[2px_0_4px_rgba(0,0,0,0.25)]',
                    )}
                  >
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
                    'group hover:bg-zinc-700/60 cursor-pointer transition-colors',
                    row.getIsSelected() && 'bg-zinc-700',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        stickyColumnId === cell.column.id &&
                          'sticky left-0 z-10 bg-zinc-800 shadow-[2px_0_4px_rgba(0,0,0,0.25)] group-hover:bg-zinc-700',
                        row.getIsSelected() &&
                          stickyColumnId === cell.column.id &&
                          'bg-zinc-700',
                      )}
                    >
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
