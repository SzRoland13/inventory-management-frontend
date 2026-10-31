'use client';

import { useEffect, useRef, useState } from 'react';
import type { DragEvent, PointerEvent } from 'react';
import {
  GripVertical,
  ImagePlus,
  RotateCcw,
  Star,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/features/shared/components/ui/button';
import { useMediaUploadMutation } from '@/features/shared/media/mediaQueries';
import type { MediaPreviewResponse } from '@/features/shared/media/types/mediaDtos';
import type { ProductImageResponse } from '@/features/products/types/product';
import { sortProductImages } from '@/features/products/helpers/productImages';
import { ProductImagePreview } from '@/features/products/components/ProductImagePreview';
import { FormSection } from './FormSection';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const UPLOAD_CONCURRENCY = 3;
const IMAGE_OUTLINE_BUTTON_CLASS =
  'border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100';

export type ProductImageEditorItem = Omit<ProductImageResponse, 'mediaAssetId'> & {
  mediaAssetId: number | null;
  key: string;
  preview?: MediaPreviewResponse;
  file?: File;
  uploadState: 'uploading' | 'ready' | 'error';
  progress: number;
};

type ProductImagesSectionProps = {
  images: ProductImageEditorItem[];
  onImagesChange: (images: ProductImageEditorItem[]) => void;
  disabled?: boolean;
};

export function productImagesFromResponse(
  images: ProductImageResponse[] | undefined,
): ProductImageEditorItem[] {
  return sortProductImages(images).map((image) => ({
      ...image,
      key: `asset-${image.mediaAssetId}`,
      uploadState: 'ready',
      progress: 100,
    }));
}

export function ProductImagesSection({
  images,
  onImagesChange,
  disabled = false,
}: ProductImagesSectionProps) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const nextUploadId = useRef(0);
  const touchDragKey = useRef<string | null>(null);
  const upload = useMediaUploadMutation();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [draggedImageKey, setDraggedImageKey] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const [reorderAnnouncement, setReorderAnnouncement] = useState('');
  const latestImages = useRef(images);
  useEffect(() => {
    latestImages.current = images;
  }, [images]);

  const commitImages = (next: ProductImageEditorItem[]) => {
    latestImages.current = next;
    onImagesChange(next);
  };

  const updateImage = (
    key: string,
    update: (image: ProductImageEditorItem) => ProductImageEditorItem,
  ) => {
    commitImages(
      latestImages.current.map((image) =>
        image.key === key ? update(image) : image,
      ),
    );
  };

  const updateImages = (next: ProductImageEditorItem[]) =>
      commitImages(
        next.map((image, index) => ({ ...image, sortOrder: index + 1 })),
      );

  const handleFiles = async (files: FileList | null) => {
    setValidationError(null);
    if (!files?.length) return;

    const selectedFiles = Array.from(files);
    if (inputRef.current) inputRef.current.value = '';
    const accepted: File[] = [];
    for (const file of selectedFiles) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        setValidationError(t('pages.products.images.invalid-type'));
      } else if (file.size > MAX_FILE_SIZE) {
        setValidationError(t('pages.products.images.too-large'));
      } else {
        accepted.push(file);
      }
    }

    let nextImages = [...latestImages.current];
    const availableSlots = Math.max(0, MAX_IMAGES - nextImages.length);

    if (accepted.length > availableSlots) {
      setValidationError(t('pages.products.images.max-count', { count: MAX_IMAGES }));
    }

    const filesToUpload = accepted.slice(0, availableSlots);

    const itemsToUpload = filesToUpload.map((file, index) => {
      const item: ProductImageEditorItem = {
        key: `pending-${nextUploadId.current++}`,
        mediaAssetId: null,
        filename: file.name,
        sortOrder: nextImages.length + index + 1,
        file,
        uploadState: 'uploading',
        progress: 0,
      };
      return item;
    });
    nextImages = [...nextImages, ...itemsToUpload];
    commitImages(nextImages);

    for (let index = 0; index < itemsToUpload.length; index += UPLOAD_CONCURRENCY) {
      const batch = itemsToUpload.slice(index, index + UPLOAD_CONCURRENCY);
      await Promise.all(batch.map((item) => uploadFileWithItems(item)));
    }

  };

  const uploadFileWithItems = async (item: ProductImageEditorItem) => {
    updateImage(item.key, (image) => ({
      ...image,
      uploadState: 'uploading',
      progress: 0,
    }));

    try {
      const response = await upload.mutateAsync({
        file: item.file!,
        onProgress: (progress) => {
          updateImage(item.key, (image) => ({ ...image, progress }));
        },
      });
      updateImage(item.key, (image) => ({
        ...image,
        mediaAssetId: response.payload.id,
        preview: response.payload,
        uploadState: 'ready',
        progress: 100,
      }));
    } catch {
      updateImage(item.key, (image) => ({
        ...image,
        uploadState: 'error',
        progress: 0,
      }));
    }
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const next = [...images];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    updateImages(next);
    setReorderAnnouncement(
      t('pages.products.images.position', {
        filename: next[targetIndex].filename,
        position: targetIndex + 1,
        count: next.length,
      }),
    );
  };

  const reorderImage = (
    sourceKey: string | null,
    targetKey: string,
    droppedAfterTarget: boolean,
  ) => {
    if (disabled || !sourceKey) return;
    const sourceIndex = images.findIndex((image) => image.key === sourceKey);
    const targetIndex = images.findIndex((image) => image.key === targetKey);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      setDropTargetKey(null);
      return;
    }

    let insertionIndex = targetIndex + (droppedAfterTarget ? 1 : 0);
    if (sourceIndex < insertionIndex) insertionIndex -= 1;

    const next = [...images];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(insertionIndex, 0, moved);
    updateImages(next);
    setReorderAnnouncement(
      t('pages.products.images.position', {
        filename: moved.filename,
        position: insertionIndex + 1,
        count: next.length,
      }),
    );
    setDraggedImageKey(null);
    setDropTargetKey(null);
  };

  const handleDrop = (
    targetKey: string,
    event: DragEvent<HTMLLIElement>,
  ) => {
    event.preventDefault();
    const targetBounds = event.currentTarget.getBoundingClientRect();
    reorderImage(
      event.dataTransfer.getData('text/plain') || draggedImageKey,
      targetKey,
      event.clientX >= targetBounds.left + targetBounds.width / 2,
    );
  };

  const handleTouchPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const sourceKey = touchDragKey.current;
    if (!sourceKey) return;
    event.preventDefault();
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-product-image-card]');
    const targetKey = target?.dataset.productImageCard ?? null;
    setDropTargetKey(targetKey !== sourceKey ? targetKey : null);
  };

  const handleTouchPointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    const sourceKey = touchDragKey.current;
    if (!sourceKey) return;
    event.preventDefault();
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-product-image-card]');
    const targetKey = target?.dataset.productImageCard;
    if (target && targetKey) {
      const bounds = target.getBoundingClientRect();
      reorderImage(
        sourceKey,
        targetKey,
        event.clientX >= bounds.left + bounds.width / 2,
      );
    }
    touchDragKey.current = null;
    setDraggedImageKey(null);
    setDropTargetKey(null);
  };

  return (
    <FormSection title={t('pages.products.images.title')} icon={ImagePlus}>
      <div className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <p className='text-xs text-zinc-400'>
            {t('pages.products.images.help', { count: images.length, max: MAX_IMAGES })}
          </p>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className={`gap-2 ${IMAGE_OUTLINE_BUTTON_CLASS}`}
            disabled={disabled || images.length >= MAX_IMAGES}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus aria-hidden='true' />
            {t('pages.products.images.add')}
          </Button>
          <input
            ref={inputRef}
            type='file'
            multiple
            accept='image/jpeg,image/png,image/webp'
            className='sr-only'
            aria-label={t('pages.products.images.add')}
            disabled={disabled || images.length >= MAX_IMAGES}
            onChange={(event) => void handleFiles(event.target.files)}
          />
        </div>

        {validationError && (
          <p className='text-sm text-red-300' role='alert'>
            {validationError}
          </p>
        )}

        {images.length === 0 ? (
          <p className='rounded-lg border border-dashed border-zinc-700 px-4 py-6 text-center text-sm text-zinc-500'>
            {t('pages.products.images.empty')}
          </p>
        ) : (
          <>
            <p className='sr-only' aria-live='polite' role='status'>
              {reorderAnnouncement}
            </p>
            <ol className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {images.map((image, index) => (
              <li
                key={image.key}
                data-product-image-card={image.key}
                onDragOver={(event) => {
                  if (!disabled && draggedImageKey && draggedImageKey !== image.key) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    setDropTargetKey(image.key);
                  }
                }}
                onDrop={(event) => handleDrop(image.key, event)}
                className={`flex min-w-0 gap-3 rounded-lg border bg-zinc-900/70 p-2 transition-colors ${dropTargetKey === image.key ? 'border-sky-400' : 'border-zinc-700'} ${draggedImageKey === image.key ? 'opacity-50' : ''}`}
              >
                <ProductImagePreview
                  mediaAssetId={image.mediaAssetId}
                  preview={image.preview}
                  alt={image.filename}
                  className='h-20 w-20'
                />
                <div className='min-w-0 flex-1'>
                  <div className='flex items-start justify-between gap-2'>
                      <div className='flex min-w-0 items-start gap-1'>
                        <button
                          type='button'
                          draggable={!disabled && image.uploadState === 'ready'}
                          aria-label={t('pages.products.images.drag-to-reorder', { filename: image.filename })}
                          aria-keyshortcuts='ArrowUp ArrowDown'
                          title={t('pages.products.images.drag-to-reorder', { filename: image.filename })}
                          disabled={disabled || image.uploadState !== 'ready'}
                          className='grid size-7 shrink-0 cursor-grab place-items-center rounded-md text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50'
                          style={{ touchAction: 'none' }}
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', image.key);
                            const card = event.currentTarget.closest('li');
                            if (card) event.dataTransfer.setDragImage(card, 24, 24);
                            setDraggedImageKey(image.key);
                          }}
                          onDragEnd={() => {
                            setDraggedImageKey(null);
                            setDropTargetKey(null);
                          }}
                          onPointerDown={(event) => {
                            if (
                              event.pointerType !== 'touch' ||
                              disabled ||
                              image.uploadState !== 'ready'
                            ) {
                              return;
                            }
                            event.preventDefault();
                            event.currentTarget.setPointerCapture(event.pointerId);
                            touchDragKey.current = image.key;
                            setDraggedImageKey(image.key);
                          }}
                          onPointerMove={handleTouchPointerMove}
                          onPointerUp={handleTouchPointerEnd}
                          onPointerCancel={() => {
                            if (!touchDragKey.current) return;
                            touchDragKey.current = null;
                            setDraggedImageKey(null);
                            setDropTargetKey(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                              event.preventDefault();
                              moveImage(index, event.key === 'ArrowUp' ? -1 : 1);
                            }
                          }}
                        >
                          <GripVertical className='size-4' aria-hidden='true' />
                        </button>
                        <div className='min-w-0'>
                          <p className='truncate text-sm text-zinc-100' title={image.filename}>
                            {image.filename}
                          </p>
                          {index === 0 && (
                            <span className='mt-1 inline-flex items-center gap-1 text-xs text-amber-300'>
                              <Star className='h-3 w-3' aria-hidden='true' />
                              {t('pages.products.images.primary')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon-sm'
                        aria-label={t('pages.products.images.remove', { filename: image.filename })}
                        disabled={disabled}
                        onClick={() => updateImages(images.filter((entry) => entry.key !== image.key))}
                      >
                        <Trash2 aria-hidden='true' />
                      </Button>
                  </div>

                  {image.uploadState === 'uploading' ? (
                    <div className='mt-2 space-y-1' role='status' aria-live='polite'>
                      <div className='flex justify-between text-xs text-zinc-400'>
                        <span>{t('pages.products.images.uploading')}</span>
                        <span>{image.progress}%</span>
                      </div>
                      <progress
                        className='h-1.5 w-full accent-sky-500'
                        value={image.progress}
                        max={100}
                        aria-label={t('pages.products.images.progress', { filename: image.filename })}
                      />
                    </div>
                  ) : image.uploadState === 'error' ? (
                    <div className='mt-2 flex items-center justify-between gap-2'>
                      <span className='text-xs text-red-300' role='alert'>
                        {t('pages.products.images.upload-error')}
                      </span>
                      <Button
                        type='button'
                        variant='outline'
                        size='xs'
                        className='border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100'
                        aria-label={t('pages.products.images.retry', { filename: image.filename })}
                        disabled={disabled}
                        onClick={() => void uploadFileWithItems(image)}
                      >
                        <RotateCcw aria-hidden='true' />
                        {t('common.retry')}
                      </Button>
                    </div>
                  ) : (
                    <p className='sr-only'>
                      {t('pages.products.images.drag-to-reorder', { filename: image.filename })}
                    </p>
                  )}
                </div>
              </li>
            ))}
            </ol>
          </>
        )}
      </div>
    </FormSection>
  );
}
