interface DataTableLoadingStateProps {
  label: string;
  rows?: number;
}

export function DataTableLoadingState({
  label,
  rows = 5,
}: DataTableLoadingStateProps) {
  return (
    <div
      className='space-y-3 p-4'
      aria-label={label}
      aria-busy='true'
      role='status'
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className='h-10 animate-pulse rounded bg-zinc-800'
        />
      ))}
    </div>
  );
}
