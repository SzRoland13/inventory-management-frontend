'use client';

import { Button } from '@/features/shared/components/ui/button';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthFormField } from '@/features/auth/components/AuthFormField';
import { useRouter } from '@/i18n/navigation';
import { useCheckFirstLoginMutation } from '@/features/auth/queries/authQueries';
import { getApiErrorMessageKey } from '@/features/shared/api/apiResponse';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Routes } from '@/features/shared/types/routes';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

type LoginStartFormData = {
  email: string;
};

export default function LoginStartPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkFirstLogin = useCheckFirstLoginMutation();

  useEffect(() => {
    if (searchParams.get('reason') === 'session-expired') {
      toast(t('messagekey.guard.session-expired'));
      router.replace({ pathname: Routes.Login_Start, query: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginStartFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const onSubmit = async (data: LoginStartFormData) => {
    useAuthStore.getState().setAuthData({ email: data.email });

    try {
      const response = await checkFirstLogin.mutateAsync({
        email: data.email,
      });

      if (response.payload.firstLogin) {
        toast(t(`messagekey.${response.messageKey}`));

        router.push(Routes.First_Login);
      } else {
        router.push(Routes.Login);
      }
    } catch (error) {
      toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));
    }
  };
  return (
    <AuthCard
      title={t('pages.login.title')}
      description={t('pages.login-start.subtitle')}
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
          error={errors.email?.message}
          {...register('email', {
            required: t('common.email.required'),
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: t('common.email.invalid'),
            },
          })}
        />

        <Button
          type='submit'
          disabled={isSubmitting}
          className='w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors'
        >
          {isSubmitting ? t('common.submitting') : t('common.continue')}
        </Button>
      </form>
    </AuthCard>
  );
}
