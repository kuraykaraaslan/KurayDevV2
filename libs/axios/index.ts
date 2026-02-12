'use client'

import axios from 'axios'
import { AuthMessages } from '@/messages/AuthMessages'

const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_COOKIE_NAME = 'csrf-token'

/**
 * Read a value from cookies by name
 * @param name - The cookie name to retrieve
 * @returns The cookie value or null if not found
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

/**
 * Retrieves or refreshes the CSRF token
 * First attempts to read from cookie, then fetches from API if not found
 * @returns The CSRF token or null if unavailable
 */
async function ensureCSRFToken(): Promise<string | null> {
  let token = getCookie(CSRF_COOKIE_NAME)

  if (!token) {
    try {
      const response = await axios.get(`/api/auth/csrf`, { withCredentials: true })
      token = response.data?.data?.token || getCookie(CSRF_COOKIE_NAME)
    } catch {
      console.warn('[CSRF] Failed to fetch CSRF token')
    }
  }

  return token
}

/**
 * Configured Axios instance with credentials support
 */
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

/**
 * Request interceptor
 * Automatically attaches CSRF token to mutating requests (POST, PUT, DELETE, PATCH)
 */
axiosInstance.interceptors.request.use(
  async (config) => {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS']
    const method = config.method?.toUpperCase() || 'GET'

    if (!safeMethods.includes(method)) {
      const csrfToken = await ensureCSRFToken()
      if (csrfToken) {
        config.headers[CSRF_HEADER_NAME] = csrfToken
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Refresh queue state
 * Prevents race conditions when multiple requests fail simultaneously
 */
let isRefreshing = false
let failedQueue: {
  resolve: () => void
  reject: (err: any) => void
}[] = []

/**
 * Processes all queued requests after token refresh
 * @param error - Error to reject with, or null for success
 */
const processQueue = (error: any = null) => {
  failedQueue.forEach((p) => {
    error ? p.reject(error) : p.resolve()
  })
  failedQueue = []
}

/**
 * Response interceptor
 * Handles token expiration and automatic refresh flow
 * Queues concurrent requests during refresh to prevent race conditions
 */
axiosInstance.interceptors.response.use(
  (response) => {
    const message = response.data?.message

    if (message === AuthMessages.TOKEN_EXPIRED || message === AuthMessages.USER_NOT_AUTHENTICATED) {
      return Promise.reject({
        config: response.config,
        response: {
          status: 401,
          data: response.data,
        },
      })
    }

    return response
  },

  async (error) => {
    const originalRequest = error.config

    /** Prevent refresh endpoint from refreshing itself */
    if (originalRequest?.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    /** Prevent infinite retry loops */
    if (originalRequest?._retry) {
      return Promise.reject(error)
    }

    const message = error.response?.data?.message || error.message

    const shouldRefresh =
      message === AuthMessages.TOKEN_EXPIRED || message === AuthMessages.USER_NOT_AUTHENTICATED

    if (!shouldRefresh) {
      return Promise.reject(error)
    }

    /** Queue concurrent requests while refresh is in progress */
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(axiosInstance(originalRequest)),
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_APPLICATION_HOST}/api/auth/refresh`,
        {},
        { withCredentials: true }
      )

      processQueue()

      return axiosInstance(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError)

      /** Redirect to login on refresh failure */
      if (typeof window !== 'undefined') {
        const redirect = encodeURIComponent(window.location.pathname)
        window.location.href = `/auth/login?redirect=${redirect}`
      }

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default axiosInstance
