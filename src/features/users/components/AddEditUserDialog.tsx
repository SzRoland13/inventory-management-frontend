'use client';

import { Dialog } from '@/features/shared/components/ui/dialog';
import { UserRound } from 'lucide-react';
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogSection,
  appDialogCancelButtonClass,
  appDialogPrimaryButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import { Button } from '@/features/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  addEditUserSchema,
  type AddEditUserFormValues,
} from '@/features/users/schemas/userSchemas';
import { ModificationUser } from '@/features/users/types/userDtos';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import { ValidationMessage } from '@/features/shared/components/ValidationMessage';
import { useTranslations } from 'next-intl';
import { UserRole } from '@/features/users/types/user';

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user?: ModificationUser;
  saving: boolean;
  onSave: (updated: ModificationUser) => Promise<void>;
}

export function AddEditUserDialog({
  open,
  onClose,
  user,
  saving,
  onSave,
}: EditUserDialogProps) {
  const t = useTranslations();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting, errors },
  } = useForm<AddEditUserFormValues>({
    resolver: zodResolver(addEditUserSchema),
    defaultValues: user ?? {
      id: undefined,
      username: '',
      email: '',
      role: undefined,
    },
  });

  const wasOpen = useRef(false);
  const lastUserId = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      wasOpen.current = false;
      return;
    }
    const userId = user?.id ?? null;
    if (!wasOpen.current || userId !== lastUserId.current) {
      reset(
        user ?? {
          id: undefined,
          username: '',
          email: '',
          role: undefined,
        },
      );
      lastUserId.current = userId;
    }
    wasOpen.current = true;
  }, [open, user, reset]);

  const onSubmit = (data: ModificationUser) => onSave(data);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !saving) onClose();
      }}
    >
      <ThemedDialogContent className='!w-[96vw] !max-w-2xl'>
        <AppDialogHeader
          title={t(
            user ? 'pages.users.dialog.edit' : 'pages.users.dialog.create',
          )}
          description={t(
            user
              ? 'pages.users.dialog.edit-description'
              : 'pages.users.dialog.create-description',
          )}
          icon={UserRound}
          hideDescription
        />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className='flex min-h-0 flex-1 flex-col'
        >
          <AppDialogBody>
            <AppDialogSection
              title={t('pages.users.dialog.details')}
              icon={UserRound}
            >
              {user?.id && <Input {...register('id')} type='hidden' />}
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-1'>
                  <Label htmlFor='user-username'>
                    {t('common.username.title')}
                  </Label>
                  <Input
                    id='user-username'
                    {...register('username')}
                    className='border-zinc-700 bg-zinc-900 text-zinc-100'
                    aria-invalid={!!errors.username}
                  />
                  <ValidationMessage messageKey={errors.username?.message} />
                </div>
                <div className='space-y-1'>
                  <Label htmlFor='user-email'>{t('common.email.title')}</Label>
                  <Input
                    id='user-email'
                    {...register('email')}
                    type='email'
                    className='border-zinc-700 bg-zinc-900 text-zinc-100'
                    aria-invalid={!!errors.email}
                  />
                  <ValidationMessage messageKey={errors.email?.message} />
                </div>
              </div>
              <div className='mt-4 space-y-1'>
                <Label>{t('common.role.title')}</Label>
                <Controller
                  name='role'
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <SelectTrigger
                        className='w-full border-zinc-700 bg-zinc-900 text-zinc-100'
                        aria-label={t('common.role.title')}
                      >
                        <SelectValue placeholder={t('common.role.title')} />
                      </SelectTrigger>
                      <SelectContent
                        position='popper'
                        side='bottom'
                        align='start'
                        avoidCollisions={false}
                        className='border-zinc-700 bg-zinc-800 text-zinc-100'
                      >
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
                <ValidationMessage messageKey={errors.role?.message} />
              </div>
            </AppDialogSection>
          </AppDialogBody>
          <AppDialogFooter>
            <Button
              type='button'
              variant='outline'
              className={appDialogCancelButtonClass}
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type='submit'
              className={appDialogPrimaryButtonClass}
              disabled={saving || isSubmitting}
            >
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </AppDialogFooter>
        </form>
      </ThemedDialogContent>
    </Dialog>
  );
}
