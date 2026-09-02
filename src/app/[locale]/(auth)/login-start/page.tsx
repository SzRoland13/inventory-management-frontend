'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';
import { useCheckFirstLoginMutation } from '@/lib/queries/authQueries';
import { getApiErrorMessageKey } from '@/lib/queries/apiResponse';
import { useAuthStore } from '@/lib/stores/authStore';
import { Routes } from '@/lib/enums/routes';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type LoginStartFormData = {
  email: string;
};

export default function LoginStartPage() {
  const t = useTranslations();
  const { pushLocalized } = useLocalizedRouter();
  const checkFirstLogin = useCheckFirstLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginStartFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const onSubmit = async (data: LoginStartFormData) => {
    try {
      const response = await checkFirstLogin.mutateAsync({
        email: data.email,
      });
      useAuthStore.getState().setAuthData({ email: data.email });

      if (response.payload.firstLogin) {
        toast(t(`messagekey.${response.messageKey}`));
        pushLocalized(Routes.First_Login);
      } else {
        pushLocalized(Routes.Login);
      }
    } catch (error) {
      toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));
    }
  };
  return (
    <Card className='w-full max-w-sm bg-zinc-900 border-zinc-700 shadow-xl'>
      <CardHeader>
        <CardTitle className='text-xl font-semibold text-zinc-100'>
          {t('pages.login.title')}
        </CardTitle>
        <CardDescription className='text-zinc-400'>
          {t('pages.login-start.subtitle')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='email' className='text-zinc-300'>
              {t('common.email.title')}
            </Label>
            <Input
              id='email'
              type='email'
              placeholder='m@example.com'
              className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
              {...register('email', {
                required: t('common.email.required'),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('common.email.invalid'),
                },
              })}
            />
            {errors.email && (
              <p className='text-sm text-red-400'>{errors.email.message}</p>
            )}
          </div>

          <Button
            type='submit'
            disabled={isSubmitting}
            className='w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors'
          >
            {isSubmitting ? t('common.submitting') : t('common.continue')}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className='text-sm text-zinc-500 text-center w-full'>
          {t('pages.login.footer')}
        </p>
      </CardFooter>
    </Card>
  );
}
