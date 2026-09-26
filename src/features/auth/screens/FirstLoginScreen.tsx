'use client';

import { Button } from '@/features/shared/components/ui/button';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthFormField } from '@/features/auth/components/AuthFormField';
import { ValidationMessage } from '@/features/shared/components/ValidationMessage';
import {
  firstLoginRequestSchema,
  firstLoginVerifySchema,
  type FirstLoginRequestFormValues,
  type FirstLoginVerifyFormValues,
} from '@/features/auth/schemas/authSchemas';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import { useRouter } from '@/i18n/navigation';
import {
  useRequestOneTimeCodeMutation,
  useValidateOneTimeCodeMutation,
} from '@/features/auth/queries/authQueries';
import { getApiErrorMessageKey } from '@/features/shared/api/apiResponse';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Routes } from '@/features/shared/types/routes';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

enum Step {
  STEP1 = 'STEP1',
  STEP2 = 'STEP2',
}

export default function FirstLoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState<Step>(Step.STEP1);
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const requestOneTimeCode = useRequestOneTimeCodeMutation();
  const validateOneTimeCode = useValidateOneTimeCodeMutation();

  useEffect(() => {
    if (!useAuthStore.getState().email) {
      router.push(Routes.Login_Start);
    }
  }, [router]);

  useEffect(() => {
    if (step === Step.STEP2) {
      setTimeout(() => codeInputRef.current?.focus(), 250);
    }
  }, [step]);

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors, isSubmitting: emailSubmitting },
  } = useForm<FirstLoginRequestFormValues>({
    resolver: zodResolver(firstLoginRequestSchema),
    defaultValues: { email: useAuthStore.getState().email ?? '' },
  });

  const {
    reset: resetTotpForm,
    register: registerTotp,
    handleSubmit: handleTotpSubmit,
    formState: { errors: totpErrors, isSubmitting: totpSubmitting },
  } = useForm<FirstLoginVerifyFormValues>({
    resolver: zodResolver(firstLoginVerifySchema),
    defaultValues: {
      email: useAuthStore.getState().email ?? '',
      oneTimeCode: '',
    },
  });

  const onOneTimeCodeRequest = async (data: FirstLoginRequestFormValues) => {
    if (data.email) {
      try {
        const response = await requestOneTimeCode.mutateAsync({
          email: data.email,
        });

        toast(t(`messagekey.${response.messageKey}`));

        resetTotpForm({ email: data.email, oneTimeCode: '' });
        setStep(Step.STEP2);
      } catch (error) {
        toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));
      }
    }
  };

  const onVerifyTotp = async (data: FirstLoginVerifyFormValues) => {
    try {
      const response = await validateOneTimeCode.mutateAsync({
        email: data.email,
        oneTimeCode: data.oneTimeCode,
      });

      toast(t(`messagekey.${response.messageKey}`));

      router.push(Routes.Setup_Password);
    } catch (error) {
      toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));
      setStep(Step.STEP1);
    }
  };

  return (
    <AuthCard
      title={t('pages.first-login.title')}
      description={
        step === Step.STEP1
          ? t('pages.first-login.step-one.subtitle')
          : t('pages.first-login.step-two.subtitle')
      }
    >
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
            <AuthFormField
              id='email'
              label={t('common.email.title')}
              type='email'
              placeholder='m@example.com'
              disabled
              error={emailErrors.email?.message}
              {...registerEmail('email')}
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
          <motion.form
            key='step2'
            onSubmit={handleTotpSubmit(onVerifyTotp)}
            className='flex flex-col gap-2'
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
              error={totpErrors.email?.message}
              {...registerTotp('email')}
            />
            <div className='flex flex-col gap-2'>
              <Label htmlFor='code' className='text-zinc-300'>
                {t('pages.first-login.otc.title')}
              </Label>
              <Input
                id='code'
                type='text'
                placeholder='123456'
                className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
                {...registerTotp('oneTimeCode')}
                ref={(e) => {
                  registerTotp('oneTimeCode').ref(e);
                  codeInputRef.current = e;
                }}
              />
              <ValidationMessage messageKey={totpErrors.oneTimeCode?.message} />
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
    </AuthCard>
  );
}
