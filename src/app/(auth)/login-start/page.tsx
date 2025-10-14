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

type LoginStartFormData = {
  email: string;
};

export default function LoginStartPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginStartFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });
  const authService = AuthService.instance();
  const router = useRouter();

  const onSubmit = async (data: LoginStartFormData) => {
    const response = await authService.checkIfFirstLogin({ email: data.email });
    useAuthStore.getState().setAuthData({ email: data.email });

    if (response.success && response.data.firstLogin) {
      router.push(Routes.First_Login);
    } else {
      router.push(Routes.Login);
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
