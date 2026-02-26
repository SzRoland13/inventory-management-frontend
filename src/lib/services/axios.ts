import axios from 'axios';
import { useUserStore } from '../stores/userStore';
import { useLocaleStore } from '@/lib/stores/localeStore';

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const axiosClient = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/logout')
    ) {
      originalRequest._retry = true;

      try {
        await axiosClient.post('/auth/refresh');

        return axiosClient(originalRequest);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (e.response?.status === 400 || e.response?.status === 401) {
          await axiosClient.post('/auth/logout').catch(() => {});

          useUserStore.getState().clearUser();

          const locale = useLocaleStore.getState().locale || 'en';

          if (window.location.pathname !== `/${locale}/login-start`) {
            window.location.href = `/${locale}/login-start`;
          }

          return Promise.reject(null);
        }

        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
