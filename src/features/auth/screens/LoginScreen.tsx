'use client';

import { Button } from '@/features/shared/components/ui/button';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthFormField } from '@/features/auth/components/AuthFormField';
import { ValidationMessage } from '@/features/shared/components/ValidationMessage';
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/schemas/authSchemas';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import { useLoginMutation } from '@/features/auth/queries/authQueries';
import { getApiErrorMessageKey } from '@/features/shared/api/apiResponse';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Routes } from '@/features/shared/types/routes';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const login = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { email: useAuthStore.getState().email ?? '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await login.mutateAsync({
        email: data.email,
        password: data.password,
      });

      if (response.payload?.shortLifeToken && response.payload?.expiresAt) {
        const expiresAt = new Date(response.payload.expiresAt);

        useAuthStore.getState().setAuthData({
          shortLifeToken: response.payload.shortLifeToken,
          shortLifeTokenExpiry: expiresAt,
        });
      }

      toast(t(`messagekey.${response.messageKey}`));

      if (response.payload?.twoFactorEnabled) {
        router.push(Routes.Two_Fa_Login);
      } else {
        router.push(Routes.Two_Fa_Setup);
      }
    } catch (error) {
      toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));
    }
  };

  useEffect(() => {
    if (!useAuthStore.getState().email) {
      router.push(Routes.Login_Start);
    }
  }, [router]);

  return (
    <AuthCard
      title={t('pages.login.title')}
      description={t('pages.login.subtitle')}
      footer={
        <p className='text-sm text-zinc-500 text-center w-full'>
          {t('pages.login.footer')}
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <AuthFormField
          id='email'
          label={t('common.email.title')}
          type='email'
          placeholder='m@example.com'
          disabled
          error={errors.email?.message}
          {...register('email')}
        />

        <div className='flex flex-col gap-2'>
          <Label htmlFor='password' className='text-zinc-300'>
            {t('common.password.title')}
          </Label>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              placeholder='••••••••'
              className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
              {...register('password')}
            />
            <button
              type='button'
              onClick={() => setShowPassword((prev) => !prev)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors'
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <ValidationMessage messageKey={errors.password?.message} />
        </div>

        <div className='flex flex-col sm:flex-row w-full gap-3'>
          <Button
            type='button'
            disabled={isSubmitting}
            className='flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors'
            onClick={() => router.push(Routes.Login_Start)}
          >
            {t('common.back')}
          </Button>
          <Button
            type='submit'
            disabled={isSubmitting}
            className='flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors'
          >
            {isSubmitting ? t('common.submitting') : t('common.continue')}
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
