import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  useUserStore,
} from '../stores/userStore';
import { ApiResponse } from '../services/dtos/genericDtos';
import { TokensDetails } from '../services/dtos/authDtos';
import { useLocaleStore } from '@/lib/stores/localeStore';

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const axiosClient = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers!['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const refreshToken = getRefreshToken();

    if (originalRequest.url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      refreshToken
    ) {
      originalRequest._retry = true;

      try {
        const response = await axios.post<ApiResponse<TokensDetails>>(
          `${baseURL}/auth/refresh`,
          {
            refreshToken,
          },
        );

        const { accessToken } = response.data.data;
        useUserStore.getState().setUser({ accessToken });

        axiosClient.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${accessToken}`;

        return axiosClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);

        useUserStore.getState().clearUser();
        const locale = useLocaleStore.getState().locale || 'en';

        if (window.location.pathname !== `/${locale}/login-start`) {
          window.location.href = `/${locale}/login-start`;
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
