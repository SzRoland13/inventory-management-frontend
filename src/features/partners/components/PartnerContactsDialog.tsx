'use client';

import { useState } from 'react';
import { ContactRound, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { toastApiError } from '@/features/shared/api/apiResponse';
import {
  AppDialogBody,
  AppDialogCard,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogSection,
  appDialogCancelButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { Badge } from '@/features/shared/components/ui/badge';
import { Button } from '@/features/shared/components/ui/button';
import { Dialog } from '@/features/shared/components/ui/dialog';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import { ContactFormDialog } from '@/features/partners/components/ContactFormDialog';
import { useRemoveContactMutation, useSaveContactMutation } from '@/features/partners/queries/partnerQueries';
import type { ContactResponse, PartnerResponse } from '@/features/partners/types/partner';

interface PartnerContactsDialogProps {
  open: boolean;
  partner?: PartnerResponse;
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerContactsDialog({ open, partner, canManage, onOpenChange }: PartnerContactsDialogProps) {
  const t = useTranslations();
  const saveContact = useSaveContactMutation();
  const removeContact = useRemoveContactMutation();
  const [contactEditor, setContactEditor] = useState<ContactResponse | null | undefined>(undefined);
  const [contactToRemove, setContactToRemove] = useState<ContactResponse | null>(null);
  const canEdit = canManage && !!partner && !partner.archived;

  async function saveContactDetails(request: Parameters<typeof saveContact.mutateAsync>[0]['request']) {
    if (!partner) return;
    try {
      await saveContact.mutateAsync({ partnerId: partner.id, contactId: contactEditor?.id, request });
      toast.success(t(contactEditor ? 'pages.partners.messages.contact-updated' : 'pages.partners.messages.contact-created'));
      setContactEditor(undefined);
    } catch (error) {
      toastApiError(t, error);
    }
  }

  async function confirmRemoveContact() {
    if (!partner || !contactToRemove) return;
    try {
      await removeContact.mutateAsync({ partnerId: partner.id, contactId: contactToRemove.id });
      toast.success(t('pages.partners.messages.contact-removed'));
      setContactToRemove(null);
    } catch (error) {
      toastApiError(t, error);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <ThemedDialogContent className='!max-w-3xl'>
          <AppDialogHeader
            title={t('pages.partners.contacts.title', { name: partner?.name ?? '' })}
            description={t('pages.partners.contacts.description')}
            icon={ContactRound}
          />
          {partner && <AppDialogBody>
            <AppDialogSection title={t('pages.partners.fields.contacts')} icon={MapPin}>
              {canEdit && <div className='mb-4 flex justify-end'>
                <Button type='button' size='sm' disabled={saveContact.isPending || removeContact.isPending} onClick={() => setContactEditor(null)}><Plus />{t('pages.partners.contacts.add')}</Button>
              </div>}
              {partner.contacts.length === 0 ? <p className='text-sm text-zinc-400'>{t('pages.partners.contacts.empty')}</p> : <div className='space-y-3'>
                {partner.contacts.map((contact) => <AppDialogCard key={contact.id}>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='space-y-1'>
                      <div className='flex flex-wrap items-center gap-2 font-medium text-zinc-100'>
                        {t(`pages.partners.contactTypes.${contact.type}`)}
                        {contact.removed && <Badge variant='secondary'>{t('pages.partners.contacts.removed')}</Badge>}
                      </div>
                      <p>{contact.addressLine1}{contact.addressLine2 ? `, ${contact.addressLine2}` : ''}</p>
                      <p>{contact.city}, {contact.country}</p>
                      <p>{[contact.phone, contact.email].filter(Boolean).join(' · ') || t('common.none')}</p>
                    </div>
                    {canEdit && !contact.removed && <div className='flex gap-1'>
                      <Button type='button' variant='ghost' size='icon-sm' aria-label={t('pages.partners.contacts.edit')} onClick={() => setContactEditor(contact)}><Pencil /></Button>
                      <Button type='button' variant='ghost' size='icon-sm' aria-label={t('pages.partners.contacts.remove')} onClick={() => setContactToRemove(contact)}><Trash2 /></Button>
                    </div>}
                  </div>
                </AppDialogCard>)}
              </div>}
              {partner.archived && <p className='mt-4 text-sm text-zinc-400'>{t('pages.partners.contacts.archived-read-only')}</p>}
            </AppDialogSection>
          </AppDialogBody>}
          <AppDialogFooter>
            <Button variant='outline' className={appDialogCancelButtonClass} onClick={() => onOpenChange(false)}>{t('common.done')}</Button>
          </AppDialogFooter>
        </ThemedDialogContent>
      </Dialog>

      <ContactFormDialog
        open={contactEditor !== undefined}
        contact={contactEditor || undefined}
        saving={saveContact.isPending}
        onOpenChange={(isOpen) => { if (!isOpen) setContactEditor(undefined); }}
        onSave={saveContactDetails}
      />

      <Dialog open={contactToRemove !== null} onOpenChange={(isOpen) => { if (!isOpen) setContactToRemove(null); }}>
        <ThemedDialogContent>
          <AppDialogHeader title={t('pages.partners.confirm.remove-contact-title')} description={t('pages.partners.confirm.remove-contact-description')} icon={Trash2} hideDescription />
          <AppDialogBody><AppDialogCard>{t('pages.partners.confirm.remove-contact-description')}</AppDialogCard></AppDialogBody>
          <AppDialogFooter>
            <Button variant='outline' className={appDialogCancelButtonClass} disabled={removeContact.isPending} onClick={() => setContactToRemove(null)}>{t('common.cancel')}</Button>
            <Button variant='destructive' disabled={removeContact.isPending} onClick={() => void confirmRemoveContact()}>{removeContact.isPending ? t('common.saving') : t('pages.partners.contacts.remove')}</Button>
          </AppDialogFooter>
        </ThemedDialogContent>
      </Dialog>
    </>
  );
}
