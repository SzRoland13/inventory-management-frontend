'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { DocumentPrefixService } from '@/lib/services/DocumentPrefixService';
import {
  DocumentPrefixesUpdateRequest,
  DocumentPrefixDto,
} from '@/lib/services/dtos/documentPrefixDtos';

type FormValues = {
  prefixes: DocumentPrefixDto[];
};

export default function CompanyTabDocumentPrefixCard() {
  const t = useTranslations();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      prefixes: [],
    },
  });

  const prefixes = watch('prefixes');

  useEffect(() => {
    const load = async () => {
      const res = await DocumentPrefixService.getAll();

      if (res.success && res.payload) {
        reset({
          prefixes: res.payload.prefixes,
        });
      }
    };

    load();
  }, [reset]);

  const onSubmit = async (data: DocumentPrefixesUpdateRequest) => {
    const res = await DocumentPrefixService.updateAll(data);

    if (res.success && res.payload) {
      reset(res.payload);
      toast(t(`messageKey.${res.messageKey}`));
    }
  };

  return (
    <Card className='bg-zinc-800 border-zinc-700 shadow-xl'>
      <CardHeader>
        <CardTitle className='text-xl text-zinc-100'>
          {t('pages.settings.tabs.company.prefix.title')}
        </CardTitle>

        <CardDescription className='text-zinc-400'>
          {t('pages.settings.tabs.company.prefix.description')}
        </CardDescription>
      </CardHeader>

      <CardContent>
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
            disabled={!isDirty || isSubmitting}
            className='bg-zinc-500 mt-2 md:col-span-2'
          >
            {t('common.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
