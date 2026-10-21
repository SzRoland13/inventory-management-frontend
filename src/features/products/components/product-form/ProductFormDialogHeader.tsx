import { useTranslations } from 'next-intl';
import { Boxes } from 'lucide-react';
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/features/shared/components/ui/dialog';

export function ProductFormDialogHeader({ editing }: { editing: boolean }) {
  const t = useTranslations();

  return (
    <DialogHeader className='shrink-0 border-b border-zinc-700/80 bg-zinc-900 px-6 py-5 pr-14 sm:px-8'>
      <div className='flex items-center gap-3'>
        <span className='flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300'>
          <Boxes className='h-5 w-5' />
        </span>
        <DialogTitle className='text-xl tracking-tight'>
          {t(
            editing
              ? 'pages.products.dialog.edit-title'
              : 'pages.products.dialog.create-title',
          )}
        </DialogTitle>
      </div>
      <DialogDescription className='sr-only'>
        {t(
          editing
            ? 'pages.products.dialog.edit-description'
            : 'pages.products.dialog.create-description',
        )}
      </DialogDescription>
    </DialogHeader>
  );
}
