import { useState, useCallback, useEffect } from 'react'
import axiosInstance from '@/libs/axios'
import { urlBase64ToUint8Array, waitForServiceWorkerReady } from './utils'

export function usePushNotifications() {
  const [pushSupported, setPushSupported] = useState(false)
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null)
  const [pushLoading, setPushLoading] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')

  const checkPushSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setPushSupported(true)
    setPushPermission(Notification.permission)

    try {
      const registration = await waitForServiceWorkerReady()
      const sub = await registration.pushManager.getSubscription()
      setPushSubscription(sub)
    } catch {
      // SW not ready yet — push state stays as default (not subscribed)
    }
  }, [])

  useEffect(() => {
    checkPushSubscription()
  }, [checkPushSubscription])

  const subscribePush = async () => {
    setPushLoading(true)
    try {
      const permission = await Notification.requestPermission()
      setPushPermission(permission)

      if (permission !== 'granted') return

      const registration = await waitForServiceWorkerReady()

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set')
        return
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const serialized = sub.toJSON()
      await axiosInstance.post('/api/push/subscribe', {
        endpoint: serialized.endpoint,
        keys: serialized.keys,
      })

      setPushSubscription(sub)
    } catch (err) {
      console.error('Push subscribe failed:', err)
    } finally {
      setPushPermission(Notification.permission)
      setPushLoading(false)
    }
  }

  const unsubscribePush = async () => {
    setPushLoading(true)
    try {
      await pushSubscription?.unsubscribe()
      await axiosInstance.delete('/api/push/subscribe')
      setPushSubscription(null)
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
    } finally {
      setPushLoading(false)
    }
  }

  return {
    pushSupported,
    pushSubscription,
    pushLoading,
    pushPermission,
    subscribePush,
    unsubscribePush,
  }
}
