'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import { ValidationMessage } from '@/features/shared/components/ValidationMessage';
import { cn } from '@/features/shared/utils/css';

type AuthFormFieldProps = Omit<ComponentProps<typeof Input>, 'id'> & {
  id: string;
  label: ReactNode;
  error?: string;
};

export function AuthFormField({
  id,
  label,
  error,
  className,
  ...inputProps
}: AuthFormFieldProps) {
  return (
    <div className='flex flex-col gap-2'>
      <Label htmlFor={id} className='text-zinc-300'>
        {label}
      </Label>
      <Input
        id={id}
        className={cn(
          'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400',
          className,
        )}
        {...inputProps}
      />
      <ValidationMessage messageKey={error} />
    </div>
  );
}
