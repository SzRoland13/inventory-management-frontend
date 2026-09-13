'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
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
import { Routes } from '@/lib/enums/routes';
import { useAuthStore } from '@/lib/stores/authStore';
import { useAvatarStore } from '@/lib/stores/avatarStore';
import { ShortLifeTokenCountdown } from '@/components/auth/ShortLifeTokenCountdown';
import { castToEnum } from '@/lib/helpers/enum';
import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';
import { useTranslations } from 'next-intl';
import { UserRole, UserStatus } from '@/lib/enums/user';
import { UserDto } from '@/lib/services/dtos/userDtos';
import { useCompanyStore } from '@/lib/stores/companyStore';
import { useTwoFaLoginMutation } from '@/lib/queries/authQueries';
import { useMinimalCompanyQuery } from '@/lib/queries/companyQueries';
import { getApiErrorMessageKey } from '@/lib/queries/apiResponse';
import { queryKeys } from '@/lib/queries/queryKeys';

type TwoFaForm = {
  email: string;
  code: string;
};

export default function TwoFaLoginPage() {
  const t = useTranslations();
  const { pushLocalized } = useLocalizedRouter();
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

        pushLocalized(Routes.Dashboard);
      } catch (error) {
        toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));
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
