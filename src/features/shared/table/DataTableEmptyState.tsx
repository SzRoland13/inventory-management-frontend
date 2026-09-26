import type { ReactNode } from 'react';

interface DataTableEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function DataTableEmptyState({
  icon,
  title,
  description,
  action,
}: DataTableEmptyStateProps) {
  return (
    <div className='flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center'>
      {icon}
      <div>
        <h2 className='font-medium text-zinc-100'>{title}</h2>
        {description && (
          <p className='mt-1 max-w-md text-sm text-zinc-400'>{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
