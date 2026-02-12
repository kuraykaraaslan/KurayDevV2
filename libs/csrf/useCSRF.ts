'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'

const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Cookie'den değer oku
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

interface UseCSRFReturn {
  token: string | null
  loading: boolean
  error: string | null
  refreshToken: () => Promise<string | null>
  headerName: string
}

/**
 * CSRF Token React Hook
 *
 * @example
 * ```tsx
 * const { token, loading, refreshToken, headerName } = useCSRF();
 *
 * const handleSubmit = async () => {
 *   await fetch('/api/posts', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       [headerName]: token || '',
 *     },
 *     body: JSON.stringify(data),
 *     credentials: 'include',
 *   });
 * };
 * ```
 *
 * Not: axiosInstance kullanıyorsanız CSRF token otomatik olarak eklenir,
 * bu hook'u kullanmanıza gerek yok.
 */
export function useCSRF(): UseCSRFReturn {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshToken = useCallback(async (): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get(`/api/auth/csrf`, { withCredentials: true })

      const newToken = response.data?.data?.token || getCookie(CSRF_COOKIE_NAME)
      setToken(newToken)
      return newToken
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch CSRF token'
      setError(errorMessage)
      console.error('[useCSRF] Error:', errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // İlk yüklemede token'ı cookie'den almayı dene
    const existingToken = getCookie(CSRF_COOKIE_NAME)

    if (existingToken) {
      setToken(existingToken)
      setLoading(false)
    } else {
      // Cookie'de yoksa API'den al
      refreshToken()
    }
  }, [refreshToken])

  return {
    token,
    loading,
    error,
    refreshToken,
    headerName: CSRF_HEADER_NAME,
  }
}

/**
 * CSRF token'ı fetch API ile kullanmak için helper
 */
export function getCSRFHeaders(): Record<string, string> {
  const token = getCookie(CSRF_COOKIE_NAME)
  if (!token) return {}

  return {
    [CSRF_HEADER_NAME]: token,
  }
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME }
