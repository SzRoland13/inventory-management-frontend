'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/features/shared/components/ui/dialog';
import { cn } from '@/features/shared/utils/css';

export function AppDialogHeader({
  title,
  description,
  icon: Icon,
  hideDescription = false,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  hideDescription?: boolean;
}) {
  return (
    <DialogHeader className='shrink-0 border-b border-zinc-700/80 bg-zinc-900 px-6 py-5 pr-14 sm:px-8'>
      <div className='flex items-center gap-3'>
        <span className='flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300'>
          <Icon className='h-5 w-5' />
        </span>
        <DialogTitle className='text-xl tracking-tight'>{title}</DialogTitle>
      </div>
      <DialogDescription
        className={hideDescription ? 'sr-only' : 'text-zinc-400'}
      >
        {description}
      </DialogDescription>
    </DialogHeader>
  );
}

export function AppDialogBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'min-h-0 flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-8',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AppDialogFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <DialogFooter
      className={cn(
        'shrink-0 border-t border-zinc-700/80 bg-zinc-900 px-6 py-4 sm:px-8',
        className,
      )}
    >
      {children}
    </DialogFooter>
  );
}

export function AppDialogSection({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-zinc-700/80 bg-zinc-800/50 p-4 sm:p-5',
        className,
      )}
    >
      <h3 className='mb-4 flex items-center gap-2.5 text-sm font-semibold text-zinc-100'>
        <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-700/70 text-zinc-300'>
          <Icon className='h-4 w-4' />
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function AppDialogCard({ children }: { children: ReactNode }) {
  return (
    <div className='rounded-xl border border-zinc-700/80 bg-zinc-800/50 p-4 text-sm text-zinc-300 sm:p-5'>
      {children}
    </div>
  );
}

export const appDialogCancelButtonClass =
  'border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white';

export const appDialogPrimaryButtonClass =
  'bg-indigo-500 text-white hover:bg-indigo-400 disabled:bg-zinc-700 disabled:text-zinc-400 disabled:opacity-100';
