'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Routes } from '@/lib/utils/enums';
import { useAuthStore } from '@/lib/stores/authStore';
import { ShortLifeTokenCountdown } from '@/components/auth/ShortLifeTokenCountdown';

type EmailForm = {
  email: string;
};

type TotpForm = {
  code: string;
};

type LoginData = {
  email: string;
  shortLifeToken: string;
};

export default function TwoFaSetupPage() {
  const router = useRouter();
  const authService = AuthService.instance();

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loginData, setLoginData] = useState<LoginData | null>(null);

  useEffect(() => {
    const storeState = useAuthStore.getState();

    if (!storeState.email || !storeState.shortLifeToken) {
      toast('Invalid credentials, log in first!');
      router.push(Routes.Login_Start);
    } else {
      setLoginData({
        email: storeState.email,
        shortLifeToken: storeState.shortLifeToken,
      });
    }
  }, []);

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
    if (data.email && loginData?.email && data.email === loginData.email) {
      const response = await authService.twoFaSetup({ email: data.email });
      if (response.success && response.data) {
        setQrCode(response.data);
        toast('QR code generated! Scan it with your authenticator.');
      } else {
        toast('Failed to generate QR code.');
      }
    }
  };

  const onVerifyTotp = async (data: TotpForm) => {
    if (loginData?.email) {
      const response = await authService.twoFaVerify({
        email: loginData.email,
        code: data.code,
        shortLifeToken: loginData.shortLifeToken,
      });
      if (response.success) {
        toast('2FA setup successful!');
        router.push(Routes.Login);
      } else {
        toast('Invalid 2FA code, try again.');
      }
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-zinc-100'>
      <Card className='w-full max-w-md bg-zinc-900 border-zinc-700 shadow-xl'>
        <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
          <div>
            <CardTitle className='text-xl font-semibold text-zinc-100'>
              Setup Two-Factor Authentication
            </CardTitle>
            <CardDescription className='text-zinc-400'>
              Enter your email to generate a QR code for TOTP (Authenticator
              app).
            </CardDescription>
          </div>

          <ShortLifeTokenCountdown
            onExpire={() => router.push(Routes.Login_Start)}
          />
        </CardHeader>
        <CardContent>
          {!qrCode ? (
            <form
              onSubmit={handleEmailSubmit(onRequestQr)}
              className='space-y-4'
            >
              <div className='flex flex-col gap-2'>
                <Label htmlFor='email' className='text-zinc-300'>
                  Email
                </Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='m@example.com'
                  className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
                  {...registerEmail('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email address',
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
                {emailSubmitting ? 'Requesting...' : 'Request QR Code'}
              </Button>
            </form>
          ) : (
            <div className='space-y-4 text-center'>
              <p className='text-zinc-300'>
                Scan this QR code in your Authenticator app:
              </p>
              <img
                src={qrCode}
                alt='2FA QR Code'
                className='mx-auto w-64 h-64 bg-white rounded-lg p-2'
              />
              <form
                onSubmit={handleTotpSubmit(onVerifyTotp)}
                className='space-y-2'
              >
                <Label htmlFor='code' className='text-zinc-300'>
                  Enter 6-digit code
                </Label>
                <Input
                  id='code'
                  type='text'
                  placeholder='123456'
                  className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
                  maxLength={6}
                  {...registerTotp('code', {
                    required: 'Code is required',
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'Invalid code format',
                    },
                  })}
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
                  {totpSubmitting ? 'Verifying...' : 'Verify Code'}
                </Button>
              </form>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <p className='text-sm text-zinc-500 text-center w-full'>
            Keep your authenticator safe. You can always reset 2FA later if
            needed.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
