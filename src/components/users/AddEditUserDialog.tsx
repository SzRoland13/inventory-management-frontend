'use client';

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ModificationUser } from '@/lib/utils/types';
import { ThemedDialogContent } from '@/components/common/ThemedDialogWrapper';
import { useTranslations } from 'next-intl';
import { UserRole } from '@/lib/utils/enums/user';

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
    control,
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

          <Controller
            name='role'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger className='border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm text-zinc-100 shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 placeholder:text-zinc-500'>
                  <SelectValue
                    placeholder={t('common.role.title')}
                    className='text-zinc-500'
                  />
                </SelectTrigger>
                <SelectContent className='bg-zinc-600 border-zinc-700 text-zinc-100'>
                  {Object.values(UserRole).map((role) => (
                    <SelectItem
                      key={role}
                      value={role}
                      className='text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100'
                    >
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
