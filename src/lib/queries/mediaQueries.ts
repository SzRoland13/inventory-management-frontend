import { useMutation, useQuery } from '@tanstack/react-query';
import { MediaService } from '@/lib/services/MediaService';
import { ObjectStorageService } from '@/lib/services/ObjectStorageService';
import { MediaPreviewResponse } from '@/lib/services/dtos/mediaDtos';
import { requireSuccessfulResponse } from '@/lib/queries/apiResponse';
import { queryKeys } from '@/lib/queries/queryKeys';

const REFRESH_BUFFER_MS = 60_000;

export function useMediaPreviewQuery(
  id: number | null,
  initialPreview?: MediaPreviewResponse,
) {
  return useQuery({
    queryKey: queryKeys.media.preview(id ?? 0),
    queryFn: () => requireSuccessfulResponse(MediaService.getPreview(id!)),
    enabled: id !== null,
    initialData: initialPreview
      ? {
          success: true,
          messageKey: '',
          payload: initialPreview,
        }
      : undefined,
    staleTime: (query) => {
      const expiry = query.state.data?.payload.expiry;
      return expiry
        ? Math.max(
            new Date(expiry).getTime() - Date.now() - REFRESH_BUFFER_MS,
            0,
          )
        : 0;
    },
    refetchInterval: (query) => {
      const expiry = query.state.data?.payload.expiry;
      return expiry
        ? Math.max(
            new Date(expiry).getTime() - Date.now() - REFRESH_BUFFER_MS,
            1_000,
          )
        : 60_000;
    },
  });
}

export function useMediaUploadMutation() {
  return useMutation({
    mutationFn: async (file: File) => {
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
      });

      return requireSuccessfulResponse(
        MediaService.getPreview(initializeResponse.payload.id),
      );
    },
  });
}
