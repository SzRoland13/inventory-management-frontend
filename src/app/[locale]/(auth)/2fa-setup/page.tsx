/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useRef, useState } from 'react';
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
import { Routes, UserRole } from '@/lib/utils/enums';
import { useAuthStore } from '@/lib/stores/authStore';
import { ShortLifeTokenCountdown } from '@/components/auth/ShortLifeTokenCountdown';
import { useUserStore } from '@/lib/stores/userStore';
import { castToEnum } from '@/lib/utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';
import { useTranslations } from 'next-intl';

type EmailForm = {
  email: string;
};

type TotpForm = {
  code: string;
};

export default function TwoFaSetupPage() {
  const t = useTranslations();
  const { pushLocalized } = useLocalizedRouter();
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    const storeState = useAuthStore.getState();

    if (
      !storeState.email ||
      !storeState.shortLifeToken ||
      !storeState.shortLifeTokenExpiry
    ) {
      toast(t('messagekey.auth.invalid-or-expired-session'));
      pushLocalized(Routes.Login_Start);
    }
  }, [pushLocalized, t]);

  useEffect(() => {
    if (qrCode) {
      setTimeout(() => codeInputRef.current?.focus(), 250);
    }
  }, [qrCode]);

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors, isSubmitting: emailSubmitting },
  } = useForm<EmailForm>({
    defaultValues: { email: useAuthStore.getState().email ?? '' },
  });

  const {
    register: registerTotp,
    handleSubmit: handleTotpSubmit,
    formState: { errors: totpErrors, isSubmitting: totpSubmitting },
  } = useForm<TotpForm>();

  const onRequestQr = async (data: EmailForm) => {
    if (data.email) {
      const response = await AuthService.twoFaSetup({ email: data.email });

      toast(t(`messagekey.${response.messageKey}`));
      if (response.success && response.data) {
        setQrCode(response.data);
      }
    } else {
      toast(t('messagekey.auth.invalid-or-expired-session"'));
    }
  };

  const onVerifyTotp = async (data: TotpForm) => {
    const loginEmail = useAuthStore.getState().email;
    const shortLifeToken = useAuthStore.getState().shortLifeToken;

    if (loginEmail && shortLifeToken) {
      const response = await AuthService.twoFaLogin({
        email: loginEmail,
        code: data.code,
        shortLifeToken,
      });

      const { user, tokens, firstTime2FAEnabled } = response.data;

      toast(t(`messagekey.${response.messageKey}`));

      if (response.success && firstTime2FAEnabled) {
        useUserStore.getState().setUser({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          username: user.username,
          email: user.email,
          role: castToEnum(UserRole, user.role),
        });

        useAuthStore.getState().clearAuthData();

        pushLocalized(Routes.Dashboard);
      }
    }
  };

  return (
    <Card className='w-full max-w-md bg-zinc-900 border-zinc-700 shadow-xl'>
      <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
        <div>
          <CardTitle className='text-xl font-semibold text-zinc-100'>
            {t('pages.2fa.setup.title')}
          </CardTitle>
          <CardDescription className='text-zinc-400'>
            {t('pages.2fa.setup.subtitle')}
          </CardDescription>
        </div>

        <ShortLifeTokenCountdown
          onExpire={() => pushLocalized(Routes.Login_Start)}
        />
      </CardHeader>
      <CardContent>
        <AnimatePresence mode='wait'>
          {!qrCode ? (
            <motion.form
              key='step1'
              onSubmit={handleEmailSubmit(onRequestQr)}
              className='space-y-4'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
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
                  {...registerEmail('email', {
                    required: t('common.email.required'),
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: t('common.email.invalid'),
                    },
                  })}
                />
                {emailErrors.email && (
                  <p className='text-sm text-red-400'>
                    {emailErrors.email.message}
                  </p>
                )}
              </div>
              <Button
                type='submit'
                disabled={emailSubmitting}
                className='w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors'
              >
                {emailSubmitting ? t('common.requesting') : t('common.request')}
              </Button>
            </motion.form>
          ) : (
            <motion.div
              className='space-y-4 text-center'
              key='step2'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <p className='text-zinc-300'>{t('pages.2fa.qr.title')}</p>
              <img
                src={qrCode}
                alt='2FA QR Code'
                className='mx-auto w-64 h-64 bg-white rounded-lg p-2'
              />
              <form
                onSubmit={handleTotpSubmit(onVerifyTotp)}
                className='flex flex-col gap-2'
              >
                <Label htmlFor='code' className='text-zinc-300'>
                  {t('pages.2fa.qr.label')}
                </Label>
                <Input
                  id='code'
                  type='text'
                  placeholder='123456'
                  className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
                  maxLength={6}
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
                  <p className='text-sm text-red-400'>
                    {totpErrors.code.message}
                  </p>
                )}
                <Button
                  type='submit'
                  disabled={totpSubmitting}
                  className='w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors'
                >
                  {totpSubmitting ? t('common.verifying') : t('common.verify')}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter>
        <p className='text-sm text-zinc-500 text-center w-full'>
          {t('pages.2fa.setup.footer')}
        </p>
      </CardFooter>
    </Card>
  );
}
