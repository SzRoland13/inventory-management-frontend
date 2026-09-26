import axios from 'axios';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const axiosClient = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

// Shared across concurrent 401s so N simultaneous requests trigger one
// /auth/refresh call instead of N racing ones.
let refreshPromise: Promise<void> | null = null;

function refreshSession(): Promise<void> {
  refreshPromise ??= axiosClient
    .post('/auth/refresh')
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

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
        await refreshSession();

        return axiosClient(originalRequest);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (e.response?.status === 400 || e.response?.status === 401) {
          await axiosClient.post('/auth/logout').catch(() => {});

          const segment = window.location.pathname.split('/')[1];
          const locale = hasLocale(routing.locales, segment)
            ? segment
            : routing.defaultLocale;

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
