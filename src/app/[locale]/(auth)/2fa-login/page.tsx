'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import { Routes } from '@/lib/enums/routes';
import { useAuthStore } from '@/lib/stores/authStore';
import { ShortLifeTokenCountdown } from '@/components/auth/ShortLifeTokenCountdown';
import { useUserStore } from '@/lib/stores/userStore';
import { castToEnum } from '@/lib/helpers/enum';
import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';
import { useTranslations } from 'next-intl';
import { UserRole } from '@/lib/enums/user';

type TwoFaForm = {
  email: string;
  code: string;
};

export default function TwoFaLoginPage() {
  const t = useTranslations();
  const { pushLocalized } = useLocalizedRouter();
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const initialCheck = useRef(false);

  useEffect(() => {
    if (!initialCheck.current) return;

    initialCheck.current = true;

    const storeState = useAuthStore.getState();

    if (
      !storeState.email ||
      !storeState.shortLifeToken ||
      !storeState.shortLifeTokenExpiry
    ) {
      toast(t('messagekey.auth.invalid-or-expired-session'));
      console.log('ez fut le?');
      pushLocalized(Routes.Login_Start);
    } else {
      setTimeout(() => codeInputRef.current?.focus(), 250);
    }
  }, [pushLocalized, t]);

  const {
    register: registerTotp,
    handleSubmit: handleEmailSubmit,
    formState: { errors: totpErrors, isSubmitting: totpSubmitting },
  } = useForm<TwoFaForm>({
    defaultValues: { email: useAuthStore.getState().email ?? '' },
  });

  const onVerifyTotp = async (data: TwoFaForm) => {
    const shortLifeToken = useAuthStore.getState().shortLifeToken;

    if (data.email && data.code && shortLifeToken) {
      const response = await AuthService.twoFaLogin({
        email: data.email,
        code: data.code,
        shortLifeToken,
      });

      if (response.success && response.payload) {
        const { user } = response.payload;

        toast(t(`messagekey.${response.messageKey}`));

        if (response.success) {
          useUserStore.getState().setUser({
            id: user.id,
            username: user.username,
            email: user.email,
            role: castToEnum(UserRole, user.role),
            avatarUrl: user.avatarUrl,
            avatarUrlExpiry: user.avatarUrlExpiry,
          });

          useAuthStore.getState().clearAuthData();

          pushLocalized(Routes.Dashboard);
        }
      } else {
        toast.error(t(`${response.messageKey}`));
      }
    }
  };

  return (
    <Card className='w-full max-w-md bg-zinc-900 border-zinc-700 shadow-xl'>
      <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
        <div>
          <CardTitle className='text-xl font-semibold text-zinc-100'>
            {t('pages.2fa.login.title')}
          </CardTitle>
          <CardDescription className='text-zinc-400'>
            {t('pages.2fa.login.subtitle')}
          </CardDescription>
        </div>

        <ShortLifeTokenCountdown />
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailSubmit(onVerifyTotp)} className='space-y-4'>
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
              {...registerTotp('email', {
                required: t('common.email.required'),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('common.email.invalid'),
                },
              })}
            />
            {totpErrors.email && (
              <p className='text-sm text-red-400'>{totpErrors.email.message}</p>
            )}
          </div>
          <Label htmlFor='code' className='text-zinc-300'>
            {t('pages.2fa.qr.title')}
          </Label>
          <Input
            id='code'
            type='text'
            placeholder='123456'
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
            maxLength={6}
            disabled={totpSubmitting}
            {...registerTotp('code', {
              required: t('pages.2fa.code.required'),
              pattern: {
                value: /^\d{6}$/,
                message: t('pages.2fa.code.invalid'),
              },
            })}
            ref={(e) => {
              registerTotp('code').ref(e);
              codeInputRef.current = e;
            }}
          />
          {totpErrors.code && (
            <p className='text-sm text-red-400'>{totpErrors.code.message}</p>
          )}
          <Button
            type='submit'
            disabled={totpSubmitting}
            className='w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors'
          >
            {totpSubmitting ? t('common.verifying') : t('common.verify')}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className='text-sm text-zinc-500 text-start w-full'>
          {t('pages.2fa.login.footer')}
        </p>
      </CardFooter>
    </Card>
  );
}
