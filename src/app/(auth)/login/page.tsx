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
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type LoginFormData = {
  email: string;
  password: string;
};
export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { email: useAuthStore.getState().email ?? '', password: '' },
  });
  const authService = AuthService.instance();
  const router = useRouter();

  const onSubmit = async (data: LoginFormData) => {
    const response = await authService.login({
      email: data.email,
      password: data.password,
    });

    if (response.data.shortLifeToken && response.data?.expiresAt) {
      const expiresAt = new Date(response.data.expiresAt);

      useAuthStore.getState().setAuthData({
        shortLifeToken: response.data.shortLifeToken,
        shortLifeTokenExpiry: expiresAt,
      });
    }

    if (response.success) {
      router.push(Routes.Two_Fa_Login);
    } else if (
      !response.success &&
      response.messageKey === 'auth.two-fa-not-enabled'
    ) {
      toast('2FA not setted up, please setup 2FA!');
      router.push(Routes.Two_Fa_Setup);
    } else {
      toast('Invalid credentials!');
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-zinc-100'>
      <Card className='w-full max-w-sm bg-zinc-900 border-zinc-700 shadow-xl'>
        <CardHeader>
          <CardTitle className='text-xl font-semibold text-zinc-100'>
            Login to your account
          </CardTitle>
          <CardDescription className='text-zinc-400'>
            Enter your email below to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='email' className='text-zinc-300'>
                Email
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='m@example.com'
                className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className='text-sm text-red-400'>{errors.email.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password' className='text-zinc-300'>
                Password
              </Label>
              <Input
                id='password'
                type='password'
                placeholder='••••••••'
                className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
              />
              {errors.password && (
                <p className='text-sm text-red-400'>
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors'
            >
              {isSubmitting ? 'Submitting...' : 'Continue'}
            </Button>
          </form>
        </CardContent>

        <CardFooter>
          <p className='text-sm text-zinc-500 text-center w-full'>
            Forgot your password? Contact your administrator.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
