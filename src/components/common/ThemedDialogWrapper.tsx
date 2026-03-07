'use client';

import * as React from 'react';
import { DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils/css';

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
        'max-w-md bg-zinc-700 text-zinc-100 border border-zinc-800',
        'rounded-xl shadow-2xl backdrop-blur-md p-6',
        className,
      )}
      {...props}
    >
      {children}
    </DialogContent>
  );
}
