'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/features/shared/components/ui/button';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthFormField } from '@/features/auth/components/AuthFormField';
import {
  twoFactorLoginSchema,
  type TwoFactorLoginFormValues,
} from '@/features/auth/schemas/authSchemas';
import { Routes } from '@/features/shared/types/routes';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useAvatarStore } from '@/features/shared/media/avatarStore';
import { ShortLifeTokenCountdown } from '@/features/auth/components/ShortLifeTokenCountdown';
import { castToEnum } from '@/features/shared/helpers/enum';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { UserRole, UserStatus } from '@/features/users/types/user';
import { UserDto } from '@/features/users/types/userDtos';
import { useCompanyStore } from '@/features/settings/stores/companyStore';
import { useTwoFaLoginMutation } from '@/features/auth/queries/authQueries';
import { useMinimalCompanyQuery } from '@/features/settings/queries/companyQueries';
import { getApiErrorMessageKey } from '@/features/shared/api/apiResponse';
import { queryKeys } from '@/features/shared/api/queryKeys';

export default function TwoFaLoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const initialCheck = useRef(false);
  const twoFaLogin = useTwoFaLoginMutation();
  const minimalCompany = useMinimalCompanyQuery(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (initialCheck.current) return;

    initialCheck.current = true;

    const storeState = useAuthStore.getState();

    if (
      !storeState.email ||
      !storeState.shortLifeToken ||
      !storeState.shortLifeTokenExpiry
    ) {
      toast(t('messagekey.auth.invalid-or-expired-session'));
      router.push(Routes.Login_Start);
    } else {
      setTimeout(() => codeInputRef.current?.focus(), 250);
    }
  }, [router, t]);

  const {
    register: registerTotp,
    handleSubmit: handleEmailSubmit,
    formState: { errors: totpErrors, isSubmitting: totpSubmitting },
  } = useForm<TwoFactorLoginFormValues>({
    resolver: zodResolver(twoFactorLoginSchema),
    defaultValues: { email: useAuthStore.getState().email ?? '' },
  });

  const onVerifyTotp = async (data: TwoFactorLoginFormValues) => {
    const shortLifeToken = useAuthStore.getState().shortLifeToken;

    if (data.email && data.code && shortLifeToken) {
      try {
        const response = await twoFaLogin.mutateAsync({
          email: data.email,
          code: data.code,
          shortLifeToken,
        });

        if (!response.payload) {
          toast.error(t(`messagekey.${response.messageKey}`));
          return;
        }

        const { user } = response.payload;
        toast(t(`messagekey.${response.messageKey}`));

        // check-session's UserDto never carries avatar fields - this
        // 2FA-login response is the only place avatar data is available.
        // The identity fields below are a best-effort seed: the very next
        // protected-layout render (triggered by pushLocalized(Dashboard))
        // re-runs proxy.ts's own check-session call and overwrites this
        // entry with the real values within the same navigation.
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

        const companyResult = await minimalCompany.refetch();
        const company = companyResult.data?.payload;

        if (company) {
          useCompanyStore.getState().setCompanyData({
            id: company.id,
            logoId: company.logoId,
            logoUrl: company.logoUrl,
            logoUrlExpiry: company.logoUrlExpiry,
            name: company.name,
          });
        }

        router.push(Routes.Dashboard);
      } catch (error) {
        toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));
      }
    }
  };

  return (
    <AuthCard
      title={t('pages.2fa.login.title')}
      description={t('pages.2fa.login.subtitle')}
      size='md'
      headerAccessory={<ShortLifeTokenCountdown />}
      footer={
        <p className='text-sm text-zinc-500 text-start w-full'>
          {t('pages.2fa.login.footer')}
        </p>
      }
    >
      <form onSubmit={handleEmailSubmit(onVerifyTotp)} className='space-y-4'>
        <AuthFormField
          id='email'
          label={t('common.email.title')}
          type='email'
          placeholder='m@example.com'
          disabled
          error={totpErrors.email?.message}
          {...registerTotp('email')}
        />
        <AuthFormField
          id='code'
          label={t('pages.2fa.qr.title')}
          type='text'
          placeholder='123456'
          maxLength={6}
          disabled={totpSubmitting}
          error={totpErrors.code?.message}
          {...registerTotp('code')}
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
    </AuthCard>
  );
}
