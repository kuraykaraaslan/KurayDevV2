'use client'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

const OfflineIndicator = () => {
  const { t } = useTranslation()
  const [_isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success(t('frontend.offline.online'))
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error(t('frontend.offline.offline'))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial state
    if (!navigator.onLine) {
      setIsOnline(false)
      toast.error(t('frontend.offline.offline'))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return null
}

export default OfflineIndicator
