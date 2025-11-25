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
import { AuthService } from '@/lib/services/AuthService';
import { useAuthStore } from '@/lib/stores/authStore';
import { Routes } from '@/lib/utils/enums';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';
import { useTranslations } from 'next-intl';

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { pushLocalized } = useLocalizedRouter();
  const t = useTranslations();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { email: useAuthStore.getState().email ?? '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    const response = await AuthService.login({
      email: data.email,
      password: data.password,
    });

    if (response.data?.shortLifeToken && response.data?.expiresAt) {
      const expiresAt = new Date(response.data.expiresAt);

      useAuthStore.getState().setAuthData({
        shortLifeToken: response.data.shortLifeToken,
        shortLifeTokenExpiry: expiresAt,
      });
    }

    toast(t(`messagekey.${response.messageKey}`));
    if (response.success) {
      pushLocalized(Routes.Two_Fa_Login);
    } else if (
      !response.success &&
      response.messageKey === 'auth.two-fa-not-enabled'
    ) {
      pushLocalized(Routes.Two_Fa_Setup);
    }
  };

  useEffect(() => {
    if (!useAuthStore.getState().email) {
      pushLocalized(Routes.Login_Start);
    }
  }, [pushLocalized]);

  return (
    <Card className='w-full max-w-sm bg-zinc-900 border-zinc-700 shadow-xl'>
      <CardHeader>
        <CardTitle className='text-xl font-semibold text-zinc-100'>
          {t('pages.login.title')}
        </CardTitle>
        <CardDescription className='text-zinc-400'>
          {t('pages.login.subtitle')}
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
              disabled
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
                {...register('password', {
                  required: t('common.password.required'),
                  minLength: {
                    value: 8,
                    message: t('common.password.rules.min-8-chars'),
                  },
                })}
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
            {errors.password && (
              <p className='text-sm text-red-400'>{errors.password.message}</p>
            )}
          </div>

          <div className='flex flex-col sm:flex-row w-full gap-3'>
            <Button
              type='button'
              disabled={isSubmitting}
              className='flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors'
              onClick={() => pushLocalized(Routes.Login_Start)}
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
      </CardContent>

      <CardFooter>
        <p className='text-sm text-zinc-500 text-center w-full'>
          {t('pages.login.footer')}
        </p>
      </CardFooter>
    </Card>
  );
}
