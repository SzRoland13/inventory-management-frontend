'use client';

import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMediaPreviewQuery } from '@/features/shared/media/mediaQueries';
import type { MediaPreviewResponse } from '@/features/shared/media/types/mediaDtos';
import { cn } from '@/features/shared/utils/css';

type ProductImagePreviewProps = {
  mediaAssetId: number | null;
  alt: string;
  className?: string;
  preview?: MediaPreviewResponse;
};

export function ProductImagePreview({
  mediaAssetId,
  alt,
  className,
  preview,
}: ProductImagePreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    if (mediaAssetId === null) return;
    if (typeof IntersectionObserver === 'undefined') {
      const timeout = window.setTimeout(() => setNearViewport(true), 0);
      return () => window.clearTimeout(timeout);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setNearViewport(entry.isIntersecting);
      },
      { rootMargin: '200px' },
    );
    if (frameRef.current) observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, [mediaAssetId]);

  const query = useMediaPreviewQuery(mediaAssetId, preview, nearViewport);
  const imageUrl = query.data?.payload.getUrl;

  return (
    <div
      ref={frameRef}
      className={cn(
        'relative flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-700 bg-zinc-800',
        className,
      )}
    >
      <ImageIcon className='h-1/3 w-1/3 text-zinc-500' aria-hidden='true' />
      {imageUrl && (
        <Image
          key={imageUrl}
          src={imageUrl}
          alt={alt}
          width={500}
          height={500}
          unoptimized
          className='absolute inset-0 h-full w-full object-contain'
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      )}
    </div>
  );
}
