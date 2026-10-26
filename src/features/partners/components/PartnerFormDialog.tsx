'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ContactRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogSection,
  appDialogCancelButtonClass,
  appDialogPrimaryButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { Button } from '@/features/shared/components/ui/button';
import { Dialog } from '@/features/shared/components/ui/dialog';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/features/shared/components/ui/select';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import { partnerFormSchema, partnerFormToRequest, partnerValuesFromResponse, type PartnerFormValues } from '@/features/partners/schemas/partnerSchemas';
import { PartnerType, type PartnerRequest, type PartnerResponse } from '@/features/partners/types/partner';

interface PartnerFormDialogProps {
  open: boolean;
  partner?: PartnerResponse;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (request: PartnerRequest) => Promise<void>;
}

export function PartnerFormDialog({ open, partner, saving, onOpenChange, onSave }: PartnerFormDialogProps) {
  const t = useTranslations();
  const { register, control, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: partnerValuesFromResponse(),
  });
  const wasOpen = useRef(false);
  const lastPartnerId = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      wasOpen.current = false;
      return;
    }
    const partnerId = partner?.id ?? null;
    if (!wasOpen.current || partnerId !== lastPartnerId.current) {
      reset(partnerValuesFromResponse(partner));
      lastPartnerId.current = partnerId;
    }
    wasOpen.current = true;
  }, [open, partner, reset]);

  const field = (name: 'name' | 'taxNumber', maxLength: number) => (
    <div className='space-y-1'>
      <Label htmlFor={`partner-${name}`}>{t(`pages.partners.fields.${name}`)}</Label>
      <Input id={`partner-${name}`} maxLength={maxLength} aria-invalid={!!errors[name]} {...register(name)} />
      {errors[name]?.message && <p className='text-sm text-red-400' role='alert'>{t(errors[name].message)}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ThemedDialogContent>
        <AppDialogHeader
          title={t(partner ? 'pages.partners.actions.edit' : 'pages.partners.actions.add')}
          description={t('pages.partners.form-description')}
          icon={ContactRound}
        />
        <form className='flex min-h-0 flex-1 flex-col' onSubmit={handleSubmit((values) => onSave(partnerFormToRequest(values)))}>
          <AppDialogBody>
            <AppDialogSection title={t('pages.partners.form-details')} icon={ContactRound}>
              <div className='space-y-4'>
                {field('name', 255)}
                <div className='space-y-1'>
                  <Label>{t('pages.partners.fields.type')}</Label>
                  <Controller name='type' control={control} render={({ field: typeField }) => (
                    <Select value={typeField.value} onValueChange={typeField.onChange}>
                      <SelectTrigger className='w-full border-zinc-700 bg-zinc-900 text-zinc-100'><SelectValue /></SelectTrigger>
                      <SelectContent position='popper' side='bottom' align='start' avoidCollisions={false} className='border-zinc-700 bg-zinc-800 text-zinc-100'>
                        {Object.values(PartnerType).map((type) => <SelectItem key={type} value={type}>{t(`pages.partners.types.${type}`)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                {field('taxNumber', 50)}
              </div>
            </AppDialogSection>
          </AppDialogBody>
          <AppDialogFooter>
            <Button type='button' variant='outline' className={appDialogCancelButtonClass} disabled={saving || isSubmitting} onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type='submit' className={appDialogPrimaryButtonClass} disabled={saving || isSubmitting}>{saving || isSubmitting ? t('common.saving') : t('common.save')}</Button>
          </AppDialogFooter>
        </form>
      </ThemedDialogContent>
    </Dialog>
  );
}
