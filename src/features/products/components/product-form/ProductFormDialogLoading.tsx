import { useTranslations } from 'next-intl';

export function ProductFormDialogLoading() {
  const t = useTranslations();

  return (
    <p className='py-16 text-center text-zinc-300'>
      {t('pages.products.loading')}
    </p>
  );
}
