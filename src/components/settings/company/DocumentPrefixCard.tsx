'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { DocumentPrefixService } from '@/lib/services/DocumentPrefixService';
import {
  DocumentPrefixesUpdateRequest,
  DocumentPrefixDto,
} from '@/lib/services/dtos/documentPrefixDtos';
import { useFormChanges } from '@/lib/hooks/useFormChanges';
import CardWrapper from '@/components/common/CardWrapper';

type FormValues = {
  prefixes: DocumentPrefixDto[];
};

export default function DocumentPrefixCard() {
  const t = useTranslations();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      prefixes: [],
    },
  });

  const values = watch();
  const prefixes = values.prefixes;
  const { hasChanges, setInitialValues, resetToInitial } =
    useFormChanges(values);

  useEffect(() => {
    const load = async () => {
      const res = await DocumentPrefixService.getAll();

      if (res.success && res.payload) {
        const values = {
          prefixes: res.payload.prefixes,
        };

        reset(values);
        setInitialValues(values);
      }
    };

    load();
  }, [reset, setInitialValues]);

  const onSubmit = async (data: DocumentPrefixesUpdateRequest) => {
    const res = await DocumentPrefixService.updateAll(data);

    if (res.success && res.payload) {
      const values = {
        prefixes: res.payload.prefixes,
      };

      reset(values);
      setInitialValues(values);

      toast(t(`messageKey.${res.messageKey}`));
    }
  };

  const handleReset = () => {
    const initial = resetToInitial();
    if (!initial) return;

    reset(initial);
  };

  return (
    <CardWrapper
      title={t('pages.settings.tabs.company.prefix.title')}
      description={t('pages.settings.tabs.company.prefix.description')}
      headerAction={
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={!hasChanges}
          onClick={handleReset}
        >
          {t('common.reset')}
        </Button>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='grid grid-cols-1 md:grid-cols-2 gap-4'
      >
        {prefixes?.map((prefix, index) => (
          <div key={prefix.documentType} className='flex flex-col gap-2'>
            <Label className='text-zinc-400'>
              {t(
                `pages.settings.tabs.company.prefix.types.${prefix.documentType}`,
              )}
            </Label>

            <Input
              {...register(`prefixes.${index}.prefix`)}
              className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
            />

            <input
              type='hidden'
              {...register(`prefixes.${index}.documentType`)}
            />

            <input type='hidden' {...register(`prefixes.${index}.id`)} />
          </div>
        ))}

        <Button
          type='submit'
          disabled={!hasChanges || isSubmitting}
          className='bg-zinc-500 mt-2 md:col-span-2 w-72 self-center'
        >
          {t('common.save')}
        </Button>
      </form>
    </CardWrapper>
  );
}
