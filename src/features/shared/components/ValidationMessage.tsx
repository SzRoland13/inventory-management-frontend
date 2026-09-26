'use client';

import { useTranslations } from 'next-intl';

interface ValidationMessageProps {
  messageKey?: string;
}

export function ValidationMessage({ messageKey }: ValidationMessageProps) {
  const t = useTranslations();

  if (!messageKey) return null;

  return <p className='text-sm text-red-400'>{t(messageKey as never)}</p>;
}
