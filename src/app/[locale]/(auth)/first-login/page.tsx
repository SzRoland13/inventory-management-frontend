'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';
import { AuthService } from '@/lib/services/AuthService';
import { useAuthStore } from '@/lib/stores/authStore';
import { Routes } from '@/lib/utils/enums';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type EmailForm = {
  email: string;
};

type OneTimeCodeForm = {
  email: string;
  oneTimeCode: string;
};

enum Step {
  STEP1 = 'STEP1',
  STEP2 = 'STEP2',
}

export default function FirstLoginPage() {
  const t = useTranslations();
  const { pushLocalized } = useLocalizedRouter();
  const [step, setStep] = useState<Step>(Step.STEP1);
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!useAuthStore.getState().email) {
      pushLocalized(Routes.Login_Start);
    }
  }, [pushLocalized]);

  useEffect(() => {
    if (step === Step.STEP2) {
      setTimeout(() => codeInputRef.current?.focus(), 250);
    }
  }, [step]);

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors, isSubmitting: emailSubmitting },
  } = useForm<EmailForm>({
    defaultValues: { email: useAuthStore.getState().email ?? '' },
  });

  const {
    reset: resetTotpForm,
    register: registerTotp,
    handleSubmit: handleTotpSubmit,
    formState: { errors: totpErrors, isSubmitting: totpSubmitting },
  } = useForm<OneTimeCodeForm>({
    defaultValues: {
      email: useAuthStore.getState().email ?? '',
      oneTimeCode: '',
    },
  });

  const onOneTimeCodeRequest = async (data: EmailForm) => {
    if (data.email) {
      const response = await AuthService.requestOneTimeCode({
        email: data.email,
      });

      toast(t(`messagekey.${response.messageKey}`));
      if (response.success) {
        resetTotpForm({ email: data.email, oneTimeCode: '' });
        setStep(Step.STEP2);
      }
    }
  };

  const onVerifyTotp = async (data: OneTimeCodeForm) => {
    const response = await AuthService.validateOneTimeCode({
      email: data.email,
      oneTimeCode: data.oneTimeCode,
    });

    toast(t(`messagekey.${response.messageKey}`));
    if (response.success) {
      pushLocalized(Routes.Setup_Password);
    } else {
      setStep(Step.STEP1);
    }
  };

  return (
    <Card className='w-full max-w-sm bg-zinc-900 border-zinc-700 shadow-xl'>
      <CardHeader>
        <CardTitle className='text-xl font-semibold text-zinc-100'>
          {t('pages.first-login.title')}
        </CardTitle>
        <CardDescription className='text-zinc-400'>
          {step === Step.STEP1
            ? t('pages.first-login.step-one.subtitle')
            : t('pages.first-login.step-two.subtitle')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode='wait'>
          {step === Step.STEP1 ? (
            <motion.form
              key='step1'
              onSubmit={handleEmailSubmit(onOneTimeCodeRequest)}
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
            <motion.form
              key='step2'
              onSubmit={handleTotpSubmit(onVerifyTotp)}
              className='flex flex-col gap-2'
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
              <div className='flex flex-col gap-2'>
                <Label htmlFor='code' className='text-zinc-300'>
                  {t('pages.first-login.otc.title')}
                </Label>
                <Input
                  id='code'
                  type='text'
                  placeholder='123456'
                  className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
                  {...registerTotp('oneTimeCode', {
                    required: t('pages.setup-password.otc.required'),
                  })}
                  ref={(e) => {
                    registerTotp('oneTimeCode').ref(e);
                    codeInputRef.current = e;
                  }}
                />
                {totpErrors.oneTimeCode && (
                  <p className='text-sm text-red-400'>
                    {totpErrors.oneTimeCode.message}
                  </p>
                )}
              </div>
              <Button
                type='submit'
                disabled={totpSubmitting}
                className='w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors mt-4'
              >
                {totpSubmitting ? t('common.verifying') : t('common.verify')}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
