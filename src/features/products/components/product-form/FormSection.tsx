import type { ReactNode } from 'react';
import { Boxes } from 'lucide-react';

type FieldLabelProps = {
  children: ReactNode;
  required?: boolean;
  htmlFor?: string;
};

export function FieldLabel({
  children,
  required = false,
  htmlFor,
}: FieldLabelProps) {
  const className = 'mb-1 block text-sm font-medium text-zinc-200';
  const content = (
    <>
      {children}
      {required && <span className='ml-1 text-red-400'>*</span>}
    </>
  );

  return htmlFor ? (
    <label htmlFor={htmlFor} className={className}>
      {content}
    </label>
  ) : (
    <span className={className}>{content}</span>
  );
}

export function FormSection({
  title,
  icon: Icon,
  children,
  className = '',
}: {
  title: string;
  icon: typeof Boxes;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-zinc-700/80 bg-zinc-800/50 p-4 sm:p-5 ${className}`}
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
