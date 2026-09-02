'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useSetupNewPasswordMutation } from '@/lib/queries/authQueries';
import { getApiErrorMessageKey } from '@/lib/queries/apiResponse';
import { useAuthStore } from '@/lib/stores/authStore';
import { Routes } from '@/lib/enums/routes';
import { Label } from '@radix-ui/react-label';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff, Info } from 'lucide-react';
import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';
import { useTranslations } from 'next-intl';

type SetupPasswordFormData = {
  email: string;
  password: string;
  repeatPassword: string;
};

export default function SetupPasswordPage() {
  const t = useTranslations();
  const { pushLocalized } = useLocalizedRouter();
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const setupNewPassword = useSetupNewPasswordMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SetupPasswordFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      email: useAuthStore.getState().email ?? '',
      password: '',
      repeatPassword: '',
    },
  });

  useEffect(() => {
    if (!useAuthStore.getState().email) {
      pushLocalized(Routes.Login_Start);
    }
    passwordRef.current?.focus();
  }, [pushLocalized]);

  const password = watch('password');

  const onSubmit = async (data: SetupPasswordFormData) => {
    try {
      const response = await setupNewPassword.mutateAsync(data);
      toast(t(`messagekey.${response.messageKey}`));
      pushLocalized(Routes.Login);
    } catch (error) {
      toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));
    }
  };

  const passwordValidation = {
    required: 'Password is required',
    validate: (value: string) => {
      if (value.length < 8) return t('common.password.rules.min-8-chars');
      if (!/[A-Z]/.test(value)) return t('common.password.rules.min-1-upper');
      if (!/[a-z]/.test(value)) return t('common.password.rules.min-1-lower');
      if (!/\d/.test(value)) return t('common.password.rules.min-1-number');
      if (!/[^a-zA-Z0-9]/.test(value))
        return t('common.password.rules.min-1-special');
      if (/(.)\1{2,}/.test(value))
        return t('common.password.rules.no-repeating-chars');
      const lower = value.toLowerCase();
      const seq = 'abcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < seq.length - 3; i++) {
        const s = seq.slice(i, i + 4);
        if (lower.includes(s) || lower.includes([...s].reverse().join(''))) {
          return t('common.password.rules.no-sequences');
        }
      }
      return true;
    },
  };

  const { score, label, color } = useMemo(() => {
    const val = password ?? '';
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[a-z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[^a-zA-Z0-9]/.test(val)) score++;

    // Penalize sequences or repeats
    if (/(.)\1{2,}/.test(val)) score -= 1;
    const lower = val.toLowerCase();
    const seq = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < seq.length - 3; i++) {
      const s = seq.slice(i, i + 4);
      if (lower.includes(s) || lower.includes([...s].reverse().join(''))) {
        score -= 1;
        break;
      }
    }

    const clamped = Math.max(0, Math.min(5, score));
    const labels = [
      t('common.password.strength.very-weak'),
      t('common.password.strength.weak'),
      t('common.password.strength.moderate'),
      t('common.password.strength.good'),
      t('common.password.strength.strong'),
      t('common.password.strength.excellent'),
    ];
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-emerald-500',
    ];

    return {
      score: clamped,
      label: labels[clamped],
      color: colors[clamped],
    };
  }, [password, t]);

  return (
    <Card className='w-full max-w-sm bg-zinc-900 border-zinc-700 shadow-xl'>
      <CardHeader>
        <CardTitle className='text-xl font-semibold text-zinc-100'>
          {t('pages.setup-password.title')}
        </CardTitle>
        <CardDescription className='text-zinc-400'>
          {t('pages.setup-password.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-4 animate-fadeIn'
        >
          <div className='flex flex-col gap-2'>
            <Label htmlFor='email' className='text-zinc-300'>
              {t('common.email.title')}
            </Label>
            <Input
              id='email'
              type='email'
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
                {...register('password', passwordValidation)}
                ref={(e) => {
                  register('password').ref(e);
                  passwordRef.current = e;
                }}
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

            <div className='flex justify-start'>
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type='button'
                    className='text-sm text-zinc-400 underline hover:text-zinc-200 transition-colors flex items-center gap-1'
                  >
                    <Info size={18} />
                    {t('common.password.show-rules')}
                  </button>
                </DialogTrigger>
                <DialogContent className='bg-zinc-900 border-zinc-700 text-zinc-100 max-w-md'>
                  <DialogHeader>
                    <DialogTitle>{t('common.password.title')}</DialogTitle>
                  </DialogHeader>
                  <ul className='list-disc list-inside space-y-1 text-zinc-300 text-sm mt-2'>
                    <li>{t('common.password.rules.min-8-chars')}</li>
                    <li>{t('common.password.rules.min-1-upper')}</li>
                    <li>{t('common.password.rules.min-1-lower')}</li>
                    <li>{t('common.password.rules.min-1-number')}</li>
                    <li>{t('common.password.rules.min-1-special')}</li>
                    <li>{t('common.password.rules.no-repeating-chars')}</li>
                    <li>{t('common.password.rules.no-sequences')}</li>
                  </ul>
                </DialogContent>
              </Dialog>
            </div>

            <div className='flex flex-col gap-1 mt-1 transition-all duration-300'>
              <div className='w-full h-2 bg-zinc-700 rounded-full overflow-hidden'>
                <div
                  className={`h-full transition-all duration-300 ${color}`}
                  style={{ width: `${(score / 5) * 100}%` }}
                />
              </div>
              <p className='text-sm text-zinc-300'>{label}</p>
            </div>
            {errors.password && (
              <p className='text-sm text-red-400'>{errors.password.message}</p>
            )}
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='password' className='text-zinc-300'>
              {t('pages.setup-password.repeat-password.title')}
            </Label>
            <div className='relative'>
              <Input
                id='repeat-password'
                type={showRepeatPassword ? 'text' : 'password'}
                placeholder='••••••••'
                className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
                {...register('repeatPassword', {
                  required: t('pages.setup-password.repeat-password.required'),
                  validate: (value) =>
                    value === password ||
                    t('pages.setup-password.repeat-password.no-match'),
                })}
              />
              <button
                type='button'
                onClick={() => setShowRepeatPassword((prev) => !prev)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors'
                tabIndex={-1}
              >
                {showRepeatPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className='text-sm text-red-400'>{errors.password.message}</p>
            )}
          </div>
          <Button
            type='submit'
            disabled={isSubmitting}
            className='mt-4 w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors'
          >
            {isSubmitting ? t('common.submitting') : t('common.continue')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
