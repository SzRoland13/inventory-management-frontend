'use client';

import { useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTranslations } from 'next-intl';

export function ShortLifeTokenCountdown({
  onExpire,
}: {
  onExpire?: () => void;
}) {
  const t = useTranslations();
  const getRemainingSessionSeconds = useAuthStore(
    (state) => state.getRemainingSessionSeconds,
  );

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // client-only effect
  useEffect(() => {
    setSecondsLeft(getRemainingSessionSeconds());

    const interval = setInterval(() => {
      const remaining = getRemainingSessionSeconds();
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [getRemainingSessionSeconds, onExpire]);

  if (secondsLeft === null || secondsLeft <= 0) return null;

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (secondsLeft % 60).toString().padStart(2, '0');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className='ml-auto px-2 py-1 bg-zinc-800 text-zinc-100 rounded-md font-mono text-sm shadow-md whitespace-nowrap'>
            {minutes}:{seconds}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('pages.2fa.countdown')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
