import { BaseService } from '@/features/shared/api/BaseService';
import { ApiResponse } from '@/features/shared/types/genericDtos';
import {
  MediaPreviewResponse,
  MediaUploadInitResponse,
  MediaUploadRequest,
} from '@/features/shared/media/types/mediaDtos';
import { handleRequest } from '@/features/shared/api/service';

export const MediaService = {
  initializeUpload: async (
    data: MediaUploadRequest,
  ): Promise<ApiResponse<MediaUploadInitResponse>> => {
    return handleRequest(BaseService.post('/media', data));
  },

  getPreview: async (
    id: number,
  ): Promise<ApiResponse<MediaPreviewResponse>> => {
    return handleRequest(BaseService.get(`/media/${id}/preview`));
  },
};
