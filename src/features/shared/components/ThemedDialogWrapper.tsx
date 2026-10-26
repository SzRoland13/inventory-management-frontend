'use client';

import * as React from 'react';
import { DialogContent } from '@/features/shared/components/ui/dialog';
import { cn } from '@/features/shared/utils/css';

/**
 * A reusable wrapper for DialogContent that applies
 * a consistent dark theme and allows further customization.
 */
export function ThemedDialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn(
        'flex max-h-[92dvh] max-w-md flex-col gap-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 p-0 text-zinc-100 shadow-2xl shadow-black/50',
        className,
      )}
      {...props}
    >
      {children}
    </DialogContent>
  );
}
