import { useTranslations } from 'next-intl';
import { Boxes } from 'lucide-react';
import { AppDialogHeader } from '@/features/shared/components/AppDialogLayout';

export function ProductFormDialogHeader({ editing }: { editing: boolean }) {
  const t = useTranslations();

  return (
    <AppDialogHeader
      title={t(
        editing
          ? 'pages.products.dialog.edit-title'
          : 'pages.products.dialog.create-title',
      )}
      description={t(
        editing
          ? 'pages.products.dialog.edit-description'
          : 'pages.products.dialog.create-description',
      )}
      icon={Boxes}
      hideDescription
    />
  );
}
