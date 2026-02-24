'use client'

import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faBellSlash } from '@fortawesome/free-solid-svg-icons'
import axiosInstance from '@/libs/axios'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Toggle button for push notification subscription.
 * Can be placed in admin navbar or user settings.
 */
export default function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  )
  const [loading, setLoading] = useState(false)

  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setIsSupported(true)

    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  }, [])

  useEffect(() => {
    checkSubscription()
  }, [checkSubscription])

  const subscribe = async () => {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      const serialized = sub.toJSON()

      await axiosInstance.post('/api/push/subscribe', {
        endpoint: serialized.endpoint,
        keys: serialized.keys,
      })

      setSubscription(sub)
    } catch (err) {
      console.error('Push subscribe failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    setLoading(true)
    try {
      await subscription?.unsubscribe()
      await axiosInstance.delete('/api/push/subscribe')
      setSubscription(null)
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isSupported) return null

  return (
    <div className="tooltip tooltip-bottom" data-tip={subscription ? 'Disable push notifications' : 'Enable push notifications'}>
      <button
        onClick={subscription ? unsubscribe : subscribe}
        disabled={loading}
        className="btn btn-ghost btn-circle btn-sm"
        aria-label={
          subscription
            ? 'Disable push notifications'
            : 'Enable push notifications'
        }
      >
        <FontAwesomeIcon
          icon={subscription ? faBell : faBellSlash}
          className={`w-4 h-4 ${subscription ? 'text-primary' : 'opacity-50'}`}
        />
      </button>
    </div>
  )
}
