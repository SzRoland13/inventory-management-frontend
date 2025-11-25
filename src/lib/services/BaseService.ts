/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosClient from '@/lib/services/axios';
import { AxiosRequestConfig } from 'axios';

type QueryParams = Record<string, any>;

export const BaseService = {
  get: async <T>(
    url: string,
    params?: QueryParams,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await axiosClient.get<T>(url, { params, ...config });
    return response.data;
  },

  post: async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await axiosClient.post<T>(url, data, config);
    return response.data;
  },

  put: async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await axiosClient.put<T>(url, data, config);
    return response.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosClient.delete<T>(url, config);
    return response.data;
  },
};
