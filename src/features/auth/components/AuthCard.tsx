'use client';

import type { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/features/shared/components/ui/card';
import { cn } from '@/features/shared/utils/css';

interface AuthCardProps {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  headerAccessory?: ReactNode;
  size?: 'sm' | 'md';
}

export function AuthCard({
  title,
  description,
  children,
  footer,
  headerAccessory,
  size = 'sm',
}: AuthCardProps) {
  return (
    <Card
      className={cn(
        'w-full bg-zinc-900 border-zinc-700 shadow-xl',
        size === 'sm' ? 'max-w-sm' : 'max-w-md',
      )}
    >
      <CardHeader
        className={cn(
          headerAccessory &&
            'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2',
        )}
      >
        {headerAccessory ? (
          <div>
            <CardTitle className='text-xl font-semibold text-zinc-100'>
              {title}
            </CardTitle>
            <CardDescription className='text-zinc-400'>
              {description}
            </CardDescription>
          </div>
        ) : (
          <>
            <CardTitle className='text-xl font-semibold text-zinc-100'>
              {title}
            </CardTitle>
            <CardDescription className='text-zinc-400'>
              {description}
            </CardDescription>
          </>
        )}
        {headerAccessory}
      </CardHeader>

      <CardContent>{children}</CardContent>

      {footer !== undefined && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
