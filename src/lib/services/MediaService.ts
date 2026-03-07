import { BaseService } from '@/lib/services/BaseService';
import { ApiResponse } from '@/lib/services/dtos/genericDtos';
import {
  MediaPreviewResponse,
  MediaUploadInitResponse,
  MediaUploadRequest,
} from '@/lib/services/dtos/mediaDtos';
import { handleRequest } from '@/lib/helpers/service';

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
