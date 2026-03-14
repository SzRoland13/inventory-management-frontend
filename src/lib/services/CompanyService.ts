import { BaseService } from '@/lib/services/BaseService';
import { ApiResponse } from '@/lib/services/dtos/genericDtos';
import { handleRequest } from '@/lib/helpers/service';
import {
  CompanyBaseDataResponse,
  CompanyExtendedResponse,
  CompanyBaseDataUpdateRequest,
  LogoUpdateRequest,
  CompanyMinimalResponse,
  CompanyBillingDataUpdateRequest,
  CompanyBillingDataResponse,
  CompanyPreferredCurrencyUpdateRequest,
  UpdatedPreferredCurrencyResponse,
} from '@/lib/services/dtos/companyDtos';

export const CompanyService = {
  getMinimalCompanyData: async (): Promise<
    ApiResponse<CompanyMinimalResponse>
  > => {
    return handleRequest(BaseService.get('/company'));
  },

  getExtendedCompanyData: async (): Promise<
    ApiResponse<CompanyExtendedResponse>
  > => {
    return handleRequest(BaseService.get('/company/extended'));
  },

  updateCompanyBaseData: async (
    data: CompanyBaseDataUpdateRequest,
  ): Promise<ApiResponse<CompanyBaseDataResponse>> => {
    return handleRequest(BaseService.put('/company', data));
  },

  updateCompanyBillingData: async (
    data: CompanyBillingDataUpdateRequest,
  ): Promise<ApiResponse<CompanyBillingDataResponse>> => {
    return handleRequest(BaseService.put('/company/billing', data));
  },

  updateLogo: async (data: LogoUpdateRequest): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.post('/company/logo', data));
  },

  updatePreferredCurrency: async (
    data: CompanyPreferredCurrencyUpdateRequest,
  ): Promise<ApiResponse<UpdatedPreferredCurrencyResponse>> => {
    return handleRequest(BaseService.post('/company/currency', data));
  },
};
