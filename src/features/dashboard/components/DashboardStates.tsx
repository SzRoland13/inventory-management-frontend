export function DashboardEmptyState({ text }: { text: string }) {
  return (
    <div className='flex min-h-36 items-center justify-center text-center text-sm text-zinc-500'>
      {text}
    </div>
  );
}

export function DashboardChartSkeleton() {
  return (
    <div className='mt-5 flex h-36 animate-pulse items-end gap-2' aria-hidden='true'>
      {[35, 54, 44, 70, 52, 83, 61, 45, 75, 58, 90, 65].map((height, index) => (
        <div
          key={index}
          className='flex-1 rounded-t bg-zinc-800'
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

export function DashboardRowsSkeleton() {
  return (
    <div className='space-y-4'>
      {[1, 2, 3].map((row) => (
        <div key={row} className='h-10 animate-pulse rounded-lg bg-zinc-800/70' />
      ))}
    </div>
  );
}
