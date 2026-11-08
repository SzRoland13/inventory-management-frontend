import { useMutation, useQuery } from '@tanstack/react-query';
import { MediaService } from '@/features/shared/media/MediaService';
import { ObjectStorageService } from '@/features/shared/media/ObjectStorageService';
import {
  MediaPreviewResponse,
  MediaThumbnailPreviewResponse,
  MediaThumbnailStatus,
} from '@/features/shared/media/types/mediaDtos';
import { requireSuccessfulResponse } from '@/features/shared/api/apiResponse';
import { queryKeys } from '@/features/shared/api/queryKeys';

const REFRESH_BUFFER_MS = 60_000;

const toInitialPreviewResponse = (initialPreview: MediaPreviewResponse) => {
  return {
    success: true,
    messageKey: '',
    payload: initialPreview,
  };
};

const getMsUntilRefreshNeeded = (expiry: string, minMs: number) => {
  return Math.max(
    new Date(expiry).getTime() - Date.now() - REFRESH_BUFFER_MS,
    minMs,
  );
};

export function useMediaPreviewQuery(
  id: number | null,
  initialPreview?: MediaPreviewResponse,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.media.preview(id ?? 0),
    queryFn: () => requireSuccessfulResponse(MediaService.getPreview(id!)),
    enabled: id !== null && enabled,
    initialData: initialPreview
      ? toInitialPreviewResponse(initialPreview)
      : undefined,
    staleTime: (query) => {
      const expiry = query.state.data?.payload.expiry;
      return expiry ? getMsUntilRefreshNeeded(expiry, 0) : 0;
    },
    refetchInterval: (query) => {
      const expiry = query.state.data?.payload.expiry;
      return expiry ? getMsUntilRefreshNeeded(expiry, 1_000) : 60_000;
    },
  });
}

export function useMediaThumbnailPreviewQuery(
  id: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.media.thumbnailPreview(id ?? 0),
    queryFn: () => requireSuccessfulResponse(MediaService.getThumbnailPreview(id!)),
    enabled: id !== null && enabled,
    staleTime: (query) => {
      const preview = query.state.data?.payload as
        | MediaThumbnailPreviewResponse
        | undefined;
      const expiry =
        preview?.status === MediaThumbnailStatus.READY ? preview.expiry : null;
      return expiry ? getMsUntilRefreshNeeded(expiry, 0) : 0;
    },
    refetchInterval: (query) => {
      const preview = query.state.data?.payload as
        | MediaThumbnailPreviewResponse
        | undefined;
      if (preview?.status === MediaThumbnailStatus.PENDING) return 2_000;
      if (preview?.status === MediaThumbnailStatus.FAILED) return false;
      const expiry =
        preview?.status === MediaThumbnailStatus.READY ? preview.expiry : null;
      return expiry ? getMsUntilRefreshNeeded(expiry, 1_000) : 60_000;
    },
  });
}

export function useMediaUploadMutation() {
  return useMutation({
    mutationFn: async (input: {
      file: File;
      onProgress?: (progress: number) => void;
    }) => {
      const { file, onProgress } = input;
      const initializeResponse = await requireSuccessfulResponse(
        MediaService.initializeUpload({
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      );

      await ObjectStorageService.putImage({
        url: initializeResponse.payload.putUrl,
        file,
        onProgress,
      });

      return requireSuccessfulResponse(
        MediaService.getPreview(initializeResponse.payload.id),
      );
    },
  });
}
