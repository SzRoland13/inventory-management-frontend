'use client';

import { useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthStore } from '@/lib/stores/authStore';

export function ShortLifeTokenCountdown({
  onExpire,
}: {
  onExpire?: () => void;
}) {
  const getRemainingSessionSeconds = useAuthStore(
    (state) => state.getRemainingSessionSeconds,
  );

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // client-only effect
  useEffect(() => {
    setSecondsLeft(getRemainingSessionSeconds()); // initialize only on client

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

  if (secondsLeft === null || secondsLeft <= 0) return null; // hide until client renders

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
          <p>
            This countdown shows how long you have to complete 2FA verification.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
