'use client';

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ModificationUser } from '@/lib/utils/types';
import { ThemedDialogContent } from '@/components/common/ThemedDialogWrapper';
import { useTranslations } from 'next-intl';

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user?: ModificationUser;
  onSave: (updated: ModificationUser) => void;
}

export function AddEditUserDialog({
  open,
  onClose,
  user,
  onSave,
}: EditUserDialogProps) {
  const t = useTranslations();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ModificationUser>({
    defaultValues: user ?? {
      id: undefined,
      username: '',
      email: '',
      role: undefined,
    },
  });

  // Whenever dialog opens or closes, sync/reset form values
  useEffect(() => {
    if (open) {
      reset(
        user ?? {
          id: undefined,
          username: '',
          email: '',
          role: undefined,
        },
      );
    }
  }, [open, user, reset]);

  const onSubmit = (data: ModificationUser) => {
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <ThemedDialogContent>
        <DialogHeader>
          <DialogTitle>
            {user
              ? t('pages.users.dialog.edit')
              : t('pages.users.dialog.create')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='grid gap-3 py-3'>
          {user?.id && <Input {...register('id')} type='hidden' />}

          <Input
            {...register('username', { required: true })}
            placeholder={t('common.username.title')}
          />
          <Input
            {...register('email', { required: true })}
            placeholder={t('common.email.title')}
            type='email'
          />
          <Input
            {...register('role', { required: true })}
            placeholder={t('common.role.title')}
          />

          <DialogFooter className='mt-4'>
            <Button
              type='button'
              variant='secondary'
              onClick={() => {
                reset();
                onClose();
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </ThemedDialogContent>
    </Dialog>
  );
}
