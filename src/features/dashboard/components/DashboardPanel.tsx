import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

export function DashboardPanel({ children, className = '' }: Props) {
  return (
    <section
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg shadow-black/10 sm:p-5 ${className}`}
    >
      {children}
    </section>
  );
}
