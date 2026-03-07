import { BaseService } from '@/lib/services/BaseService';
import { ApiResponse } from '@/lib/services/dtos/genericDtos';
import { handleRequest } from '@/lib/helpers/service';
import {
  CompanyBaseDataResponse,
  CompanyExtendedResponse,
  CompanyUpdateRequest,
  LogoUpdateRequest,
} from '@/lib/services/dtos/companyDtos';

export const CompanyService = {
  getBaseCompanyData: async (): Promise<
    ApiResponse<CompanyBaseDataResponse>
  > => {
    return handleRequest(BaseService.get('/company'));
  },

  getExtendedCompanyData: async (): Promise<
    ApiResponse<CompanyExtendedResponse>
  > => {
    return handleRequest(BaseService.get('/company/extended'));
  },

  updateCompany: async (
    data: CompanyUpdateRequest,
  ): Promise<ApiResponse<CompanyExtendedResponse>> => {
    return handleRequest(BaseService.put('/company', data));
  },

  updateLogo: async (data: LogoUpdateRequest): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.post('/company/logo', data));
  },
};
