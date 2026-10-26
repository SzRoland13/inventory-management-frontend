import { useTranslations } from 'next-intl';
import { Button } from '@/features/shared/components/ui/button';
import {
  AppDialogFooter,
  appDialogCancelButtonClass,
  appDialogPrimaryButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/features/shared/components/ui/tooltip';

type ProductFormDialogFooterProps = {
  editing: boolean;
  busy: boolean;
  onCancel: () => void;
  onSave: () => void;
  onPublish: () => void;
};

export function ProductFormDialogFooter({
  editing,
  busy,
  onCancel,
  onSave,
  onPublish,
}: ProductFormDialogFooterProps) {
  const t = useTranslations();

  return (
    <AppDialogFooter>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            variant='outline'
            className={appDialogCancelButtonClass}
            onClick={onCancel}
          >
            {t('common.cancel')}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {t('pages.products.dialog.tooltips.cancel')}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            className={appDialogPrimaryButtonClass}
            disabled={busy}
            onClick={onSave}
          >
            {busy ? t('common.saving') : t('common.save')}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {t(
            `pages.products.dialog.tooltips.${editing ? 'save-edit' : 'save-draft'}`,
          )}
        </TooltipContent>
      </Tooltip>

      {!editing && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              className='bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-400 disabled:opacity-100'
              disabled={busy}
              onClick={onPublish}
            >
              {busy ? t('common.saving') : t('pages.products.actions.publish')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t('pages.products.dialog.tooltips.publish')}
          </TooltipContent>
        </Tooltip>
      )}
    </AppDialogFooter>
  );
}
