/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/features/shared/components/ui/button';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthFormField } from '@/features/auth/components/AuthFormField';
import {
  useTwoFaLoginMutation,
  useTwoFaSetupMutation,
} from '@/features/auth/queries/authQueries';
import { getApiErrorMessageKey } from '@/features/shared/api/apiResponse';
import { queryKeys } from '@/features/shared/api/queryKeys';
import { Routes } from '@/features/shared/types/routes';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useAvatarStore } from '@/features/shared/media/avatarStore';
import { ShortLifeTokenCountdown } from '@/features/auth/components/ShortLifeTokenCountdown';
import { castToEnum } from '@/features/shared/helpers/enum';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { UserRole, UserStatus } from '@/features/users/types/user';
import { UserDto } from '@/features/users/types/userDtos';

type EmailForm = {
  email: string;
};

type TotpForm = {
  code: string;
};

export default function TwoFaSetupPage() {
  const t = useTranslations();
  const router = useRouter();
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  const twoFaSetup = useTwoFaSetupMutation();
  const twoFaLogin = useTwoFaLoginMutation();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const storeState = useAuthStore.getState();

    if (
      !storeState.email ||
      !storeState.shortLifeToken ||
      !storeState.shortLifeTokenExpiry
    ) {
      toast(t('messagekey.auth.invalid-or-expired-session'));
      router.push(Routes.Login_Start);
    }
  }, [router, t]);

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
      try {
        const response = await twoFaSetup.mutateAsync({ email: data.email });
        toast(t(`messagekey.${response.messageKey}`));
        setQrCode(response.payload);
      } catch (error) {
        toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));
      }
    } else {
      toast(t('messagekey.auth.invalid-or-expired-session'));
    }
  };

  const onVerifyTotp = async (data: TotpForm) => {
    const loginEmail = useAuthStore.getState().email;
    const shortLifeToken = useAuthStore.getState().shortLifeToken;

    if (loginEmail && shortLifeToken) {
      try {
        const response = await twoFaLogin.mutateAsync({
          email: loginEmail,
          code: data.code,
          shortLifeToken,
        });
        const { user, firstTime2FAEnabled } = response.payload;
        toast(t(`messagekey.${response.messageKey}`));

        if (firstTime2FAEnabled) {
          queryClient.setQueryData(queryKeys.auth.session, {
            success: true,
            messageKey: response.messageKey,
            payload: {
              id: user.id,
              username: user.username,
              email: user.email,
              // Least-privilege fallback: never silently grant elevated
              // access if the role string somehow doesn't match the enum.
              role: castToEnum(UserRole, user.role) ?? UserRole.SALES,
              twoFaEnabled: true,
              otcSetupCompleted: true,
              userStatus: UserStatus.ACTIVE,
            } satisfies UserDto,
          });

          useAvatarStore.getState().setAvatar({
            avatarId: user.avatarId,
            avatarUrl: user.avatarUrl,
            avatarUrlExpiry: user.avatarUrlExpiry,
          });

          useAuthStore.getState().clearAuthData();
          router.push(Routes.Dashboard);
        }
      } catch (error) {
        toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));
      }
    }
  };

  return (
    <AuthCard
      title={t('pages.2fa.setup.title')}
      description={t('pages.2fa.setup.subtitle')}
      size='md'
      headerAccessory={
        <ShortLifeTokenCountdown
          onExpire={() => router.push(Routes.Login_Start)}
        />
      }
      footer={
        <p className='text-sm text-zinc-500 text-center w-full'>
          {t('pages.2fa.setup.footer')}
        </p>
      }
    >
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
            <AuthFormField
              id='email'
              label={t('common.email.title')}
              type='email'
              placeholder='m@example.com'
              disabled
              error={emailErrors.email?.message}
              {...registerEmail('email', {
                required: t('common.email.required'),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('common.email.invalid'),
                },
              })}
            />
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
              <AuthFormField
                id='code'
                label={t('pages.2fa.qr.label')}
                type='text'
                placeholder='123456'
                maxLength={6}
                error={totpErrors.code?.message}
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
    </AuthCard>
  );
}
