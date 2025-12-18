'use client';

import axios from 'axios';
import { AuthMessages } from '@/messages/AuthMessages';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // 🍪 cookie auth
});

/* ================================
   REQUEST INTERCEPTOR
================================ */
// Cookie auth olduğu için burada ekstra işlem yok
axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

/* ================================
   REFRESH QUEUE (race condition önler)
================================ */
let isRefreshing = false;
let failedQueue: {
  resolve: () => void;
  reject: (err: any) => void;
}[] = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(p => {
    error ? p.reject(error) : p.resolve();
  });
  failedQueue = [];
};

/* ================================
   RESPONSE INTERCEPTOR
================================ */
axiosInstance.interceptors.response.use(
  (response) => {
    // ❗ Backend 200 dönüp message gönderirse bile yakala
    const message = response.data?.message;

    if (
      message === AuthMessages.TOKEN_EXPIRED ||
      message === AuthMessages.USER_NOT_AUTHENTICATED
    ) {
      return Promise.reject({
        config: response.config,
        response: {
          status: 401, // virtual status
          data: response.data,
        },
      });
    }

    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    // 🔒 refresh endpoint kendini refreshlemesin
    if (originalRequest?.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // 🔁 Retry guard
    if (originalRequest?._retry) {
      return Promise.reject(error);
    }

    // 🔍 Message bazlı auth kontrolü
    const message =
      error.response?.data?.message ||
      error.message;

    const shouldRefresh =
      message === AuthMessages.TOKEN_EXPIRED ||
      message === AuthMessages.USER_NOT_AUTHENTICATED;

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    // 🧵 Aynı anda refresh varsa kuyruğa al
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(axiosInstance(originalRequest)),
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // 🔄 Refresh çağrısı
      await axios.post(
        `${process.env.APPLICATION_HOST}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );

      processQueue();

      // 🔁 Orijinal isteği tekrar gönder
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);

      // ❌ Refresh de başarısız → login
      if (typeof window !== 'undefined') {
        const redirect = encodeURIComponent(window.location.pathname);
        window.location.href = `/auth/login?redirect=${redirect}`;
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
export default axiosInstance;