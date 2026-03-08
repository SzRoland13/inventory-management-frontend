import { BaseService } from '@/lib/services/BaseService';
import { ApiResponse } from '@/lib/services/dtos/genericDtos';
import { handleRequest } from '@/lib/helpers/service';
import {
  DocumentPrefixesResponse,
  DocumentPrefixesUpdateRequest,
} from '@/lib/services/dtos/documentPrefixDtos';

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
