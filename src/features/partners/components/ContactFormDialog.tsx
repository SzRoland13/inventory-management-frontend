'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ContactRound, MapPin } from 'lucide-react';
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
import { CountrySelect } from '@/features/shared/components/CountrySelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/features/shared/components/ui/select';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import { contactFormSchema, contactFormToRequest, contactValuesFromResponse, type ContactFormValues } from '@/features/partners/schemas/partnerSchemas';
import { ContactType, type ContactRequest, type ContactResponse } from '@/features/partners/types/partner';

interface ContactFormDialogProps {
  open: boolean;
  contact?: ContactResponse;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (request: ContactRequest) => Promise<void>;
}

export function ContactFormDialog({ open, contact, saving, onOpenChange, onSave }: ContactFormDialogProps) {
  const t = useTranslations();
  const { register, control, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: contactValuesFromResponse(),
  });
  const wasOpen = useRef(false);
  const lastContactId = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      wasOpen.current = false;
      return;
    }
    const contactId = contact?.id ?? null;
    if (!wasOpen.current || contactId !== lastContactId.current) {
      reset(contactValuesFromResponse(contact));
      lastContactId.current = contactId;
    }
    wasOpen.current = true;
  }, [open, contact, reset]);

  const addressFields = [
    ['addressLine1', 255], ['addressLine2', 255], ['city', 100],
  ] as const;
  const communicationFields = [['phone', 50], ['email', 255]] as const;
  type ContactField = keyof ContactFormValues;

  const renderFields = (names: readonly (readonly [ContactField, number])[]) => names.map(([name, maxLength]) => (
    <div className='space-y-1' key={name}>
      <Label htmlFor={`contact-${name}`}>{t(`pages.partners.fields.${name}`)}</Label>
      <Input id={`contact-${name}`} type={name === 'phone' ? 'tel' : name === 'email' ? 'email' : 'text'} maxLength={maxLength} aria-invalid={!!errors[name]} {...register(name)} />
      {errors[name]?.message && <p className='text-sm text-red-400' role='alert'>{t(errors[name].message)}</p>}
    </div>
  ));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ThemedDialogContent className='!max-w-3xl'>
        <AppDialogHeader
          title={t(contact ? 'pages.partners.contacts.edit' : 'pages.partners.contacts.add')}
          description={t('pages.partners.contact-form-description')}
          icon={ContactRound}
        />
        <form className='flex min-h-0 flex-1 flex-col' onSubmit={handleSubmit((values) => onSave(contactFormToRequest(values)))}>
          <AppDialogBody className='space-y-4'>
            <AppDialogSection title={t('pages.partners.fields.contactType')} icon={ContactRound}>
              <Controller name='type' control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className='w-full border-zinc-700 bg-zinc-900 text-zinc-100'><SelectValue /></SelectTrigger>
                  <SelectContent position='popper' side='bottom' align='start' avoidCollisions={false} className='border-zinc-700 bg-zinc-800 text-zinc-100'>
                    {Object.values(ContactType).map((type) => <SelectItem key={type} value={type}>{t(`pages.partners.contactTypes.${type}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </AppDialogSection>
            <AppDialogSection title={t('pages.partners.fields.address')} icon={MapPin}>
              <div className='grid gap-4 sm:grid-cols-2'>
                {renderFields(addressFields)}
                <div className='space-y-1'>
                  <Label htmlFor='contact-country'>{t('pages.partners.fields.country')}</Label>
                  <Controller
                    name='country'
                    control={control}
                    render={({ field }) => (
                      <CountrySelect
                        id='contact-country'
                        value={field.value}
                        onValueChange={field.onChange}
                        invalid={!!errors.country}
                        ariaLabel={t('pages.partners.fields.country')}
                      />
                    )}
                  />
                  {errors.country?.message && <p className='text-sm text-red-400' role='alert'>{t(errors.country.message)}</p>}
                </div>
              </div>
            </AppDialogSection>
            <AppDialogSection title={t('pages.partners.contact-details')} icon={ContactRound}>
              <div className='grid gap-4 sm:grid-cols-2'>{renderFields(communicationFields)}</div>
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
