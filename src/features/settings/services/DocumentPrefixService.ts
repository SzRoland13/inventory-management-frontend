import { BaseService } from '@/features/shared/api/BaseService';
import { ApiResponse } from '@/features/shared/types/genericDtos';
import { handleRequest } from '@/features/shared/api/service';
import {
  DocumentPrefixesResponse,
  DocumentPrefixesUpdateRequest,
} from '@/features/settings/types/documentPrefixDtos';

export const DocumentPrefixService = {
  getAll: async (): Promise<ApiResponse<DocumentPrefixesResponse>> => {
    return handleRequest(BaseService.get('/prefix'));
  },

  updateAll: async (
    data: DocumentPrefixesUpdateRequest,
  ): Promise<ApiResponse<DocumentPrefixesResponse>> => {
    return handleRequest(BaseService.post('/prefix', data));
  },
};
